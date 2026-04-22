import { Globe, X } from 'lucide-react';

type DomainCardProps = { domain: string; onRemove: (domain: string) => void };

export function DomainCard({ domain, onRemove }: DomainCardProps) {
  return (
    <div className="cv-domain-row">
      <Globe size={18} strokeWidth={1.8} />
      <span className="cv-domain-text">{domain}</span>
      <button className="cv-domain-remove-button" onClick={() => onRemove(domain)} aria-label={`Remove ${domain}`}>
        <X size={18} strokeWidth={1.9} />
      </button>
    </div>
  );
}
