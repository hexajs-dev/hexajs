export const popupTsConfigTemplate = (): string => `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["vite/client", "@hexajs/ports/hexa.web.ext"]
  },
  "include": ["src"]
}
`;
