import { HandlerMetadata } from '../../../compiler/content/handler/types';
import { buildDependencyArgs, toLowerFirst } from '../../shared';

export class ContentHandlerGenerator {
  public generateRegistrations(handlers: HandlerMetadata[]): string {
    if (handlers.length === 0) {
      return '  return { onInit: [], onDestroy: [] };';
    }

    const registrations: string[] = [
      `  const handlerContainer = container.resolve(HandlerContainer);`,
      `  const onInit = [];`,
      `  const onDestroy = [];`,
      ``
    ];

    handlers.forEach(handler => {
      const deps = buildDependencyArgs(handler);
      const instanceName = toLowerFirst(handler.className);
      registrations.push(`  const ${instanceName} = new ${handler.className}(${deps});`);

      handler.methods
        .filter(method => method.handleName)
        .forEach(method => {
          registrations.push(`  handlerContainer.registerUnicast('${method.handleName}', ${instanceName}.${method.methodName}.bind(${instanceName}));`);
        });

      handler.methods
        .filter(method => method.eventName)
        .forEach(method => {
          registrations.push(`  handlerContainer.registerMulticast('${method.eventName}', ${instanceName}.${method.methodName}.bind(${instanceName}));`);
        });

      if (handler.hasOnInit) {
        registrations.push(`  onInit.push(${instanceName});`);
      }

      if (handler.hasOnDestroy) {
        registrations.push(`  onDestroy.push(${instanceName});`);
      }

      registrations.push(``);
    });

    registrations.push(`  return { onInit, onDestroy };`);
    return registrations.join('\n');
  }
}
