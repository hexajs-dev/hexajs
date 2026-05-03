import { ControllerMetadata, MethodMetadata } from '../../../compiler/background/controller/types';
import { buildDependencyArgs, toLowerFirst } from '../../shared';

export class BackgroundControllerGenerator {
  public generateRegistrations(controllers: ControllerMetadata[]): string {
    if (controllers.length === 0) {
      return '  return { onInit: [], onDestroy: [] };';
    }

    const registrations: string[] = [
      `  const controllerContainer = container.resolve(ControllerContainer);`,
      `  const onInit = [];`,
      `  const onDestroy = [];`,
      ``
    ];

    controllers.forEach(controller => {
      const deps = buildDependencyArgs(controller);
      const instanceName = toLowerFirst(controller.className);
      registrations.push(`  const ${instanceName} = new ${controller.className}(${deps});`);

      controller.methods
        .filter(method => method.actionName)
        .forEach(method => {
          const routeOptions = this.buildRouteOptions(method);
          registrations.push(`  controllerContainer.registerUnicast('${method.actionName}', ${instanceName}.${method.methodName}.bind(${instanceName}), ${routeOptions.policyLiteral}, ${routeOptions.externalSubscribedLiteral});`);
        });

      controller.methods
        .filter(method => method.eventName)
        .forEach(method => {
          const routeOptions = this.buildRouteOptions(method);
          registrations.push(`  controllerContainer.registerMulticast('${method.eventName}', ${instanceName}.${method.methodName}.bind(${instanceName}), ${routeOptions.policyLiteral}, ${routeOptions.externalSubscribedLiteral});`);
        });

      if (controller.hasOnInit) {
        registrations.push(`  onInit.push(${instanceName});`);
      }

      if (controller.hasOnDestroy) {
        registrations.push(`  onDestroy.push(${instanceName});`);
      }

      registrations.push(``);
    });

    registrations.push(`  return { onInit, onDestroy };`);
    return registrations.join('\n');
  }

  private buildRouteOptions(method: MethodMetadata): { policyLiteral: string; externalSubscribedLiteral: string } {
    const policy = method.boundaryPolicy ?? { mode: 'internal-only' as const };
    const policyParts = [`mode: '${policy.mode}'`];

    if (policy.ids && policy.ids.length > 0) {
      policyParts.push(`ids: ${JSON.stringify(policy.ids)}`);
    }

    if (policy.origins && policy.origins.length > 0) {
      policyParts.push(`origins: ${JSON.stringify(policy.origins)}`);
    }

    const externalSubscribed = typeof method.externalSubscribed === 'boolean'
      ? method.externalSubscribed
      : policy.mode === 'allow-external';

    return {
      policyLiteral: `{ ${policyParts.join(', ')} }`,
      externalSubscribedLiteral: externalSubscribed ? 'true' : 'false'
    };
  }
}
