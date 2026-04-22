/** Plain HTML popup -- used when the user did not opt into the React scaffold. */
export const popupFallbackHtmlTemplate = (): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HexaJS Popup</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      /* ---- theme tokens -------------------------------------------------------------- */
      .popup-root {
        --ph-bg:       #0a0a1a;
        --ph-text:     #ffffff;
        --ph-sub:      rgba(255,255,255,.65);
        --ph-ghost:    rgba(255,255,255,.06);
        --ver-bg:      rgba(255,255,255,.13);
        --ver-text:    rgba(255,255,255,.82);
        --tog-bg:      rgba(255,255,255,.15);
        --tog-hover:   rgba(255,255,255,.25);
        --tog-text:    rgba(255,255,255,.85);
        --body-bg:     #ffffff;
        --body-text:   #111827;
        --sub-text:    #6b7280;
        --card-bg:     #f9fafb;
        --card-border: #e5e7eb;
        --icon-bg:     #f3f4f6;
        --icon-border: #e5e7eb;
        --btn-bg:      transparent;
        --btn-border:  #1f2937;
        --btn-text:    #111827;
        --btn-hover:   #f3f4f6;
        --next-bg:     #f3f4f6;
        --next-border: #e5e7eb;
        --foot-border: #e5e7eb;
        --foot-text:   #9ca3af;
        --foot-link:   #6b7280;
        --accent:      #4f46e5;
      }

      .popup-root.dark {
        --ph-bg:       #f3f4f6;
        --ph-text:     #111827;
        --ph-sub:      rgba(17,24,39,.6);
        --ph-ghost:    rgba(17,24,39,.07);
        --ver-bg:      rgba(0,0,0,.08);
        --ver-text:    rgba(17,24,39,.72);
        --tog-bg:      rgba(0,0,0,.10);
        --tog-hover:   rgba(0,0,0,.17);
        --tog-text:    #374151;
        --body-bg:     #111827;
        --body-text:   #f9fafb;
        --sub-text:    #9ca3af;
        --card-bg:     #1f2937;
        --card-border: #374151;
        --icon-bg:     #374151;
        --icon-border: #4b5563;
        --btn-bg:      transparent;
        --btn-border:  #4b5563;
        --btn-text:    #f9fafb;
        --btn-hover:   #1f2937;
        --next-bg:     #1f2937;
        --next-border: #374151;
        --foot-border: #374151;
        --foot-text:   #6b7280;
        --foot-link:   #9ca3af;
      }

      /* ---- layout shell -------------------------------------------------------------- */
      .popup-root {
        width: 320px;
        min-height: 520px;
        display: flex;
        flex-direction: column;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        background: var(--body-bg);
        color: var(--body-text);
      }

      /* ---- header -------------------------------------------------------------------------- */
      .popup-header {
        position: relative;
        background: var(--ph-bg);
        color: var(--ph-text);
        padding: 28px 20px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        overflow: hidden;
        transition: background 0.25s;
      }

      .theme-btn {
        position: absolute;
        top: 12px; right: 12px;
        width: 32px; height: 32px;
        border: none; border-radius: 50%;
        background: transparent;
        color: var(--tog-text);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        z-index: 2;
      }
      .theme-btn:hover { background: var(--tog-hover); }

      .theme-btn svg {
        width: 24px;
        height: 24px;
      }

      .ghost-hexa {
        position: absolute;
        right: -36px; bottom: -36px;
        opacity: .45;
        pointer-events: none;
        color: var(--ph-ghost);
      }

      .logo-icon { margin-bottom: 4px; color: var(--ph-text); }

      .popup-header h1 {
        font-size: 22px; font-weight: 700;
        letter-spacing: -.3px; color: var(--ph-text); z-index: 1;
      }

      .tagline { font-size: 12.5px; color: var(--ph-sub); z-index: 1; }

      .version-badge {
        margin-top: 6px;
        padding: 3px 12px;
        border-radius: 999px;
        background: var(--ver-bg);
        color: var(--ver-text);
        font-size: 12px; letter-spacing: .3px; z-index: 1;
      }

      /* ---- content ------------------------------------------------------------------------ */
      .popup-content {
        flex: 1;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        background: var(--body-bg);
        transition: background 0.25s, color 0.25s;
      }

      .popup-content h2 {
        font-size: 15px; font-weight: 700;
        display: flex; align-items: center; gap: 7px;
        color: var(--body-text);
      }

      .section-desc {
        margin-top: 8px; font-size: 13px; line-height: 1.6;
        color: var(--sub-text);
      }

      /* ---- nav cards -------------------------------------------------------------------- */
      .nav-cards { display: flex; flex-direction: column; gap: 8px; }

      .nav-card {
        display: flex; align-items: center; gap: 14px;
        padding: 12px 14px; border-radius: 10px;
        border: 1px solid var(--card-border);
        background: var(--card-bg);
        text-decoration: none; color: inherit; cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      .nav-card:hover { border-color: var(--accent); }

      .card-icon-wrap {
        width: 36px; height: 36px; border-radius: 8px;
        background: var(--icon-bg); border: 1px solid var(--icon-border);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; font-size: 16px;
      }

      .card-title { font-size: 13.5px; font-weight: 600; }
      .card-desc  { font-size: 12px; color: var(--sub-text); margin-top: 1px; }

      /* ---- quick actions ------------------------------------------------------------ */
      .quick-actions { display: flex; gap: 10px; margin-top: 10px; }

      .quick-actions button {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
        padding: 9px 12px; border-radius: 8px;
        border: 1.5px solid var(--btn-border);
        background: var(--btn-bg); color: var(--btn-text);
        font-size: 13px; font-weight: 600; cursor: pointer;
        transition: background 0.15s;
      }
      .quick-actions button:hover { background: var(--btn-hover); }

      /* ---- next steps ------------------------------------------------------------------ */
      .next-steps {
        padding: 14px 16px; border-radius: 10px;
        background: var(--next-bg); border: 1px solid var(--next-border);
      }

      .next-steps h3 {
        font-size: 13.5px; font-weight: 700;
        display: flex; align-items: center; gap: 7px;
        margin-bottom: 10px;
      }

      .next-steps ul { list-style: none; display: flex; flex-direction: column; gap: 7px; }

      .next-steps ul li {
        font-size: 12.5px; color: var(--sub-text);
        display: flex; align-items: center; gap: 8px;
      }
      .next-steps ul li::before { content: "\\25B6"; font-size: 9px; color: var(--accent); flex-shrink: 0; }

      /* ---- footer -------------------------------------------------------------------------- */
      .popup-footer {
        padding: 12px 16px;
        border-top: 1px solid var(--foot-border);
        display: flex; align-items: center; justify-content: space-between;
        background: var(--body-bg);
        transition: background 0.25s, border-color 0.25s;
      }

      .footer-brand { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--foot-text); }

      .footer-links { display: flex; gap: 12px; }

      .footer-links a { font-size: 12px; color: var(--foot-link); text-decoration: none; }
      .footer-links a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <div class="popup-root dark" id="root">

      <header class="popup-header">
        <button class="theme-btn" id="themeBtn" aria-label="Toggle theme"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/></svg></button>

        <svg class="ghost-hexa" width="160" height="160" viewBox="0 0 100 100" fill="none">
          <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="4" />
        </svg>

        <div class="logo-icon">
          <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="5" />
            <text x="50" y="50" dominant-baseline="central" text-anchor="middle" font-size="26" font-family="monospace" fill="currentColor">&lt;/&gt;</text>
          </svg>
        </div>

        <h1>HexaJS</h1>
        <p class="tagline">Powerful JavaScript Framework Extension</p>
        <span class="version-badge">v1.0.0</span>
      </header>

      <main class="popup-content">
        <section>
          <h2>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Getting Started
          </h2>
          <p class="section-desc">
            Welcome to HexaJS! Your extension is ready to use.
            Explore the features below to get started with your development workflow.
          </p>
        </section>

        <div class="nav-cards">
          <a class="nav-card" href="#">
            <span class="card-icon-wrap">&#128218;</span>
            <div>
              <div class="card-title">Documentation</div>
              <div class="card-desc">Learn about HexaJS features and API</div>
            </div>
          </a>
          <a class="nav-card" href="#">
            <span class="card-icon-wrap" style="font-family:monospace;font-size:13px">&lt;/&gt;</span>
            <div>
              <div class="card-title">Code Examples</div>
              <div class="card-desc">Browse sample projects and snippets</div>
            </div>
          </a>
          <a class="nav-card" href="#">
            <span class="card-icon-wrap">&#128196;</span>
            <div>
              <div class="card-title">Tutorials</div>
              <div class="card-desc">Step-by-step guides for common tasks</div>
            </div>
          </a>
        </div>

        <section>
          <h2>Quick Actions</h2>
          <div class="quick-actions">
            <button>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              New Project
            </button>
            <button>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/>
              </svg>
              GitHub
            </button>
          </div>
        </section>

        <div class="next-steps">
          <h3>
            <svg width="14" height="14" viewBox="0 0 100 100" fill="none">
              <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="10"/>
            </svg>
            Next Steps
          </h3>
          <ul>
            <li>Configure your development environment</li>
            <li>Explore the component library</li>
            <li>Join our community on GitHub</li>
          </ul>
        </div>
      </main>

      <footer class="popup-footer">
        <span class="footer-brand">
          <svg width="13" height="13" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="10"/>
          </svg>
          HexaJS Team
        </span>
        <div class="footer-links">
          <a href="#">Help</a>
          <a href="#">Settings</a>
        </div>
      </footer>
    </div>

    <script>
      const root = document.getElementById('root');
      const btn  = document.getElementById('themeBtn');
      const lightIcon = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"/></svg>';
      const darkIcon = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/></svg>';
      let dark = true;
      root.classList.toggle('dark', dark);
      btn.innerHTML = dark ? darkIcon : lightIcon;

      btn.addEventListener('click', () => {
        dark = !dark;
        root.classList.toggle('dark', dark);
        btn.innerHTML = dark ? darkIcon : lightIcon;
      });
    </script>
  </body>
</html>
`;


