type ShortcutSectionProps = { isMac: boolean };

export function ShortcutSection({ isMac }: ShortcutSectionProps) {
  return (
    <section className='popup-section'>
      <h2 className='popup-section-title'>SHORTCUT</h2>
      <div className='popup-shortcut-card'>
        <div className='popup-shortcut-row'>
          <span>Start OCR clipping</span>
          <div className='popup-shortcut-key-group' aria-label={`Shortcut ${isMac ? 'Command' : 'Control'} Shift Y`}>
            <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
            <kbd>Shift</kbd>
            <kbd>Y</kbd>
          </div>
        </div>
      </div>
    </section>
  );
}
