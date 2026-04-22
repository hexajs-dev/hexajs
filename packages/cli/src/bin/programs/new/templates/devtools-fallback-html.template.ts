/** Plain HTML devtools panel -- generated when the user opts out of React for devtools. */
export const devtoolsFallbackHtmlTemplate = (): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HexaJS DevTools</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      /* ---- tokens -------------------------------------------------------------------------- */
      :root {
        --dt-header-bg:   #0a0a1a;
        --dt-header-text: #ffffff;
        --dt-header-sub:  rgba(255,255,255,.65);
        --dt-ghost:       rgba(255,255,255,.06);
        --dt-ver-bg:      rgba(255,255,255,.13);
        --dt-ver-text:    rgba(255,255,255,.82);
        --dt-tog-bg:      rgba(255,255,255,.15);
        --dt-tog-hover:   rgba(255,255,255,.25);
        --dt-body-bg:     #ffffff;
        --dt-body-text:   #111827;
        --dt-sub-text:    #6b7280;
        --dt-card-bg:     #f9fafb;
        --dt-card-border: #e5e7eb;
        --dt-code-bg:     #1f2937;
        --dt-code-text:   #e5e7eb;
        --dt-accent:      #4f46e5;
        --dt-foot-border: #e5e7eb;
        --dt-foot-text:   #9ca3af;
        --dt-foot-link:   #6b7280;
        --dt-icon-bg:     #f3f4f6;
        --dt-icon-border: #e5e7eb;
        --dt-step-num:    #4f46e5;
      }

      .dt-root.dark {
        --dt-header-bg:   #f3f4f6;
        --dt-header-text: #111827;
        --dt-header-sub:  rgba(17,24,39,.6);
        --dt-ghost:       rgba(17,24,39,.07);
        --dt-ver-bg:      rgba(0,0,0,.08);
        --dt-ver-text:    rgba(17,24,39,.72);
        --dt-tog-hover:   rgba(0,0,0,.12);
        --dt-body-bg:     #111827;
        --dt-body-text:   #f9fafb;
        --dt-sub-text:    #9ca3af;
        --dt-card-bg:     #1f2937;
        --dt-card-border: #374151;
        --dt-code-bg:     #0b1220;
        --dt-code-text:   #e5e7eb;
        --dt-foot-border: #374151;
        --dt-foot-text:   #6b7280;
        --dt-foot-link:   #9ca3af;
        --dt-icon-bg:     #374151;
        --dt-icon-border: #4b5563;
      }

      /* ---- shell ---------------------------------------------------------------------------- */
      html, body { height: 100%; }

      .dt-root {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        background: var(--dt-body-bg);
        color: var(--dt-body-text);
      }

      /* ---- header -------------------------------------------------------------------------- */
      .dt-header {
        position: relative;
        background: var(--dt-header-bg);
        color: var(--dt-header-text);
        padding: 28px 32px 24px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        overflow: hidden;
      }

      .dt-theme-btn {
        position: absolute;
        top: 16px; right: 20px;
        width: 36px; height: 36px;
        border: none; border-radius: 50%;
        background: transparent;
        color: var(--dt-header-text);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
        z-index: 2;
      }
      .dt-theme-btn:hover { background: var(--dt-tog-hover); }

      .dt-theme-btn svg {
        width: 24px;
        height: 24px;
      }

      .dt-ghost-hexa {
        position: absolute;
        right: -40px; top: 50%;
        transform: translateY(-50%);
        opacity: .45;
        pointer-events: none;
        color: var(--dt-ghost);
      }

      .dt-header-inner {
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 1;
      }

      .dt-logo { color: var(--dt-header-text); flex-shrink: 0; }

      .dt-header-text h1 {
        font-size: 22px; font-weight: 700;
        letter-spacing: -.3px;
      }

      .dt-tagline { font-size: 13px; color: var(--dt-header-sub); margin-top: 2px; }

      .dt-version-badge {
        align-self: flex-start;
        padding: 4px 14px;
        border-radius: 999px;
        background: var(--dt-ver-bg);
        color: var(--dt-ver-text);
        font-size: 12px; letter-spacing: .3px;
        z-index: 1;
      }

      /* ---- content ------------------------------------------------------------------------ */
      .dt-content {
        flex: 1;
        padding: 32px;
        max-width: 760px;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 36px;
      }

      .dt-section-title {
        font-size: 16px; font-weight: 700;
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 12px;
      }

      .dt-section-desc {
        font-size: 13.5px; line-height: 1.65;
        color: var(--dt-sub-text);
      }

      /* ---- MDN link cards ---------------------------------------------------------- */
      .dt-link-cards {
        display: flex; flex-direction: column; gap: 1px;
        border: 1px solid var(--dt-card-border); border-radius: 10px; overflow: hidden;
      }

      .dt-link-card {
        display: flex; flex-direction: column; gap: 2px;
        padding: 13px 16px;
        background: var(--dt-body-bg);
        text-decoration: none; color: inherit;
        border-bottom: 1px solid var(--dt-card-border);
        transition: background 0.12s;
      }
      .dt-link-card:last-child { border-bottom: none; }
      .dt-link-card:hover { background: var(--dt-card-bg); }

      .dt-link-card-body { display: flex; align-items: center; justify-content: space-between; }
      .dt-link-card-label { font-size: 14px; font-weight: 600; }
      .dt-link-card-body svg { color: var(--dt-sub-text); flex-shrink: 0; }
      .dt-link-card-desc { font-size: 12.5px; color: var(--dt-sub-text); }

      /* ---- quick start steps ---------------------------------------------------- */
      .dt-steps { display: flex; flex-direction: column; gap: 20px; }

      .dt-step {
        border: 1px solid var(--dt-card-border);
        border-radius: 10px; overflow: hidden;
      }

      .dt-step-header {
        display: flex; align-items: flex-start; gap: 14px;
        padding: 14px 16px 10px;
      }

      .dt-step-num {
        width: 26px; height: 26px; border-radius: 50%;
        background: var(--dt-step-num); color: #fff;
        font-size: 13px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; margin-top: 1px;
      }

      .dt-step-title { font-size: 14px; font-weight: 700; }
      .dt-step-desc  { font-size: 12.5px; color: var(--dt-sub-text); margin-top: 3px; line-height: 1.5; }

      .dt-code {
        background: var(--dt-code-bg); color: var(--dt-code-text);
        font-family: "Fira Code", "Cascadia Code", ui-monospace, monospace;
        font-size: 12.5px;
        padding: 12px 16px;
        overflow-x: auto;
        border-top: 1px solid rgba(255,255,255,.07);
        white-space: pre;
      }

      /* ---- capabilities grid ---------------------------------------------------- */
      .dt-capability-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        margin-bottom: 16px;
      }

      .dt-capability-card {
        display: flex; align-items: flex-start; gap: 14px;
        padding: 16px;
        background: var(--dt-card-bg);
        border: 1px solid var(--dt-card-border); border-radius: 10px;
      }

      .dt-capability-icon {
        width: 40px; height: 40px; border-radius: 8px;
        background: var(--dt-icon-bg); border: 1px solid var(--dt-icon-border);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }

      .dt-capability-title { font-size: 13.5px; font-weight: 700; }
      .dt-capability-desc  { font-size: 12px; color: var(--dt-sub-text); margin-top: 4px; line-height: 1.5; }

      /* ---- resources card ---------------------------------------------------------- */
      .dt-resources-card {
        padding: 16px 20px;
        background: var(--dt-card-bg);
        border: 1px solid var(--dt-card-border); border-radius: 10px;
      }

      .dt-resources-title {
        font-size: 14px; font-weight: 700;
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 12px;
      }

      .dt-resources-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }

      .dt-resources-list li a {
        display: flex; align-items: center; gap: 8px;
        font-size: 13px; color: var(--dt-accent); text-decoration: none;
      }
      .dt-resources-list li a:hover { text-decoration: underline; }
      .dt-resources-list li a svg { flex-shrink: 0; color: var(--dt-sub-text); }

      /* ---- footer -------------------------------------------------------------------------- */
      .dt-footer {
        padding: 12px 32px;
        border-top: 1px solid var(--dt-foot-border);
        display: flex; align-items: center; justify-content: space-between;
        background: var(--dt-body-bg);
      }

      .dt-footer-brand { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--dt-foot-text); }
      .dt-footer-links { display: flex; gap: 16px; }
      .dt-footer-links a { font-size: 12px; color: var(--dt-foot-link); text-decoration: none; }
      .dt-footer-links a:hover { text-decoration: underline; }

      /* ---- help btn ---------------------------------------------------------------------- */
      .dt-help-btn {
        position: fixed;
        bottom: 20px; right: 20px;
        width: 36px; height: 36px;
        border-radius: 50%;
        border: 1.5px solid var(--dt-card-border);
        background: var(--dt-body-bg); color: var(--dt-sub-text);
        font-size: 15px; font-weight: 700;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,.08);
        transition: background 0.15s, color 0.15s;
      }
      .dt-help-btn:hover { background: var(--dt-card-bg); color: var(--dt-body-text); }
    </style>
  </head>
  <body>
    <div class="dt-root dark">

      <!-- ---- Header ------------------------------------------------------------------------------ -->
      <header class="dt-header">
        <button class="dt-theme-btn" id="themeBtn" aria-label="Toggle theme"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/></svg></button>

        <svg class="dt-ghost-hexa" width="200" height="200" viewBox="0 0 100 100" fill="none">
          <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="4"/>
        </svg>

        <div class="dt-header-inner">
          <div class="dt-logo">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
              <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="5"/>
              <path d="M35 42 L50 35 L65 42 M35 58 L50 65 L65 58 M50 35 L50 65 M38 46 L62 54 M62 46 L38 54" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="dt-header-text">
            <h1>HexaJS DevTools</h1>
            <p class="dt-tagline">Browser DevTools Extension Panel</p>
          </div>
        </div>
        <span class="dt-version-badge">DevTools Template &bull; v1.0.0</span>
      </header>

      <!-- ---- Content ---------------------------------------------------------------------------- -->
      <main class="dt-content">

        <!-- DevTools Panel Template -->
        <section>
          <h2 class="dt-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            DevTools Panel Template
          </h2>
          <p class="dt-section-desc">
            This is your DevTools panel entry point. Build powerful inspection and debugging tools for your web
            applications. Use the MDN Web Extensions API documentation below to get started with creating custom
            DevTools functionality.
          </p>
        </section>

        <!-- MDN Links -->
        <section>
          <h2 class="dt-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            MDN Web Extensions API Documentation
          </h2>
          <div class="dt-link-cards">
            <a class="dt-link-card" href="https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools" target="_blank" rel="noreferrer">
              <div class="dt-link-card-body">
                <span class="dt-link-card-label">devtools API</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
              <p class="dt-link-card-desc">Core API for creating browser DevTools extensions</p>
            </a>
            <a class="dt-link-card" href="https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools/panels" target="_blank" rel="noreferrer">
              <div class="dt-link-card-body">
                <span class="dt-link-card-label">devtools.panels</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
              <p class="dt-link-card-desc">Create and manage custom panels in the DevTools</p>
            </a>
            <a class="dt-link-card" href="https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools/inspectedWindow" target="_blank" rel="noreferrer">
              <div class="dt-link-card-body">
                <span class="dt-link-card-label">devtools.inspectedWindow</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
              <p class="dt-link-card-desc">Interact with the window being inspected</p>
            </a>
            <a class="dt-link-card" href="https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/devtools/network" target="_blank" rel="noreferrer">
              <div class="dt-link-card-body">
                <span class="dt-link-card-label">devtools.network</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
              <p class="dt-link-card-desc">Access network request information</p>
            </a>
          </div>
        </section>

        <!-- Quick Start -->
        <section>
          <h2 class="dt-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            Quick Start Guide
          </h2>
          <div class="dt-steps">
            <div class="dt-step">
              <div class="dt-step-header">
                <div class="dt-step-num">1</div>
                <div>
                  <div class="dt-step-title">Register DevTools Panel</div>
                  <div class="dt-step-desc">Add the devtools_page to your manifest.json to register your DevTools panel</div>
                </div>
              </div>
              <pre class="dt-code"><code>"devtools_page": "devtools.html"</code></pre>
            </div>
            <div class="dt-step">
              <div class="dt-step-header">
                <div class="dt-step-num">2</div>
                <div>
                  <div class="dt-step-title">Create Custom Panel</div>
                  <div class="dt-step-desc">Use the devtools.panels API to create custom panels in the browser DevTools</div>
                </div>
              </div>
              <pre class="dt-code"><code>browser.devtools.panels.create( "HexaJS", "icon.png", "panel.html" );</code></pre>
            </div>
            <div class="dt-step">
              <div class="dt-step-header">
                <div class="dt-step-num">3</div>
                <div>
                  <div class="dt-step-title">Access Inspected Window</div>
                  <div class="dt-step-desc">Interact with the page being inspected using devtools.inspectedWindow API</div>
                </div>
              </div>
              <pre class="dt-code"><code>browser.devtools.inspectedWindow.eval( "console.log('Hello from HexaJS!')" );</code></pre>
            </div>
          </div>
        </section>

        <!-- What You Can Build -->
        <section>
          <h2 class="dt-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            What You Can Build
          </h2>
          <div class="dt-capability-grid">
            <div class="dt-capability-card">
              <div class="dt-capability-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div>
                <div class="dt-capability-title">Component Inspector</div>
                <div class="dt-capability-desc">Inspect and debug framework components in real-time</div>
              </div>
            </div>
            <div class="dt-capability-card">
              <div class="dt-capability-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </div>
              <div>
                <div class="dt-capability-title">Performance Profiler</div>
                <div class="dt-capability-desc">Monitor render times and performance metrics</div>
              </div>
            </div>
            <div class="dt-capability-card">
              <div class="dt-capability-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div>
                <div class="dt-capability-title">State Manager</div>
                <div class="dt-capability-desc">Track and modify application state</div>
              </div>
            </div>
            <div class="dt-capability-card">
              <div class="dt-capability-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div>
                <div class="dt-capability-title">Event Logger</div>
                <div class="dt-capability-desc">Capture and analyze events and interactions</div>
              </div>
            </div>
          </div>

          <div class="dt-resources-card">
            <h3 class="dt-resources-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Additional Resources
            </h3>
            <ul class="dt-resources-list">
              <li>
                <a href="https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API" target="_blank" rel="noreferrer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  WebExtensions API Overview
                </a>
              </li>
              <li>
                <a href="https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools" target="_blank" rel="noreferrer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Chrome DevTools Extensions
                </a>
              </li>
              <li>
                <a href="https://github.com/mdn/webextensions-examples" target="_blank" rel="noreferrer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  WebExtensions Examples on GitHub
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <!-- ---- Footer ------------------------------------------------------------------------------ -->
      <footer class="dt-footer">
        <span class="dt-footer-brand">
          <svg width="13" height="13" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="currentColor" stroke-width="10"/>
          </svg>
          HexaJS DevTools Template
        </span>
        <div class="dt-footer-links">
          <a href="https://hexajs.dev/docs" target="_blank" rel="noreferrer">Documentation</a>
          <a href="https://github.com/hexajs" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>

      <button class="dt-help-btn" aria-label="Help">?</button>
    </div>

    <script>
      const root = document.querySelector('.dt-root');
      const btn = document.getElementById('themeBtn');
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



