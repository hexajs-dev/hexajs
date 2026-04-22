export const devtoolsStyleTemplate = (): string => `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── tokens ─────────────────────────────────────────── */
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

/* ── shell ───────────────────────────────────────────── */
html, body, #root { height: 100%; }

.dt-root {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  background: var(--dt-body-bg);
  color: var(--dt-body-text);
}

/* ── header ──────────────────────────────────────────── */
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

/* ── content ─────────────────────────────────────────── */
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
  color: var(--dt-body-text);
}

.dt-section-desc {
  font-size: 13.5px; line-height: 1.65;
  color: var(--dt-sub-text);
}

/* ── MDN link cards ──────────────────────────────────── */
.dt-link-cards { display: flex; flex-direction: column; gap: 1px; border: 1px solid var(--dt-card-border); border-radius: 10px; overflow: hidden; }

.dt-link-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 13px 16px;
  background: var(--dt-body-bg);
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid var(--dt-card-border);
  transition: background 0.12s;
}
.dt-link-card:last-child { border-bottom: none; }
.dt-link-card:hover { background: var(--dt-card-bg); }

.dt-link-card-body {
  display: flex; align-items: center; justify-content: space-between;
}

.dt-link-card-label { font-size: 14px; font-weight: 600; color: var(--dt-body-text); }
.dt-link-card-body svg { color: var(--dt-sub-text); flex-shrink: 0; }
.dt-link-card-desc { font-size: 12.5px; color: var(--dt-sub-text); }

/* ── quick start steps ───────────────────────────────── */
.dt-steps { display: flex; flex-direction: column; gap: 20px; }

.dt-step {
  border: 1px solid var(--dt-card-border);
  border-radius: 10px;
  overflow: hidden;
}

.dt-step-header {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 14px 16px 10px;
}

.dt-step-num {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--dt-step-num);
  color: #fff;
  font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}

.dt-step-title { font-size: 14px; font-weight: 700; color: var(--dt-body-text); }
.dt-step-desc  { font-size: 12.5px; color: var(--dt-sub-text); margin-top: 3px; line-height: 1.5; }

.dt-code {
  background: var(--dt-code-bg);
  color: var(--dt-code-text);
  font-family: "Fira Code", "Cascadia Code", ui-monospace, monospace;
  font-size: 12.5px;
  padding: 12px 16px;
  overflow-x: auto;
  border-top: 1px solid rgba(255,255,255,.07);
  white-space: pre;
}

/* ── capabilities grid ───────────────────────────────── */
.dt-capability-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.dt-capability-card {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px;
  background: var(--dt-card-bg);
  border: 1px solid var(--dt-card-border);
  border-radius: 10px;
}

.dt-capability-icon {
  width: 40px; height: 40px; border-radius: 8px;
  background: var(--dt-icon-bg);
  border: 1px solid var(--dt-icon-border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--dt-body-text);
}

.dt-capability-title { font-size: 13.5px; font-weight: 700; color: var(--dt-body-text); }
.dt-capability-desc  { font-size: 12px; color: var(--dt-sub-text); margin-top: 4px; line-height: 1.5; }

/* ── resources card ──────────────────────────────────── */
.dt-resources-card {
  padding: 16px 20px;
  background: var(--dt-card-bg);
  border: 1px solid var(--dt-card-border);
  border-radius: 10px;
}

.dt-resources-title {
  font-size: 14px; font-weight: 700;
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px;
  color: var(--dt-body-text);
}

.dt-resources-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }

.dt-resources-list li a {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--dt-accent);
  text-decoration: none;
}
.dt-resources-list li a:hover { text-decoration: underline; }
.dt-resources-list li a svg { flex-shrink: 0; color: var(--dt-sub-text); }

/* ── footer ──────────────────────────────────────────── */
.dt-footer {
  padding: 12px 32px;
  border-top: 1px solid var(--dt-foot-border);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--dt-body-bg);
}

.dt-footer-brand {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; color: var(--dt-foot-text);
}

.dt-footer-links { display: flex; gap: 16px; }

.dt-footer-links a {
  font-size: 12px; color: var(--dt-foot-link);
  text-decoration: none;
}
.dt-footer-links a:hover { text-decoration: underline; }

/* ── help btn ────────────────────────────────────────── */
.dt-help-btn {
  position: fixed;
  bottom: 20px; right: 20px;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--dt-card-border);
  background: var(--dt-body-bg);
  color: var(--dt-sub-text);
  font-size: 15px; font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
  transition: background 0.15s, color 0.15s;
}
.dt-help-btn:hover { background: var(--dt-card-bg); color: var(--dt-body-text); }
`;
