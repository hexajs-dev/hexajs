export function hasHexaError(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return '__hexa_error__' in value;
}
