import { DevtoolsClipDiagnosticItem, DevtoolsErrorItem } from '@contract/messages/messages';

export function formatRelativeTime(timestamp: number): string {
  const deltaMs = Date.now() - timestamp;
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDuration(durationMs?: number): string {
  if (typeof durationMs !== 'number' || Number.isNaN(durationMs)) {
    return 'n/a';
  }
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }
  return `${(durationMs / 1000).toFixed(2)} s`;
}

export function formatConfidence(confidence?: number): string {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) {
    return 'n/a';
  }
  const normalizedConfidence = confidence > 1 ? confidence : confidence * 100;
  const boundedConfidence = Math.max(0, Math.min(100, normalizedConfidence));
  return `${Math.round(boundedConfidence)}%`;
}

export function getClipKey(clip: DevtoolsClipDiagnosticItem): string {
  return `${clip.capturedAt}:${clip.textPreview}:${clip.sourceTabId ?? 'na'}`;
}

export function getErrorKey(error: DevtoolsErrorItem, index: number): string {
  return `${error.failedAt}:${error.phase}:${index}`;
}
