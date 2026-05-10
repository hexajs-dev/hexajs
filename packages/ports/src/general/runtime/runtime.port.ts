import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';
import { rejectUnsupportedApi, throwUnsupportedApi } from '../../shared/methods/port-errors.methods';

@Injectable({ context: HexaContext.Empty })
export class RuntimePort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    reload(): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.runtime?.reload) {
                    throwUnsupportedApi('RuntimePort.reload', this.platform, 'runtime.reload');
                }
                browserApi.runtime.reload();
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.runtime?.reload) {
                    throwUnsupportedApi('RuntimePort.reload', this.platform, 'runtime.reload');
                }
                chromeApi.runtime.reload();
                return;
            }
        }
    }

    onMessage(callback: (message: any, sender: webExt.runtime.MessageSender, sendResponse: (response?: any) => void) => boolean | void): () => void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.runtime?.onMessage) {
                    console.warn('[RuntimePort.onMessage] runtime.onMessage is not available on this platform.');
                    return () => {};
                }
                const wrapper = (message: any, sender: webExt.runtime.MessageSender, sendResponse: (response?: any) => void) => callback(message, sender, sendResponse);
                browserApi.runtime.onMessage.addListener(wrapper);
                return () => browserApi.runtime.onMessage.removeListener(wrapper);
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.runtime?.onMessage) {
                    throwUnsupportedApi('RuntimePort.onMessage', this.platform, 'runtime.onMessage');
                }
                const wrapper = (message: any, sender: webExt.runtime.MessageSender, sendResponse: (response?: any) => void) => callback(message, sender, sendResponse);
                chromeApi.runtime.onMessage.addListener(wrapper);
                return () => chromeApi.runtime.onMessage.removeListener(wrapper);
            }
        }
    }

    onMessageExternal(callback: (message: any, sender: webExt.runtime.MessageSender, sendResponse: (response?: any) => void) => boolean | void): () => void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.runtime?.onMessageExternal) {
                    console.warn('[RuntimePort.onMessageExternal] runtime.onMessageExternal is not available on this platform.');
                    return () => {};
                }
                const wrapper = (message: any, sender: webExt.runtime.MessageSender, sendResponse: (response?: any) => void) => callback(message, sender, sendResponse);
                browserApi.runtime.onMessageExternal.addListener(wrapper);
                return () => browserApi.runtime.onMessageExternal.removeListener(wrapper);
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.runtime?.onMessageExternal) {
                    throwUnsupportedApi('RuntimePort.onMessageExternal', this.platform, 'runtime.onMessageExternal');
                }
                const wrapper = (message: any, sender: webExt.runtime.MessageSender, sendResponse: (response?: any) => void) => callback(message, sender, sendResponse);
                chromeApi.runtime.onMessageExternal.addListener(wrapper);
                return () => chromeApi.runtime.onMessageExternal.removeListener(wrapper);
            }
        }
    }

    onSuspend(callback: () => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.runtime?.onSuspend) {
                    // Safari MV3 service workers do not expose runtime.onSuspend.
                    // Silently no-op — destroy callbacks will simply not fire on suspend.
                    console.warn('[RuntimePort.onSuspend] runtime.onSuspend is not available on this platform. onDestroy lifecycle will not be called on suspend.');
                    return;
                }
                browserApi.runtime.onSuspend.addListener(callback);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.runtime?.onSuspend) {
                    throwUnsupportedApi('RuntimePort.onSuspend', this.platform, 'runtime.onSuspend');
                }
                chromeApi.runtime.onSuspend.addListener(callback);
                return;
            }
        }
    }

    async sendMessage(message: any): Promise<any> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.runtime?.sendMessage) {
                        rejectUnsupportedApi(reject, 'RuntimePort.sendMessage', this.platform, 'runtime.sendMessage');
                        return;
                    }
                    Promise.resolve(browserApi.runtime.sendMessage(message)).then(resolve).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.runtime?.sendMessage) {
                        rejectUnsupportedApi(reject, 'RuntimePort.sendMessage', this.platform, 'runtime.sendMessage');
                        return;
                    }
                    chromeApi.runtime.sendMessage(message, (response: any) => {
                        const lastError = chromeApi.runtime.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(response);
                        }
                    });
                    return;
                }
            }
        });
    }

    getURL(path?: string): string {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.runtime?.getURL) {
                    throwUnsupportedApi('RuntimePort.getURL', this.platform, 'runtime.getURL');
                }
                return browserApi.runtime.getURL(path);
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.runtime?.getURL) {
                    throwUnsupportedApi('RuntimePort.getURL', this.platform, 'runtime.getURL');
                }
                return chromeApi.runtime.getURL(path);
            }
        }
    }
}

