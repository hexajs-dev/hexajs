/** TS config for the Vue devtools surface — Vue 3 strict, no JSX. */
export const devtoolsTsConfigVueTemplate = (): string => `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "useDefineForClassFields": true,
    "isolatedModules": true,
    "types": ["vite/client", "@hexajs-dev/ports/hexa.web.ext"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue"]
}
`;
