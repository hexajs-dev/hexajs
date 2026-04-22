import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeChangedFile, loadContextMap, getDecoratorFallbackContexts } from '../src/hmr/rebuild-decision';
import { BuildContextMapRecord } from '../src/build/types';
import { writeSourceContextMap } from '../src/build/context-map.builder';

describe('rebuild-decision module', () => {
  describe('analyzeChangedFile', () => {
    it('returns affected contexts for a mapped file with single context', () => {
      const map: BuildContextMapRecord = {
        'src/services/logger.service.ts': { ui: true },
        'src/background/controller.ts': { background: true },
      };

      expect(analyzeChangedFile('src/services/logger.service.ts', map)).toEqual(['ui']);
      expect(analyzeChangedFile('src/background/controller.ts', map)).toEqual(['background']);
    });

    it('returns multiple contexts for a file affecting multiple contexts', () => {
      const map: BuildContextMapRecord = {
        'src/services/shared.service.ts': { background: true, content: true },
        'src/store/app.state.ts': { background: true, content: true, ui: true },
      };

      expect(analyzeChangedFile('src/services/shared.service.ts', map)).toEqual(['background', 'content']);
      expect(analyzeChangedFile('src/store/app.state.ts', map)).toEqual(['background', 'content', 'ui']);
    });

    it('returns empty array for unmapped files', () => {
      const map: BuildContextMapRecord = {
        'src/services/logger.service.ts': { ui: true },
      };

      expect(analyzeChangedFile('src/unknown/file.ts', map)).toEqual([]);
      expect(analyzeChangedFile('src/background/new-controller.ts', map)).toEqual([]);
    });

    it('normalizes window-style paths to forward slashes', () => {
      const map: BuildContextMapRecord = {
        'src/services/logger.service.ts': { ui: true },
      };

      expect(analyzeChangedFile('src\\services\\logger.service.ts', map)).toEqual(['ui']);
    });
  });

  describe('loadContextMap', () => {
    const hexaDir = path.join(process.cwd(), '.hexa');
    const hashedPrefix = '.ctx.';
    const hashedSuffix = '.bin';

    function cleanupMapFiles(): void {
      if (!fs.existsSync(hexaDir)) {
        return;
      }

      for (const fileName of fs.readdirSync(hexaDir)) {
        const isHashed = fileName.startsWith(hashedPrefix) && fileName.endsWith(hashedSuffix);
        const isLegacy = fileName === '.context-map.json' || fileName === 'build-context-map.json';
        if (isHashed || isLegacy) {
          fs.rmSync(path.join(hexaDir, fileName), { force: true });
        }
      }
    }

    beforeEach(() => {
      if (!fs.existsSync(hexaDir)) {
        fs.mkdirSync(hexaDir, { recursive: true });
      }
      cleanupMapFiles();
    });

    afterEach(() => {
      cleanupMapFiles();
    });

    it('loads context map from hashed persisted file', async () => {
      const testMap: BuildContextMapRecord = {
        'src/services/test.ts': { ui: true },
        'src/background/test.ts': { background: true },
      };

      writeSourceContextMap(testMap);

      const loaded = await loadContextMap();
      expect(loaded).toEqual(testMap);

      const hashedFiles = fs.readdirSync(hexaDir).filter((name) => name.startsWith(hashedPrefix) && name.endsWith(hashedSuffix));
      expect(hashedFiles.length).toBe(1);
    });

    it('returns empty map when file does not exist', async () => {
      const loaded = await loadContextMap();
      expect(loaded).toEqual({});
    });

    it('returns empty map when hashed payload is malformed', async () => {
      const malformedPath = path.join(hexaDir, '.ctx.badpayload.bin');
      fs.writeFileSync(malformedPath, 'invalid payload', 'utf-8');

      const loaded = await loadContextMap();
      expect(loaded).toEqual({});
    });
  });

  describe('getDecoratorFallbackContexts', () => {
    it('returns empty array (stub implementation)', async () => {
      const contexts = await getDecoratorFallbackContexts('src/services/test.ts');
      expect(contexts).toEqual([]);
    });

    it('calls decoratorAnalysis but returns empty (stub)', async () => {
      const contexts = await getDecoratorFallbackContexts('src/background/controller.ts');
      expect(contexts).toEqual([]);
      // Stub returns empty - actual decorator scanning not implemented yet
    });
  });
});
