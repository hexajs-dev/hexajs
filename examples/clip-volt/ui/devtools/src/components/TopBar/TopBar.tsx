import { Copy, Globe, Hash, Moon, SunMedium } from 'lucide-react';
import { ThemeMode } from '../../types/ui';

type TopBarProps = { clipsCount: number; uniqueCount: number; domainCount: number; theme: ThemeMode; onToggleTheme: () => void };

export function TopBar({ clipsCount, uniqueCount, domainCount, theme, onToggleTheme }: TopBarProps) {
  return (
    <header className="dt-topbar">
      <div className="dt-brand">
        <div className="dt-brand-logo" />
        <h1>ClipVault Management</h1>
      </div>
      <div className="dt-chip-row">
        <span className="dt-chip"><Copy size={13} /> {clipsCount} clips</span>
        <span className="dt-chip"><Hash size={13} /> {uniqueCount} unique</span>
        <span className="dt-chip"><Globe size={13} /> {domainCount} domains</span>
        <button className="dt-theme-button" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <SunMedium size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}
