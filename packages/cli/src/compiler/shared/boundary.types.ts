export interface RouteBoundaryPolicyMetadata {
  mode: 'internal-only' | 'allow-external';
  ids?: string[];
  origins?: string[];
}
