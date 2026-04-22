/** Convert Windows backslashes to forward slashes for use in Chrome extension manifests. */
export function normalizeManifestPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}
