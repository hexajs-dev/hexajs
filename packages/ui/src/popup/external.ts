import * as fs from 'fs';
import * as path from 'path';
import type { HexaUiSurfaceConfig } from '../core/types';
import { normalizeManifestPath } from '../core/normalize';

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

  const sourceDist = path.resolve(process.cwd(), config.distDir);
  if (!fs.existsSync(sourceDist) || !fs.statSync(sourceDist).isDirectory()) {
    throw new Error(`UI popup distDir does not exist or is not a directory: ${sourceDist}`);
  }

  const sourceIndex = path.join(sourceDist, config.indexFile);
  if (!fs.existsSync(sourceIndex) || !fs.statSync(sourceIndex).isFile()) {
    throw new Error(`UI popup indexFile does not exist inside distDir: ${sourceIndex}`);
  }

  const targetBase = path.join(outputDir, 'ui', 'popup');
  fs.mkdirSync(targetBase, { recursive: true });
  fs.cpSync(sourceDist, targetBase, { recursive: true, force: true });

  const manifestEntry = normalizeManifestPath(
    path.posix.join('ui', 'popup', config.indexFile.replace(/\\/g, '/'))
  );
  console.log(`✓ popup UI copied: ${sourceDist} → ${targetBase}`);
  return manifestEntry;
}
