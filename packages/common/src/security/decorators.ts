import { createAllowExternalPolicy, INTERNAL_ONLY_BOUNDARY_POLICY, setClassBoundaryPolicy, setMethodBoundaryPolicy } from './metadata';
import { AllowExternalOptions } from './types';

function resolveClassTarget(target: object): object {
  return typeof target === 'function' ? target : (target as any).constructor;
}

function isClassDecoratorUsage(propertyKey: string | symbol | undefined): boolean {
  return typeof propertyKey === 'undefined';
}

export function AllowExternal(options: AllowExternalOptions = {}): ClassDecorator & MethodDecorator {
  const policy = createAllowExternalPolicy(options);

  return (target: object, propertyKey?: string | symbol) => {
    const classTarget = resolveClassTarget(target);

    if (isClassDecoratorUsage(propertyKey)) {
      setClassBoundaryPolicy(classTarget, policy);
      return;
    }

    setMethodBoundaryPolicy(classTarget, propertyKey, policy);
  };
}

export function InternalOnly(): ClassDecorator & MethodDecorator {
  return (target: object, propertyKey?: string | symbol) => {
    const classTarget = resolveClassTarget(target);

    if (isClassDecoratorUsage(propertyKey)) {
      setClassBoundaryPolicy(classTarget, INTERNAL_ONLY_BOUNDARY_POLICY);
      return;
    }

    setMethodBoundaryPolicy(classTarget, propertyKey, INTERNAL_ONLY_BOUNDARY_POLICY);
  };
}
