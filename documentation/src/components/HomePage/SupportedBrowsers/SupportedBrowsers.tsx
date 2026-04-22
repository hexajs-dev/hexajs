import type { CSSProperties } from 'react';
import { DOC_ICONS } from '@site/src/components/icons/lucide';
import './SupportedBrowsers.scss';

type SupportedBrowserItem = {
  name: string;
  icon: 'chrome' | 'firefox' | 'safari' | 'opera' | 'edge' | 'brave';
  accent: string;
};

type BrowserAccentStyle = CSSProperties & {
  '--browser-accent': string;
};

const supportedBrowsers: SupportedBrowserItem[] = [
  { name: 'Chrome', icon: 'chrome', accent: '#fbbc05' },
  { name: 'Firefox', icon: 'firefox', accent: '#ff7139' },
  { name: 'Safari', icon: 'safari', accent: '#0ea5e9' },
  { name: 'Opera', icon: 'opera', accent: '#ff1b2d' },
  { name: 'Edge', icon: 'edge', accent: '#0ea5a4' },
  { name: 'Brave', icon: 'brave', accent: '#fb542b' },
];

export function SupportedBrowsers() {
  return (
    <section className="supportedBrowsersSection">
      <div className="container">
        <div className="supportedBrowsersHeader">
          <h2 className="supportedBrowsersTitle">
            Supported <span className="accent">Browsers</span>
          </h2>
          <p className="supportedBrowsersSubtitle">
            Hexa CLI currently ships first-class targets for every browser platform exposed by the scaffold flow.
          </p>
        </div>

        <ul className="supportedBrowsersList" aria-label="Supported browsers">
          {supportedBrowsers.map(({ name, icon, accent }) => {
            const Icon = DOC_ICONS[icon];
            const style: BrowserAccentStyle = { '--browser-accent': accent };

            return (
              <li key={name} className="supportedBrowserItem" style={style}>
                <span className="supportedBrowserIcon" aria-hidden="true">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="supportedBrowserName">{name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}