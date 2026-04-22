/**
 * generate-icons.ts
 *
 * Converts the HexaJS logo SVG into the PNG sizes required by a browser
 * extension manifest (16, 32, 48, 128).
 *
 * Output: src/bin/programs/new/assets/icons/
 *
 * Usage:
 *   pnpm generate:icons
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import sharp from 'sharp';

const SIZES = [16, 32, 48, 128] as const;

const ROOT = path.resolve(__dirname, '..');
const SVG_PATH = path.join(ROOT, 'src/bin/programs/new/assets/logo.svg');
const OUT_DIR = path.join(ROOT, 'src/assets/icons');
const MIN_RASTER_PX = 1024;
const MAX_DENSITY = 4000;
const DEFAULT_DENSITY = 2400;

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

function calculateOptimalDensity(svgContent: string): number {
    const match = svgContent.match(/viewBox=["']([^"']+)["']/);
    if (!match) return DEFAULT_DENSITY;
    const parts = match[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length < 4 || parts.some(isNaN)) return DEFAULT_DENSITY;
    const maxDim = Math.max(parts[2], parts[3]);
    if (maxDim <= 0) return DEFAULT_DENSITY;
    return Math.min(Math.ceil(72 * MIN_RASTER_PX / maxDim), MAX_DENSITY);
}

async function generateIcons(): Promise<void> {
    await fs.mkdir(OUT_DIR, { recursive: true });

    const svgContent = normalizeSvgDimensions(await fs.readFile(SVG_PATH, 'utf-8'));
    const density = calculateOptimalDensity(svgContent);

    // Pass 1: rasterise at optimal density and trim transparent padding.
    const source = await sharp(Buffer.from(svgContent), { density })
        .trim({ threshold: 5 })
        .png()
        .toBuffer();

    // Pass 2: downscale the trimmed raster to each target size.
    await Promise.all(
        SIZES.map(async (size) => {
            const outPath = path.join(OUT_DIR, `icon${size}.png`);
            let pipeline = sharp(source)
                .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 });
            if (size <= 48) {
                pipeline = pipeline.sharpen({ sigma: 0.5 });
            }
            await pipeline
                .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
                .toFile(outPath);
            console.log(`  ✓ icon${size}.png`);
        }),
    );

    console.log(`\nIcons written to ${path.relative(ROOT, OUT_DIR)}`);
}

generateIcons().catch((err) => {
    console.error('Failed to generate icons:', err);
    process.exit(1);
});
