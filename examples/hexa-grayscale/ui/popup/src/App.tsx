import { useState } from 'react';

export function App() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className='popup-root'>
      <header className='popup-header'>
        <p className='popup-kicker'>Hexa Grayscale</p>
        <h1>HexaJS Framework</h1>
        <p className='popup-subtitle'>Toggle from the page eye icon</p>
      </header>

      <main className='popup-content'>
        <div className='eye-preview'>
          <div>
            <p className='eye-preview__text'>This popup is visual only. Use the floating eye icon on each page.</p>
          </div>
        </div>

      </main>
    </div>
  );
}
