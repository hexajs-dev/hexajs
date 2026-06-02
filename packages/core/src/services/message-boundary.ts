import { HexaMessageBoundaryPolicy } from '@hexajs-dev/common';

export type MessageChannel = 'internal' | 'external';

export interface BoundaryEvaluationResult {
  allowed: boolean;
  internal: boolean;
  senderId?: string;
  senderOrigin?: string;
}

function normalizeOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

function resolveRuntimeId(): string | undefined {
  const webExtId = (globalThis as any).webExt?.runtime?.id;
  const browserId = (globalThis as any).browser?.runtime?.id;
  const chromeId = (globalThis as any).chrome?.runtime?.id;
  const runtimeId = webExtId ?? browserId ?? chromeId;

  if (typeof runtimeId !== 'string') {
    return undefined;
  }

  const trimmed = runtimeId.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveSenderId(sender: unknown): string | undefined {
  if (!sender || typeof sender !== 'object') {
    return undefined;
  }

  const senderId = (sender as any).id;
  if (typeof senderId !== 'string') {
    return undefined;
  }

  const trimmed = senderId.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveSenderOrigin(sender: unknown): string | undefined {
  if (!sender || typeof sender !== 'object') {
    return undefined;
  }

  const rawOrigin = (sender as any).origin;
  const rawUrl = (sender as any).url;
  const rawTabUrl = (sender as any).tab?.url;
  const candidate = typeof rawOrigin === 'string' ? rawOrigin : (typeof rawUrl === 'string' ? rawUrl : (typeof rawTabUrl === 'string' ? rawTabUrl : undefined));

  if (!candidate) {
    return undefined;
  }

  const normalized = normalizeOrigin(candidate);
  return normalized.length > 0 ? normalized : undefined;
}

function isInternalSender(senderId: string | undefined): boolean {
  // Fail closed: if we can't verify identity, don't assume internal
  if (!senderId) {
    return false;
  }

  const runtimeId = resolveRuntimeId();
  if (!runtimeId) {
    return false;
  }

  return senderId === runtimeId;
}

export function evaluateMessageBoundaryPolicy(policy: Readonly<HexaMessageBoundaryPolicy>, sender: unknown, channel: MessageChannel): BoundaryEvaluationResult {
  const senderId = resolveSenderId(sender);
  const senderOrigin = resolveSenderOrigin(sender);
  const internal = isInternalSender(senderId);

  if (internal) {
    return { allowed: true, internal, senderId, senderOrigin };
  }

  if (policy.mode === 'internal-only') {
    return { allowed: false, internal: false, senderId, senderOrigin };
  }

  const ids = policy.ids ?? [];
  const origins = policy.origins ?? [];
  // RT-02: fail closed on empty external allow-list instead of wildcard allow
  if (ids.length === 0 && origins.length === 0) {
    return { allowed: false, internal: false, senderId, senderOrigin };
  }

  const idAllowed = senderId ? ids.includes(senderId) : false;
  const originAllowed = senderOrigin ? origins.some(origin => normalizeOrigin(origin) === senderOrigin) : false;

  return {
    allowed: idAllowed || originAllowed,
    internal: false,
    senderId,
    senderOrigin,
  };
}
