import * as fs from 'fs';
import * as path from 'path';
import type { HexaUiSurfaceConfig } from '../core/types';
import { normalizeManifestPath } from '../core/normalize';

function resolveForComparison(filePath: string): string {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
}

function isPathWithinRoot(rootPath: string, candidatePath: string): boolean {
  const relative = path.relative(rootPath, candidatePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Copy a pre-built popup dist into the extension output directory.
 * Returns the manifest-relative entry path.
 */
export function copyExternalPopup(config: HexaUiSurfaceConfig, outputDir: string): string {
  if (!config.distDir) {
    throw new Error('UI popup is set to external mode but "distDir" is missing.');
  }
  if (!config.indexFile) {
    throw new Error('UI popup is set to external mode but "indexFile" is missing.');
  }

  const workspaceRoot = resolveForComparison(process.cwd());
  const sourceDist = path.resolve(workspaceRoot, config.distDir);
  const sourceDistReal = resolveForComparison(sourceDist);
  if (!isPathWithinRoot(workspaceRoot, sourceDistReal)) {
    throw new Error(`UI popup distDir must stay inside project root: ${sourceDistReal}`);
  }

  if (!fs.existsSync(sourceDistReal) || !fs.statSync(sourceDistReal).isDirectory()) {
    throw new Error(`UI popup distDir does not exist or is not a directory: ${sourceDistReal}`);
  }

  const normalizedIndexFile = config.indexFile.replace(/\\+/g, '/');
  const sourceIndex = path.resolve(sourceDistReal, normalizedIndexFile);
  if (!isPathWithinRoot(sourceDistReal, sourceIndex)) {
    throw new Error(`UI popup indexFile must stay inside distDir: ${config.indexFile}`);
  }

  if (!fs.existsSync(sourceIndex) || !fs.statSync(sourceIndex).isFile()) {
    throw new Error(`UI popup indexFile does not exist inside distDir: ${sourceIndex}`);
  }

  const sourceIndexReal = resolveForComparison(sourceIndex);
  if (!isPathWithinRoot(sourceDistReal, sourceIndexReal)) {
    throw new Error(`UI popup indexFile resolves outside distDir: ${sourceIndexReal}`);
  }

  const targetBase = path.join(outputDir, 'ui', 'popup');
  fs.mkdirSync(targetBase, { recursive: true });
  fs.cpSync(sourceDistReal, targetBase, { recursive: true, force: true });

  const manifestEntry = normalizeManifestPath(
    path.posix.join('ui', 'popup', normalizedIndexFile)
  );
  console.log(`✓ popup UI copied: ${sourceDistReal} → ${targetBase}`);
  return manifestEntry;
}
