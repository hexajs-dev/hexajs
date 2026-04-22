type ShortcutSectionProps = { isMac: boolean };

export function ShortcutSection({ isMac }: ShortcutSectionProps) {
  return (
    <section className="cv-section">
      <h2 className="cv-section-title">SHORTCUT</h2>
      <div className="cv-panel">
        <div className="cv-shortcut-row">
          <span>Open clipboard overlay</span>
          <div className="cv-shortcut-key-group">
            <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
            <kbd>Shift</kbd>
            <kbd>L</kbd>
          </div>
        </div>
      </div>
    </section>
  );
}
