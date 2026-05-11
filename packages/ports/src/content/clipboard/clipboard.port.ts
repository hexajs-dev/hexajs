import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { rejectUnsupportedApi } from '../../shared/methods/port-errors.methods';

@Injectable({ context: HexaContext.Content })
export class ClipboardPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    private tryExecCommandCopy(text: string): boolean {
        const doc = (globalThis as any).document;
        if (!doc?.body || typeof doc.createElement !== 'function' || typeof doc.execCommand !== 'function') {
            return false;
        }

        let textArea: any;
        try {
            textArea = doc.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            doc.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            return !!doc.execCommand('copy');
        } catch {
            return false;
        } finally {
            if (textArea?.parentNode) {
                textArea.parentNode.removeChild(textArea);
            }
        }
    }

    writeText(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const clipboard = (globalThis as any).navigator?.clipboard;
            if (!clipboard?.writeText) {
                if (this.tryExecCommandCopy(text)) {
                    resolve();
                    return;
                }
                rejectUnsupportedApi(reject, 'ClipboardPort.writeText', this.platform, 'clipboard.writeText');
                return;
            }

            Promise.resolve().then(() => clipboard.writeText(text)).then(() => resolve()).catch((error) => {
                if (this.tryExecCommandCopy(text)) {
                    resolve();
                    return;
                }
                reject(error);
            });
        });
    }

    readText(): Promise<string> {
        return new Promise((resolve, reject) => {
            const clipboard = (globalThis as any).navigator?.clipboard;
            if (!clipboard?.readText) {
                rejectUnsupportedApi(reject, 'ClipboardPort.readText', this.platform, 'clipboard.readText');
                return;
            }

            Promise.resolve().then(() => clipboard.readText()).then((value: string) => resolve(value)).catch(reject);
        });
    }
}