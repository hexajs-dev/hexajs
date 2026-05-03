import { AllowExternalOptions, HexaMessageBoundaryPolicy } from './types';

const CLASS_BOUNDARY_POLICY = new WeakMap<object, Readonly<HexaMessageBoundaryPolicy>>();
const METHOD_BOUNDARY_POLICY = new WeakMap<object, ReadonlyMap<string | symbol, Readonly<HexaMessageBoundaryPolicy>>>();

export const INTERNAL_ONLY_BOUNDARY_POLICY: Readonly<HexaMessageBoundaryPolicy> = Object.freeze({ mode: 'internal-only' });

function normalizeList(values?: readonly string[]): readonly string[] | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }

  const normalized = Array.from(new Set(values.map(value => value.trim()).filter(value => value.length > 0)));
  if (normalized.length === 0) {
    return undefined;
  }

  return Object.freeze(normalized);
}

function freezeBoundaryPolicy(policy: HexaMessageBoundaryPolicy): Readonly<HexaMessageBoundaryPolicy> {
  const snapshot: HexaMessageBoundaryPolicy = { mode: policy.mode };
  const ids = normalizeList(policy.ids);
  const origins = normalizeList(policy.origins);

  if (ids) {
    snapshot.ids = ids;
  }

  if (origins) {
    snapshot.origins = origins;
  }

  return Object.freeze(snapshot);
}

function cloneMethodPolicyMap(target: object): Map<string | symbol, Readonly<HexaMessageBoundaryPolicy>> {
  const current = METHOD_BOUNDARY_POLICY.get(target);
  return current ? new Map(current) : new Map();
}

export function createAllowExternalPolicy(options: AllowExternalOptions = {}): Readonly<HexaMessageBoundaryPolicy> {
  return freezeBoundaryPolicy({
    mode: 'allow-external',
    ids: options.ids,
    origins: options.origins,
  });
}

export function setClassBoundaryPolicy(target: object, policy: HexaMessageBoundaryPolicy): void {
  CLASS_BOUNDARY_POLICY.set(target, freezeBoundaryPolicy(policy));
}

export function setMethodBoundaryPolicy(target: object, methodName: string | symbol, policy: HexaMessageBoundaryPolicy): void {
  const updated = cloneMethodPolicyMap(target);
  updated.set(methodName, freezeBoundaryPolicy(policy));
  METHOD_BOUNDARY_POLICY.set(target, updated);
}

export function getClassBoundaryPolicy(target: object): Readonly<HexaMessageBoundaryPolicy> | undefined {
  return CLASS_BOUNDARY_POLICY.get(target);
}

export function getMethodBoundaryPolicy(target: object, methodName: string | symbol): Readonly<HexaMessageBoundaryPolicy> | undefined {
  return METHOD_BOUNDARY_POLICY.get(target)?.get(methodName);
}

export function resolveRouteBoundaryPolicy(target: object, methodName?: string | symbol): Readonly<HexaMessageBoundaryPolicy> {
  if (methodName !== undefined) {
    const methodPolicy = getMethodBoundaryPolicy(target, methodName);
    if (methodPolicy) {
      return methodPolicy;
    }
  }

  const classPolicy = getClassBoundaryPolicy(target);
  return classPolicy ?? INTERNAL_ONLY_BOUNDARY_POLICY;
}
