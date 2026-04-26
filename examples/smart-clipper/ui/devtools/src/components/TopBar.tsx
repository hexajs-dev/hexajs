import { ThemeMode } from '../types/ui';

type TopBarProps = { logoUrl: string; clipCount: number; errorCount: number; avgConfidence: string; theme: ThemeMode; onToggleTheme: () => void; onRefresh: () => void };

export function TopBar({ logoUrl, clipCount, errorCount, avgConfidence, theme, onToggleTheme, onRefresh }: TopBarProps) {
  return (
    <header className='dt-topbar'>
      <div className='dt-brand'>
        <img src={logoUrl} alt='' aria-hidden='true' />
        <div>
          <h1>Smart Clipper Diagnostics</h1>
          <p>OCR sessions, metadata, and failures</p>
        </div>
      </div>

      <div className='dt-chip-row'>
        <span className='dt-chip'>{clipCount} captures</span>
        <span className='dt-chip'>{errorCount} errors</span>
        <span className='dt-chip'>{avgConfidence} avg confidence</span>
        <button className='dt-control-button' type='button' onClick={onRefresh}>Reload</button>
        <button className='dt-control-button' type='button' onClick={onToggleTheme}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
      </div>
    </header>
  );
}
