import type { ScaffoldContext } from '../models/scaffold.types';

export const packageJsonTemplate = (ctx: ScaffoldContext): string => {
  const usesManagedUi = ctx.reactPopup || ctx.managedDevtools;
  const usesReactUi = ctx.reactPopup || ctx.reactDevtools;
  const platformScripts = Object.fromEntries(
    ctx.platforms.flatMap((platform) => [
      [`dev:${platform}`, `hexa build --platform ${platform} --watch`],
      [`build:${platform}`, `hexa build --platform ${platform}`],
      [`production:${platform}`, `hexa build --platform ${platform} --mode production`],
    ])
  );

  const managedUiDeps = usesManagedUi
    ? { '@hexajs-dev/ui': 'latest' }
    : {};

  const reactDeps = usesReactUi
    ? { react: '^18.3.1', 'react-dom': '^18.3.1' }
    : {};

  const reactDevDeps = usesReactUi
    ? { '@vitejs/plugin-react': '^4.7.0', '@types/react': '^18.3.1', '@types/react-dom': '^18.3.1' }
    : {};

  const managedUiDevDeps = usesManagedUi
    ? { vite: '^7.3.1' }
    : {};

  return JSON.stringify(
    {
      name: ctx.name,
      version: '0.0.1',
      private: true,
      packageManager: `${ctx.packageManager}@${ctx.packageManagerVersion}`,
      scripts: {
        ...platformScripts,
      },
      dependencies: {
        '@hexajs-dev/common': 'latest',
        '@hexajs-dev/core': 'latest',
        '@hexajs-dev/ports': 'latest',
        ...managedUiDeps,
        ...reactDeps,
        rxjs: '^7.8.2',
      },
      devDependencies: {
        '@hexajs-dev/cli': 'latest',
        ...managedUiDevDeps,
        ...reactDevDeps,
        typescript: '^5.0.0',
      },
    },
    null,
    2
  );
};
