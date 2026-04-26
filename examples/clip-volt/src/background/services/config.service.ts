import { Injectable, InjectableContext } from '@hexajs-dev/common';
import { StoragePort } from '@hexajs-dev/ports';
import { ClipVaultConfig, CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '../../contract/config';

@Injectable({ context: InjectableContext.Background })
export class ConfigService {
  constructor(private readonly storagePort: StoragePort) {}

  async loadConfig(): Promise<ClipVaultConfig> {
    const result = await this.storagePort.get('local', CONFIG_STORAGE_KEY);
    const stored = result[CONFIG_STORAGE_KEY];
    if (!stored) {
      return { ...DEFAULT_CONFIG };
    }
    return {
      privacy: { ...DEFAULT_CONFIG.privacy, ...stored.privacy },
      storage: { ...DEFAULT_CONFIG.storage, ...stored.storage },
      urlRules: { exclude: stored.urlRules?.exclude ?? [] },
      theme: stored.theme ?? DEFAULT_CONFIG.theme,
    };
  }

  async saveConfig(config: ClipVaultConfig): Promise<void> {
    await this.storagePort.set('local', { [CONFIG_STORAGE_KEY]: config });
  }

  mergeConfig(current: ClipVaultConfig, partial: Partial<ClipVaultConfig>): ClipVaultConfig {
    return {
      privacy: { ...current.privacy, ...partial.privacy },
      storage: { ...current.storage, ...partial.storage },
      urlRules: partial.urlRules ? { exclude: partial.urlRules.exclude ?? current.urlRules.exclude } : current.urlRules,
      theme: partial.theme ?? current.theme,
    };
  }
}
