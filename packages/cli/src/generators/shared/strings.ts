import * as path from 'path';

export function normalizeImportPath(absPath: string, outputDir: string): string {
  const stripped = absPath.replace(/\.ts$/, '');
  if (!outputDir || !path.isAbsolute(stripped)) {
    return stripped;
  }

  let rel = path.relative(outputDir, stripped).replace(/\\/g, '/');
  if (!rel.startsWith('.')) {
    rel = './' + rel;
  }

  return rel;
}

export function toLowerFirst(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
