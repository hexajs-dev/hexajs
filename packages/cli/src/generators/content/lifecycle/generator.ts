import { ServiceMetadata } from '../../../compiler/di/types';
import { ContentEntryMetadata } from '../../../compiler/content/types';
import { ViewMetadata } from '../../../compiler/content/view/types';
import { buildDependencyArgs, toLowerFirst } from '../../shared';

export class ContentLifecycleGenerator {
  public generateServiceLifecycleResolution(services: ServiceMetadata[], views: ViewMetadata[] = []): string {
    const lifecycleServices = services.filter(service => service.hasOnInit || service.hasOnDestroy);
    const lifecycleViews = views.filter(view => view.hasOnInit || view.hasOnDestroy);

    if (lifecycleServices.length === 0 && lifecycleViews.length === 0) {
      return '  return { onInit: [], onDestroy: [] };';
    }

    const lines: string[] = [
      `  const onInit = [];`,
      `  const onDestroy = [];`,
      ``
    ];

    lifecycleServices.forEach(service => {
      const instanceName = toLowerFirst(service.className);
      lines.push(`  const ${instanceName} = container.resolve(${service.className});`);
      if (service.hasOnInit) {
        lines.push(`  onInit.push(${instanceName});`);
      }
      if (service.hasOnDestroy) {
        lines.push(`  onDestroy.push(${instanceName});`);
      }
      lines.push('');
    });

    lifecycleViews.forEach(view => {
      const instanceName = toLowerFirst(view.className);
      lines.push(`  const ${instanceName} = container.resolve(${view.className});`);
      if (view.hasOnInit) {
        lines.push(`  onInit.push(${instanceName});`);
      }
      if (view.hasOnDestroy) {
        lines.push(`  onDestroy.push(${instanceName});`);
      }
      lines.push('');
    });

    lines.push(`  return { onInit, onDestroy };`);
    return lines.join('\n');
  }

  public generateContentInits(entries: ContentEntryMetadata[]): string {
    if (entries.length === 0) {
      return '  return { onInit: [], onDestroy: [] };';
    }

    const inits: string[] = [
      `  const onInit = [];`,
      `  const onDestroy = [];`,
      ``
    ];

    entries.forEach(entry => {
      const deps = buildDependencyArgs(entry);
      const instanceName = toLowerFirst(entry.className);

      if (entry.viewPropertyDependencies && entry.viewPropertyDependencies.length > 0) {
        inits.push(`  const ${instanceName} = new ${entry.className}(${deps});`);
        entry.viewPropertyDependencies.forEach(vd => {
          inits.push(`  ${instanceName}.${vd.propertyName} = container.resolve(${vd.viewClassName});`);
        });
      } else {
        inits.push(`  const ${instanceName} = new ${entry.className}(${deps});`);
      }

      if (entry.hasOnInit) {
        inits.push(`  onInit.push(${instanceName});`);
      }

      if (entry.hasOnDestroy) {
        inits.push(`  onDestroy.push(${instanceName});`);
      }

      inits.push('');
    });

    inits.push(`  return { onInit, onDestroy };`);
    return inits.join('\n');
  }

  public generateLifecycleBootstrap(): string {
    return `async function runOnInit(targets) {
  if (targets.length === 0) {
    return;
  }

  const shouldWaitForDocument = typeof document !== 'undefined' && document.readyState === 'loading';

  if (shouldWaitForDocument) {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', () => resolve(undefined), { once: true });
    });
  }

  await Promise.all(targets.map(target => Promise.resolve(target.onInit())));
}

function registerOnDestroy(targets, effectSubs) {
  let destroyed = false;

  const destroyTargets = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;

    // Unsubscribe effects first
    if (effectSubs) {
      effectSubs.forEach(sub => sub.unsubscribe());
    }

    if (targets.length === 0) {
      return;
    }

    void Promise.all(targets.map(target => Promise.resolve(target.onDestroy()))).catch(error => {
      console.error('[HexaJS] Content onDestroy failed', error);
    });
  };

  const canUseUnload = typeof document === 'undefined'
    ? true
    : typeof document.featurePolicy?.allowsFeature === 'function'
      ? document.featurePolicy.allowsFeature('unload')
      : true;

  window.addEventListener('pagehide', destroyTargets, { once: true });

  if (!canUseUnload) {
    console.warn('[HexaJS] Content onDestroy: host document disallows unload via Permissions Policy; using pagehide fallback only.');
    return;
  }

  try {
    window.addEventListener('unload', destroyTargets, { once: true });
  } catch (error) {
    console.warn('[HexaJS] Content onDestroy: failed to register unload listener; using pagehide fallback only.', error);
  }
}`;
  }
}
