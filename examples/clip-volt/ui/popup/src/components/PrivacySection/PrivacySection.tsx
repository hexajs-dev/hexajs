import { Clock3, Eye, Lock } from 'lucide-react';
import { ClipVaultConfig } from '../../../../../src/contract/config';
import { Toggle } from '../shared/Toggle';

type PrivacySectionProps = { privacy: ClipVaultConfig['privacy']; onPrivacyChange: (key: keyof ClipVaultConfig['privacy'], value: boolean) => void };

export function PrivacySection({ privacy, onPrivacyChange }: PrivacySectionProps) {
  return (
    <section className="cv-section">
      <h2 className="cv-section-title">PRIVACY</h2>
      <div className="cv-panel">
        <div className="cv-setting-row">
          <div className="cv-setting-icon cv-setting-icon-domain"><Eye size={16} strokeWidth={2} /></div>
          <div className="cv-setting-content">
            <div className="cv-setting-label">Domain-scoped clipboard</div>
            <div className="cv-setting-description">Only show clips from current domain</div>
          </div>
          <Toggle checked={privacy.domainScoped} onChange={value => onPrivacyChange('domainScoped', value)} />
        </div>
        <div className="cv-setting-row">
          <div className="cv-setting-icon cv-setting-icon-sensitive"><Lock size={16} strokeWidth={2} /></div>
          <div className="cv-setting-content">
            <div className="cv-setting-label">Sensitive data detection</div>
            <div className="cv-setting-description">Auto-detect and mask API keys and passwords</div>
          </div>
          <Toggle checked={privacy.sensitiveDetection} onChange={value => onPrivacyChange('sensitiveDetection', value)} />
        </div>
        <div className="cv-setting-row cv-setting-row-last">
          <div className="cv-setting-icon cv-setting-icon-expiry"><Clock3 size={16} strokeWidth={2} /></div>
          <div className="cv-setting-content">
            <div className="cv-setting-label">Auto-expire clips</div>
            <div className="cv-setting-description">Delete after {privacy.autoExpireDays} days</div>
          </div>
          <Toggle checked={privacy.autoExpire} onChange={value => onPrivacyChange('autoExpire', value)} />
        </div>
      </div>
    </section>
  );
}
