import { ControllerMetadata } from '../../../compiler/background/controller/types';
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
          registrations.push(`  controllerContainer.registerUnicast('${method.actionName}', ${instanceName}.${method.methodName}.bind(${instanceName}));`);
        });

      controller.methods
        .filter(method => method.eventName)
        .forEach(method => {
          registrations.push(`  controllerContainer.registerMulticast('${method.eventName}', ${instanceName}.${method.methodName}.bind(${instanceName}));`);
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
}
