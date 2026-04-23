import { useCallback, useEffect, useState } from 'react';
import { inject } from '@hexajs/common';
import { HexaUIClient } from '@hexajs/ui';
import { Moon, SunMedium } from 'lucide-react';
import { configApi } from '../../../src/contract/api';
import { ClipVaultConfig, DEFAULT_CONFIG } from '../../../src/contract/config';
import { ConfigResponseMessage, GetConfigMessage, UpdateConfigMessage } from '../../../src/contract/messages';
import { normalizeDomainInput } from '../../shared/utils/domain';
import { hasHexaError } from '../../shared/utils/message';
import { isMacPlatform } from '../../shared/utils/platform';
import clipVoltLogoUrl from '../../../src/assets/clip-volt.svg';
import { PrivacySection } from './components/PrivacySection/PrivacySection';
import { ShortcutSection } from './components/ShortcutSection/ShortcutSection';
import { StorageSection } from './components/StorageSection/StorageSection';
import { URLRulesSection } from './components/URLRulesSection/URLRulesSection';
import './style.css';

export function App() {
  const [config, setConfig] = useState<ClipVaultConfig>({ ...DEFAULT_CONFIG });
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const hexaUIClient = inject(HexaUIClient);
        const response = await hexaUIClient.sendMessage<GetConfigMessage, ConfigResponseMessage>(configApi.Get, new GetConfigMessage(Date.now()));
        if (response && !hasHexaError(response) && response.config) {
          setConfig(response.config);
        }
      } catch (err) {
        console.warn('Failed to load config:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sendConfigUpdate = useCallback((partial: Partial<ClipVaultConfig>) => {
    try {
      const hexaUIClient = inject(HexaUIClient);
      hexaUIClient.sendMessage<UpdateConfigMessage, ConfigResponseMessage>(configApi.Update, new UpdateConfigMessage(partial)).catch(err => console.error('Config update failed:', err));
    } catch (err) {
      console.error('Config update error:', err);
    }
  }, []);

  const updatePrivacy = useCallback((key: keyof ClipVaultConfig['privacy'], value: boolean) => {
    setConfig(prev => {
      const next = { ...prev, privacy: { ...prev.privacy, [key]: value } };
      sendConfigUpdate({ privacy: next.privacy });
      return next;
    });
  }, [sendConfigUpdate]);

  const updateMaxItems = useCallback((value: number) => {
    setConfig(prev => {
      const next = { ...prev, storage: { ...prev.storage, maxItems: value } };
      sendConfigUpdate({ storage: next.storage });
      return next;
    });
  }, [sendConfigUpdate]);

  const addDomain = useCallback(() => {
    const domain = normalizeDomainInput(domainInput);
    if (!domain) return;
    setConfig(prev => {
      if (prev.urlRules.exclude.some(r => r.domain === domain)) return prev;
      const updatedRules = { ...prev.urlRules, exclude: [...prev.urlRules.exclude, { domain }] };
      const next = { ...prev, urlRules: updatedRules };
      sendConfigUpdate({ urlRules: updatedRules });
      return next;
    });
    setDomainInput('');
  }, [domainInput, sendConfigUpdate]);

  const removeDomain = useCallback((domain: string) => {
    setConfig(prev => {
      const updatedRules = { ...prev.urlRules, exclude: prev.urlRules.exclude.filter(r => r.domain !== domain) };
      const next = { ...prev, urlRules: updatedRules };
      sendConfigUpdate({ urlRules: updatedRules });
      return next;
    });
  }, [sendConfigUpdate]);

  const onToggleTheme = () => {
    const next = config.theme === 'light' ? 'dark' : 'light';
    setConfig(prev => ({ ...prev, theme: next }));
    sendConfigUpdate({ theme: next });
  };

  const isMac = isMacPlatform();

  if (loading) {
    return <div className={`cv-root cv-root--${config.theme}`}><div className="cv-loading">Loading...</div></div>;
  }

  return (
    <div className={`cv-root cv-root--${config.theme}`}>
      <header className="cv-header">
        <div className="cv-header-brand">
          <div className="cv-header-brand-icon">
            <img src={clipVoltLogoUrl} alt="" aria-hidden="true" />
          </div>
          <div>
            <h1 className="cv-header-title">ClipVault</h1>
            <p className="cv-header-subtitle">Settings</p>
          </div>
        </div>
        <button className="cv-header-theme-button" onClick={onToggleTheme} aria-label="Toggle theme">
          {config.theme === 'dark' ? <SunMedium size={19} /> : <Moon size={19} />}
        </button>
      </header>

      <main className="cv-body">
        <PrivacySection privacy={config.privacy} onPrivacyChange={updatePrivacy} />
        <StorageSection maxItems={config.storage.maxItems} onMaxItemsChange={updateMaxItems} />
        <URLRulesSection domainInput={domainInput} excludeRules={config.urlRules.exclude} onDomainInputChange={setDomainInput} onAddDomain={addDomain} onRemoveDomain={removeDomain} />
        <ShortcutSection isMac={isMac} />
      </main>
    </div>
  );
}
