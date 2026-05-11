import { describe, expect, it } from 'vitest';
import { PortPermissionAnalyzer } from '../src/generators/manifest/permissions/port-permission.analyzer';

describe('port permission analyzer', () => {
  it('infers and de-duplicates permissions for mapped used ports', () => {
    const analyzer = new PortPermissionAnalyzer();
    const result = analyzer.analyze('chrome', ['ClipboardPort', 'DownloadsPort', 'ClipboardPort', 'UnknownPort']);

    expect(result.permissions).toEqual(['clipboardRead', 'clipboardWrite', 'downloads']);
    expect(result.hostPermissions).toEqual([]);
  });

  it('applies shared mappings across all target platforms', () => {
    const analyzer = new PortPermissionAnalyzer();
    const platforms = ['chrome', 'edge', 'brave', 'opera', 'firefox', 'safari'];

    for (const platform of platforms) {
      const result = analyzer.analyze(platform, ['NotificationsPort']);
      expect(result.permissions).toEqual(['notifications']);
    }
  });

  it('skips userScripts permission on unsupported platforms', () => {
    const analyzer = new PortPermissionAnalyzer();

    const safariResult = analyzer.analyze('safari', ['UserScriptsPort']);
    const firefoxResult = analyzer.analyze('firefox', ['UserScriptsPort']);

    expect(safariResult.permissions).toEqual([]);
    expect(firefoxResult.permissions).toEqual(['userScripts']);
  });
});
