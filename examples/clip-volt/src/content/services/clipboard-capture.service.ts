import { Injectable, InjectableContext } from '@hexajs-dev/common';
import { SENSITIVE_PATTERNS } from '../../contract/config';
import { ClipItem } from '../../contract/messages';

@Injectable({ context: InjectableContext.Content })
export class ClipboardCaptureService {
  captureFromCopyEvent(event: ClipboardEvent): ClipItem | null {
    const text = this.extractText(event);
    if (!text || text.trim().length === 0) {
      return null;
    }
    const sourceElement = this.getSourceElementTag(event);
    const sensitive = this.detectSensitive(text, sourceElement);
    return new ClipItem(crypto.randomUUID(), text.trim(), window.location.href, window.location.hostname, sourceElement, Date.now(), sensitive);
  }

  private extractText(event: ClipboardEvent): string | null {
    if (event.clipboardData?.items?.length || event.clipboardData?.types?.length || event.clipboardData?.files?.length) {
      return event.clipboardData.getData('text/plain');
    }
    const selection = document.getSelection();
    return selection ? selection.toString() : null;
  }

  private getSourceElementTag(event: ClipboardEvent): string {
    const target = event.target;
    if (target instanceof HTMLElement) {
      const tag = target.tagName.toLowerCase();
      if (target instanceof HTMLInputElement) {
        return `<input:${target.type}>`;
      }
      return `<${tag}>`;
    }
    return '<unknown>';
  }

  private detectSensitive(text: string, sourceElement: string): boolean {
    if (sourceElement === '<input:password>') {
      return true;
    }
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }
}
