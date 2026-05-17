export const newtabAppTemplate = (): string => `import { useState, useEffect } from 'react';

const HexaIcon = ({ size = 56, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" stroke={stroke} strokeWidth="5" />
    <text x="50" y="50" dominantBaseline="central" textAnchor="middle" fontSize="26" fontFamily="monospace" fill={stroke}>&lt;/&gt;</text>
  </svg>
);

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

export function App() {
  const time = useClock();

  return (
    <div className="nt-root">
      <div className="nt-content">
        <div className="nt-logo">
          <HexaIcon size={56} stroke="currentColor" />
        </div>
        <div className="nt-time">{formatTime(time)}</div>
        <div className="nt-date">{formatDate(time)}</div>
        <p className="nt-hint">Edit <code>ui/newtab/src/App.tsx</code> to customise this page.</p>
      </div>
    </div>
  );
}
`;
