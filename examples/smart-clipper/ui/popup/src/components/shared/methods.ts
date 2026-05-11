import { getOcrLanguageTag, parseOcrLanguageSelection } from '@contract/ocr-language';

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getClipLanguageTags(ocrLanguage?: string): string[] {
  if (!ocrLanguage) {
    return [];
  }
  return parseOcrLanguageSelection(ocrLanguage).map(language => getOcrLanguageTag(language));
}

export async function copyToClipboard(value: string): Promise<boolean> {
  if (!value) {
    return false;
  }

  // Try execCommand synchronously first — works reliably with a user gesture
  // in extension popup pages without requiring clipboard permission.
  if (typeof document !== 'undefined' && document.body && typeof document.execCommand === 'function') {
    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      if (document.execCommand('copy')) {
        return true;
      }
    } catch {
      // execCommand unavailable in this context; fall through to clipboard API.
    } finally {
      document.body.removeChild(textArea);
    }
  }

  // Fallback to the async Clipboard API (requires clipboardWrite permission or
  // a sufficiently permissive browser context).
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
