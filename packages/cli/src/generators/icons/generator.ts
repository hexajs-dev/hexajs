import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { ResolvedBuildConfig } from '../../bin/config/resolve';
import type { ManifestUiEntries } from '../manifest/generator';
import { resolveCoreDefaultIconPath } from './paths';
import { normalizeManifestPath } from '../../shared/path-utils';

const ICON_SIZES = [16, 32, 48, 128] as const;
const SUPPORTED_ICON_EXTENSIONS = new Set(['.svg', '.png']);
/** Minimum intermediate raster dimension — ensures enough detail for clean downscaling. */
const MIN_RASTER_PX = 1024;
/** Safety cap so a pathologically tiny viewBox doesn't cause a huge allocation. */
const MAX_DENSITY = 4000;
const DEFAULT_DENSITY = 2400;

function resolveConfiguredIconPath(configuredPath?: string): string | undefined {
    if (!configuredPath) return undefined;
    return path.resolve(process.cwd(), configuredPath);
}

function isSupportedIconSource(filePath: string): boolean {
    return SUPPORTED_ICON_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

/**
 * Removes explicit width/height from the SVG opening tag so that
 * density controls the rasterisation size purely via the viewBox.
 * Without this, librsvg may render at a fixed pixel size (ignoring density)
 * or combine physical units (mm) with density causing oversized rasters.
 */
function normalizeSvgDimensions(content: string): string {
    const start = content.indexOf('<svg');
    if (start === -1) return content;
    const end = content.indexOf('>', start);
    if (end === -1) return content;
    const tag = content.slice(start, end + 1)
        .replace(/\s+width="[^"]*"/g, '')
        .replace(/\s+height="[^"]*"/g, '');
    return content.slice(0, start) + tag + content.slice(end + 1);
}

/**
 * Parses the viewBox to compute the DPI that yields at least MIN_RASTER_PX
 * on the longest axis. Falls back to DEFAULT_DENSITY if viewBox is missing.
 *
 * Formula: density = ceil(72 × MIN_RASTER_PX / maxViewBoxDim)
 * - viewBox="0 0 24 24"  → density 3072 → 1024 px intermediate
 * - viewBox="0 0 65 72"  → density 1024 → 1024 px intermediate
 */
function calculateOptimalDensity(svgContent: string): number {
    const match = svgContent.match(/viewBox=["']([^"']+)["']/);
    if (!match) return DEFAULT_DENSITY;
    const parts = match[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length < 4 || parts.some(isNaN)) return DEFAULT_DENSITY;
    const maxDim = Math.max(parts[2], parts[3]);
    if (maxDim <= 0) return DEFAULT_DENSITY;
    return Math.min(Math.ceil(72 * MIN_RASTER_PX / maxDim), MAX_DENSITY);
}

/**
 * Two-pass approach:
 * 1. Rasterise SVG at optimal density (or load PNG) → trim transparent padding → large PNG buffer.
 * 2. Caller downscales that buffer to each target size with Lanczos3 + optional sharpening.
 */
async function rasterizeAndTrim(sourcePath: string): Promise<Buffer> {
    const ext = path.extname(sourcePath).toLowerCase();
    if (ext === '.svg') {
        const svgContent = normalizeSvgDimensions(fs.readFileSync(sourcePath, 'utf-8'));
        const density = calculateOptimalDensity(svgContent);
        return sharp(Buffer.from(svgContent), { density })
            .trim({ threshold: 5 })
            .png()
            .toBuffer();
    }
    return sharp(sourcePath).trim({ threshold: 5 }).png().toBuffer();
}

async function generateIconsFromBuffer(source: Buffer, iconsDest: string): Promise<void> {
    fs.mkdirSync(iconsDest, { recursive: true });
    await Promise.all(
        ICON_SIZES.map(async (size) => {
            const outPath = path.join(iconsDest, `icon${size}.png`);
            let pipeline = sharp(source)
                .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 });
            if (size <= 48) {
                pipeline = pipeline.sharpen({ sigma: 0.5 });
            }
            await pipeline
                .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
                .toFile(outPath);
        }),
    );
}

async function writeManifestIcons(resolved: ResolvedBuildConfig, outputDir: string, cachedSource?: Buffer): Promise<Buffer | undefined> {
    const iconsDest = path.join(outputDir, 'assets', 'icons');
    const configuredIcon = resolveConfiguredIconPath(resolved.ui?.popup?.icons);
    const defaultCoreIcon = resolveCoreDefaultIconPath();
    const sourceIcon = configuredIcon ?? defaultCoreIcon;

    if (sourceIcon && fs.existsSync(sourceIcon) && fs.statSync(sourceIcon).isFile() && isSupportedIconSource(sourceIcon)) {
        try {
            const source = cachedSource ?? await rasterizeAndTrim(sourceIcon);
            await generateIconsFromBuffer(source, iconsDest);
            console.log(`✓ Icons generated from: ${sourceIcon}`);
            return source;
        } catch (error) {
            console.warn(`⚠ Failed to generate icons from ${sourceIcon}.`);
            console.warn(error instanceof Error ? `  ${error.message}` : `  ${String(error)}`);
        }
    } else if (configuredIcon) {
        console.warn(`⚠ ui.popup.icons must point to an existing SVG or PNG file: ${configuredIcon}`);
    } else {
        console.warn('⚠ No icon source found. Set `ui.popup.icons` in hexa-cli.config.json or install @hexajs-dev/core with assets/hexa-logo.svg.');
    }
    return undefined;
}

function injectOrReplaceFavicon(html: string, href: string): string {
    const faviconTag = `<link rel="icon" type="image/png" href="${href}">`;
    const iconLinkPattern = /<link[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*>/i;

    if (iconLinkPattern.test(html)) {
        return html.replace(iconLinkPattern, faviconTag);
    }

    if (html.includes('</head>')) {
        return html.replace('</head>', `  ${faviconTag}\n</head>`);
    }

    return `${faviconTag}\n${html}`;
}

async function writeDevtoolsFavicon(resolved: ResolvedBuildConfig, outputDir: string, uiEntries: ManifestUiEntries, cachedSource?: Buffer): Promise<void> {
    if (!uiEntries.devtools) return;

    const devtoolsHtmlPath = path.join(outputDir, ...uiEntries.devtools.split('/'));
    if (!fs.existsSync(devtoolsHtmlPath) || !fs.statSync(devtoolsHtmlPath).isFile()) {
        return;
    }

    const devtoolsDir = path.dirname(devtoolsHtmlPath);
    const devtoolsIconPath = path.join(devtoolsDir, 'devtools-icon.png');
    const configuredDevtoolsIcon = resolveConfiguredIconPath(resolved.ui?.devtools?.icons ?? resolved.ui?.popup?.icons);
    const defaultCoreIcon = resolveCoreDefaultIconPath();
    const sourceIcon = configuredDevtoolsIcon ?? defaultCoreIcon;

    try {
        if (sourceIcon && fs.existsSync(sourceIcon) && fs.statSync(sourceIcon).isFile() && isSupportedIconSource(sourceIcon)) {
            const source = cachedSource ?? await rasterizeAndTrim(sourceIcon);
            let pipeline = sharp(source)
                .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
                .sharpen({ sigma: 0.5 });
            await pipeline
                .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
                .toFile(devtoolsIconPath);
        } else {
            const fallbackIcon = path.join(outputDir, 'assets', 'icons', 'icon32.png');
            if (fs.existsSync(fallbackIcon)) {
                fs.copyFileSync(fallbackIcon, devtoolsIconPath);
            }
        }

        if (!fs.existsSync(devtoolsIconPath)) return;

        const html = fs.readFileSync(devtoolsHtmlPath, 'utf-8');
        const patched = injectOrReplaceFavicon(html, './devtools-icon.png');
        fs.writeFileSync(devtoolsHtmlPath, patched, 'utf-8');
        console.log(`✓ DevTools favicon wired: ${normalizeManifestPath(path.relative(outputDir, devtoolsHtmlPath))}`);
    } catch (error) {
        console.warn(`⚠ Failed to wire DevTools favicon for ${devtoolsHtmlPath}`);
        console.warn(error instanceof Error ? `  ${error.message}` : `  ${String(error)}`);
    }
}

export async function writeIconsArtifacts(resolved: ResolvedBuildConfig, outputDir: string, uiEntries: ManifestUiEntries): Promise<void> {
    const cachedSource = await writeManifestIcons(resolved, outputDir);
    await writeDevtoolsFavicon(resolved, outputDir, uiEntries, cachedSource);
}
