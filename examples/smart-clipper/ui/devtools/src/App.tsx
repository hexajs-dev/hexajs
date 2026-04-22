import { inject } from "@hexajs/common";
import { HexaUIClient } from "@hexajs/ui";
import { useState } from "react";

const HexaLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
    <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" strokeWidth="5" />
    <path d="M35 42 L50 35 L65 42 M35 58 L50 65 L65 58 M50 35 L50 65 M38 46 L62 54 M62 46 L38 54" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const GhostHexa = () => (
  <svg className="dt-ghost-hexa" width="200" height="200" viewBox="0 0 100 100" fill="none">
    <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" strokeWidth="4" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LightModeIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"
    />
  </svg>
);

const DarkModeIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"
    />
  </svg>
);

const MDN_LINKS = [
  { label: 'devtools API',               desc: 'Core API for creating browser DevTools extensions',        href: 'https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools' },
  { label: 'devtools.panels',             desc: 'Create and manage custom panels in the DevTools',           href: 'https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools/panels' },
  { label: 'devtools.inspectedWindow',    desc: 'Interact with the window being inspected',                  href: 'https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools/inspectedWindow' },
  { label: 'devtools.network',            desc: 'Access network request information',                        href: 'https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools/network' },
];

const STEPS = [
  { title: 'Register DevTools Panel',   desc: 'Add the devtools_page to your manifest.json to register your DevTools panel',  code: '"devtools_page": "devtools.html"' },
  { title: 'Create Custom Panel',       desc: 'Use the devtools.panels API to create custom panels in the browser DevTools',    code: 'browser.devtools.panels.create( "HexaJS", "icon.png", "panel.html" );' },
  { title: 'Access Inspected Window',   desc: 'Interact with the page being inspected using devtools.inspectedWindow API',      code: "browser.devtools.inspectedWindow.eval( \"console.log('Hello from HexaJS!')\" );" },
];

const CAPABILITIES = [
  { icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ), title: 'Component Inspector', desc: 'Inspect and debug framework components in real-time' },
  { icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ), title: 'Performance Profiler', desc: 'Monitor render times and performance metrics' },
  { icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ), title: 'State Manager', desc: 'Track and modify application state' },
  { icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ), title: 'Event Logger', desc: 'Capture and analyze events and interactions' },
];

const RESOURCES = [
  { label: 'WebExtensions API Overview',        href: 'https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API' },
  { label: 'Chrome DevTools Extensions',        href: 'https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools' },
  { label: 'WebExtensions Examples on GitHub',  href: 'https://github.com/mdn/webextensions-examples' },
];

export function App() {
  const [dark, setDark] = useState(true);

  const hexaClient = inject(HexaUIClient);

  hexaClient.sendMessage('devtools:panelOpened', { timestamp: Date.now() }).catch(err => {
    console.error('Error sending devtools:panelOpened message:', err);
  });

  return (
    <div className={`dt-root${dark ? ' dark' : ''}`}>
      <header className="dt-header">
        <button className="dt-theme-btn" aria-label="Toggle theme" onClick={() => setDark(v => !v)}>
          {dark ? <DarkModeIcon /> : <LightModeIcon />}
        </button>
        <GhostHexa />
        <div className="dt-header-inner">
          <div className="dt-logo">
            <HexaLogo />
          </div>
          <div className="dt-header-text">
            <h1>HexaJS DevTools</h1>
            <p className="dt-tagline">Browser DevTools Extension Panel</p>
          </div>
        </div>
        <span className="dt-version-badge">DevTools Template &bull; v1.0.0</span>
      </header>

      <main className="dt-content">
        <section className="dt-section">
          <h2 className="dt-section-title">
            <SettingsIcon />
            DevTools Panel Template
          </h2>
          <p className="dt-section-desc">
            This is your DevTools panel entry point. Build powerful inspection and debugging tools for your web
            applications. Use the MDN Web Extensions API documentation below to get started with creating custom
            DevTools functionality.
          </p>
        </section>

        <section className="dt-section">
          <h2 className="dt-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            MDN Web Extensions API Documentation
          </h2>
          <div className="dt-link-cards">
            {MDN_LINKS.map(({ label, desc, href }) => (
              <a key={label} className="dt-link-card" href={href} target="_blank" rel="noreferrer">
                <div className="dt-link-card-body">
                  <span className="dt-link-card-label">{label}</span>
                  <ExternalIcon />
                </div>
                <p className="dt-link-card-desc">{desc}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="dt-section">
          <h2 className="dt-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Quick Start Guide
          </h2>
          <div className="dt-steps">
            {STEPS.map(({ title, desc, code }, i) => (
              <div key={title} className="dt-step">
                <div className="dt-step-header">
                  <span className="dt-step-num">{i + 1}</span>
                  <div>
                    <div className="dt-step-title">{title}</div>
                    <div className="dt-step-desc">{desc}</div>
                  </div>
                </div>
                <pre className="dt-code"><code>{code}</code></pre>
              </div>
            ))}
          </div>
        </section>

        <section className="dt-section">
          <h2 className="dt-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            What You Can Build
          </h2>
          <div className="dt-capability-grid">
            {CAPABILITIES.map(({ icon, title, desc }) => (
              <div key={title} className="dt-capability-card">
                <div className="dt-capability-icon">{icon}</div>
                <div>
                  <div className="dt-capability-title">{title}</div>
                  <div className="dt-capability-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dt-resources-card">
            <h3 className="dt-resources-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Additional Resources
            </h3>
            <ul className="dt-resources-list">
              {RESOURCES.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer">
                    <ExternalIcon />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="dt-footer">
        <span className="dt-footer-brand">
          <svg width="13" height="13" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" strokeWidth="10" />
          </svg>
          HexaJS DevTools Template
        </span>
        <a href="https://hexajs.io/docs" target="_blank" rel="noreferrer">
          <ExternalIcon />
          Documentation
        </a>
      </footer>
    </div>
  );
}
