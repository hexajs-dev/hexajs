export const newtabAppTemplate = (): string => `import { useState, useEffect } from 'react';

export function App() {
  return (
    <iframe
      src="https://hexajs.dev"
      style={{ width: '100vw', height: '100vh', border: 'none', display: 'block' }}
      title="HexaJS Documentation"
    />
  );
}
`;
