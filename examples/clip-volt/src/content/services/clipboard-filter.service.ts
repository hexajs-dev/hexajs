import { Injectable, InjectableContext } from '@hexajs-dev/common';
import { ClipVaultConfig } from '../../contract/config';
import { ClipItem } from '../../contract/messages';

@Injectable({ context: InjectableContext.Content })
export class ClipboardFilterService {
  filterClips(clips: ClipItem[], config: ClipVaultConfig, currentDomain: string): ClipItem[] {
    let filtered = clips;
    if (config.privacy.domainScoped) {
      filtered = filtered.filter(c => c.sourceDomain === currentDomain);
    }
    filtered = filtered.filter(c => !this.isDomainExcluded(config, c.sourceDomain));
    return filtered;
  }

  isDomainExcluded(config: ClipVaultConfig, domain: string): boolean {
    if (!domain || config.urlRules.exclude.length === 0) {
      return false;
    }
    const excludeDomains = new Set(config.urlRules.exclude.map(r => r.domain));
    return excludeDomains.has(domain.toLowerCase());
  }

  canCopyOnDomain(config: ClipVaultConfig, currentDomain: string): boolean {
    return !this.isDomainExcluded(config, currentDomain.toLowerCase());
  }

  maskSensitiveText(text: string): string {
    if (text.length <= 12) {
      return '*'.repeat(text.length);
    }
    const visibleStart = text.substring(0, 6);
    const visibleEnd = text.substring(text.length - 6);
    return `${visibleStart}${'*'.repeat(Math.min(text.length - 12, 20))}${visibleEnd}`;
  }
}
