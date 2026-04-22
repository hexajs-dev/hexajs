import * as fs from 'fs';
import * as path from 'path';
import type { HexaUiSurfaceConfig } from '../core/types';
import { writeDevtoolsBridge } from './bridge';

/**
 * Copy a pre-built devtools dist into the extension output directory.
 * Returns the manifest-relative entry path.
 */
export function copyExternalDevtools(config: HexaUiSurfaceConfig, outputDir: string): string {
  if (!config.distDir) {
    throw new Error('UI devtools is set to external mode but "distDir" is missing.');
  }
  if (!config.indexFile) {
    throw new Error('UI devtools is set to external mode but "indexFile" is missing.');
  }

  const sourceDist = path.resolve(process.cwd(), config.distDir);
  if (!fs.existsSync(sourceDist) || !fs.statSync(sourceDist).isDirectory()) {
    throw new Error(`UI devtools distDir does not exist or is not a directory: ${sourceDist}`);
  }

  const sourceIndex = path.join(sourceDist, config.indexFile);
  if (!fs.existsSync(sourceIndex) || !fs.statSync(sourceIndex).isFile()) {
    throw new Error(`UI devtools indexFile does not exist inside distDir: ${sourceIndex}`);
  }

  const targetBase = path.join(outputDir, 'ui', 'devtools');
  fs.mkdirSync(targetBase, { recursive: true });
  fs.cpSync(sourceDist, targetBase, { recursive: true, force: true });

  const normalizedIndexFile = config.indexFile.replace(/\\/g, '/');
  const panelManifestPath = `ui/devtools/${normalizedIndexFile}`;
  const bridgeManifestEntry = writeDevtoolsBridge(targetBase, panelManifestPath);
  console.log(`✓ devtools UI copied: ${sourceDist} → ${targetBase}`);
  return bridgeManifestEntry;
}
