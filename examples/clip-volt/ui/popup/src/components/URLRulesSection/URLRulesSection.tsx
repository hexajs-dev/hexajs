import { ShieldAlert } from 'lucide-react';
import { UrlRule } from '../../../../../src/contract/config';
import { DomainCard } from '../DomainCard/DomainCard';

type URLRulesSectionProps = { domainInput: string; excludeRules: UrlRule[]; onDomainInputChange: (value: string) => void; onAddDomain: () => void; onRemoveDomain: (domain: string) => void };

export function URLRulesSection({ domainInput, excludeRules, onDomainInputChange, onAddDomain, onRemoveDomain }: URLRulesSectionProps) {
  return (
    <section className="cv-section">
      <h2 className="cv-section-title">EXCLUDE URLS</h2>
      <div className="cv-panel">
        <div className="cv-domain-input-row">
          <input className="cv-domain-input" type="text" placeholder="Add domain to exclude (e.g. github.com)" value={domainInput} onChange={event => onDomainInputChange(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') onAddDomain(); }} />
          <button className="cv-domain-add-button" onClick={onAddDomain}>+</button>
        </div>
      </div>

      {excludeRules.length > 0 ? (
        <div className="cv-domain-list">
          <div className="cv-domain-list-header cv-domain-list-header-excluded">
            <ShieldAlert size={13} strokeWidth={2} />
            <span>Excluded domains</span>
          </div>
          <div className="cv-domain-list-panel">
            {excludeRules.map(rule => <DomainCard key={rule.domain} domain={rule.domain} onRemove={onRemoveDomain} />)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
