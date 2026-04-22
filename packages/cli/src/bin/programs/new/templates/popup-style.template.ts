export const popupStyleTemplate = (): string => `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── theme tokens ──────────────────────────────────── */
.popup-root {
  --ph-bg:           #0a0a1a;
  --ph-text:         #ffffff;
  --ph-sub:          rgba(255,255,255,.65);
  --ph-ghost:        rgba(255,255,255,.06);
  --ver-bg:          rgba(255,255,255,.13);
  --ver-text:        rgba(255,255,255,.82);
  --tog-bg:          rgba(255,255,255,.15);
  --tog-hover:       rgba(255,255,255,.25);
  --tog-text:        rgba(255,255,255,.85);
  --body-bg:         #ffffff;
  --body-text:       #111827;
  --sub-text:        #6b7280;
  --card-bg:         #f9fafb;
  --card-border:     #e5e7eb;
  --icon-bg:         #f3f4f6;
  --icon-border:     #e5e7eb;
  --btn-bg:          transparent;
  --btn-border:      #1f2937;
  --btn-text:        #111827;
  --btn-hover:       #f3f4f6;
  --next-bg:         #f3f4f6;
  --next-border:     #e5e7eb;
  --foot-border:     #e5e7eb;
  --foot-text:       #9ca3af;
  --foot-link:       #6b7280;
  --accent:          #4f46e5;
}

.popup-root.dark {
  --ph-bg:           #f3f4f6;
  --ph-text:         #111827;
  --ph-sub:          rgba(17,24,39,.6);
  --ph-ghost:        rgba(17,24,39,.07);
  --ver-bg:          rgba(0,0,0,.08);
  --ver-text:        rgba(17,24,39,.72);
  --tog-bg:          rgba(0,0,0,.10);
  --tog-hover:       rgba(0,0,0,.17);
  --tog-text:        #374151;
  --body-bg:         #111827;
  --body-text:       #f9fafb;
  --sub-text:        #9ca3af;
  --card-bg:         #1f2937;
  --card-border:     #374151;
  --icon-bg:         #374151;
  --icon-border:     #4b5563;
  --btn-bg:          transparent;
  --btn-border:      #4b5563;
  --btn-text:        #f9fafb;
  --btn-hover:       #1f2937;
  --next-bg:         #1f2937;
  --next-border:     #374151;
  --foot-border:     #374151;
  --foot-text:       #6b7280;
  --foot-link:       #9ca3af;
}

/* ── layout shell ─────────────────────────────────── */
.popup-root {
  width: 320px;
  min-height: 520px;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  background: var(--body-bg);
  color: var(--body-text);
  overflow: hidden;
}

/* ── header ────────────────────────────────────────── */
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

.popup-header .theme-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--tog-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 2;
}
.popup-header .theme-btn:hover { background: var(--tog-hover); }

.popup-header .theme-btn svg {
  width: 24px;
  height: 24px;
}

.popup-header .ghost-hexa {
  position: absolute;
  right: -36px;
  bottom: -36px;
  opacity: .45;
  pointer-events: none;
}
.popup-header .ghost-hexa polygon { stroke: var(--ph-ghost); }

.popup-header .logo-icon {
  position: relative;
  z-index: 1;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ph-text);
  margin-bottom: 4px;
}

.popup-header h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -.3px;
  color: var(--ph-text);
  z-index: 1;
}

.popup-header .tagline {
  font-size: 12.5px;
  color: var(--ph-sub);
  z-index: 1;
}

.popup-header .version-badge {
  margin-top: 6px;
  padding: 3px 12px;
  border-radius: 999px;
  background: var(--ver-bg);
  color: var(--ver-text);
  font-size: 12px;
  letter-spacing: .3px;
  z-index: 1;
}

/* ── content ───────────────────────────────────────── */
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
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--body-text);
}

.popup-content .section-desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--sub-text);
}

/* ── nav cards ─────────────────────────────────────── */
.nav-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.nav-card:hover { border-color: var(--accent); }

.nav-card .card-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--icon-bg);
  border: 1px solid var(--icon-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

.nav-card .card-title { font-size: 13.5px; font-weight: 600; }
.nav-card .card-desc  { font-size: 12px; color: var(--sub-text); margin-top: 1px; }

/* ── quick actions ─────────────────────────────────── */
.quick-actions {
  display: flex;
  gap: 10px;
}

.quick-actions button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1.5px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.quick-actions button:hover { background: var(--btn-hover); }

/* ── next steps ────────────────────────────────────── */
.next-steps {
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--next-bg);
  border: 1px solid var(--next-border);
}

.next-steps h3 {
  font-size: 13.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
}

.next-steps ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.next-steps ul li {
  font-size: 12.5px;
  color: var(--sub-text);
  display: flex;
  align-items: center;
  gap: 8px;
}
.next-steps ul li::before {
  content: "▶";
  font-size: 9px;
  color: var(--accent);
  flex-shrink: 0;
}

/* ── footer ────────────────────────────────────────── */
.popup-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--foot-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--body-bg);
  transition: background 0.25s, border-color 0.25s;
}

.popup-footer .footer-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--foot-text);
}

.popup-footer .footer-links {
  display: flex;
  gap: 12px;
}

.popup-footer .footer-links a {
  font-size: 12px;
  color: var(--foot-link);
  text-decoration: none;
}
.popup-footer .footer-links a:hover { text-decoration: underline; }
`;
