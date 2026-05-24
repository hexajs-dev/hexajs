import type { ScaffoldContext } from '../models/scaffold.types';

export const packageJsonTemplate = (ctx: ScaffoldContext): string => {
  // Surfaces that ship framework source (React/Vue components) — exclude the
  // devtools fallback case (managedDevtools without reactDevtools = plain HTML).
  const usesManagedFramework = ctx.reactPopup || ctx.reactDevtools || ctx.managedNewtab;
  // Any managed UI surface (including the fallback devtools HTML) implies vite
  // is needed in devDependencies, but not necessarily a UI framework.
  const usesManagedUi = ctx.reactPopup || ctx.managedDevtools || ctx.managedNewtab;
  const framework = ctx.framework;
  const isReactProject = framework === 'react' && usesManagedFramework;
  const isVueProject = framework === 'vue' && usesManagedFramework;

  const platformScripts = Object.fromEntries(
    ctx.platforms.flatMap((platform) => [
      [`dev:${platform}`, `hexa build --platform ${platform} --mode development --watch`],
      [`build:${platform}`, `hexa build --platform ${platform}`],
      [`production:${platform}`, `hexa build --platform ${platform} --mode production`],
    ])
  );

  const managedUiDeps = usesManagedUi
    ? { '@hexajs-dev/ui': 'latest' }
    : {};

  // React branch
  const reactDeps = isReactProject
    ? { react: '^18.3.1', 'react-dom': '^18.3.1' }
    : {};

  const reactDevDeps = isReactProject
    ? { '@vitejs/plugin-react': '^4.7.0', '@types/react': '^18.3.1', '@types/react-dom': '^18.3.1' }
    : {};

  // Vue branch
  const vueDeps = isVueProject
    ? { vue: '^3.5.13' }
    : {};

  const vueDevDeps = isVueProject
    ? { '@vitejs/plugin-vue': '^6.0.0', 'vue-tsc': '^2.1.10' }
    : {};

  // Common managed-UI dev deps (Vite needed regardless of framework)
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
        ...vueDeps,
        rxjs: '^7.8.2',
      },
      devDependencies: {
        '@hexajs-dev/cli': 'latest',
        ...managedUiDevDeps,
        ...reactDevDeps,
        ...vueDevDeps,
        typescript: '^5.0.0',
      },
    },
    null,
    2
  );
};
