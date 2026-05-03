export interface AllowExternalOptions {
  ids?: readonly string[];
  origins?: readonly string[];
}

export type HexaMessageBoundaryMode = 'internal-only' | 'allow-external';

export interface HexaMessageBoundaryPolicy {
  mode: HexaMessageBoundaryMode;
  ids?: readonly string[];
  origins?: readonly string[];
}
