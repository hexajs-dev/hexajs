export const newtabStyleTemplate = (): string => `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.nt-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a1a;
  color: #ffffff;
  font-family: system-ui, -apple-system, sans-serif;
}

.nt-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.nt-logo {
  opacity: 0.7;
  margin-bottom: 8px;
}

.nt-time {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 200;
  letter-spacing: -0.02em;
  line-height: 1;
}

.nt-date {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 400;
}

.nt-hint {
  margin-top: 24px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.3);
}

.nt-hint code {
  font-family: monospace;
  color: rgba(255, 255, 255, 0.45);
}
`;
