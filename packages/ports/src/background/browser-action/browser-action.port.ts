import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class BrowserActionPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    setTitle(details: { title: string; tabId?: number }): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.browserAction?.setTitle) {
                        reject(new Error('browserAction.setTitle API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.browserAction.setTitle(details)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.browserAction?.setTitle) {
                        reject(new Error('browserAction.setTitle API not available in this context'));
                        return;
                    }
                    Promise.resolve(chromeApi.browserAction.setTitle(details)).then(() => resolve()).catch(reject);
                    return;
                }
            }
        });
    }

    setBadgeText(details: { text: string; tabId?: number }): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.browserAction?.setBadgeText) {
                        reject(new Error('browserAction.setBadgeText API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.browserAction.setBadgeText(details)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.browserAction?.setBadgeText) {
                        reject(new Error('browserAction.setBadgeText API not available in this context'));
                        return;
                    }
                    Promise.resolve(chromeApi.browserAction.setBadgeText(details)).then(() => resolve()).catch(reject);
                    return;
                }
            }
        });
    }

    setBadgeBackgroundColor(details: { color: string; tabId?: number }): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.browserAction?.setBadgeBackgroundColor) {
                        reject(new Error('browserAction.setBadgeBackgroundColor API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.browserAction.setBadgeBackgroundColor(details)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.browserAction?.setBadgeBackgroundColor) {
                        reject(new Error('browserAction.setBadgeBackgroundColor API not available in this context'));
                        return;
                    }
                    Promise.resolve(chromeApi.browserAction.setBadgeBackgroundColor(details)).then(() => resolve()).catch(reject);
                    return;
                }
            }
        });
    }

    setIcon(details: { path?: string | { [size: number]: string }; tabId?: number; imageData?: any }): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.browserAction?.setIcon) {
                        reject(new Error('browserAction.setIcon API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.browserAction.setIcon(details)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.browserAction?.setIcon) {
                        reject(new Error('browserAction.setIcon API not available in this context'));
                        return;
                    }
                    Promise.resolve(chromeApi.browserAction.setIcon(details)).then(() => resolve()).catch(reject);
                    return;
                }
            }
        });
    }

    onClickedAddListener(listener: (tab: HexaWebTab) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.browserAction?.onClicked?.addListener) {
                    throw new Error('browserAction.onClicked.addListener API not available in this context');
                }
                browserApi.browserAction.onClicked.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.browserAction?.onClicked?.addListener) {
                    throw new Error('browserAction.onClicked.addListener API not available in this context');
                }
                chromeApi.browserAction.onClicked.addListener(listener);
                return;
            }
        }
    }

    onClickedRemoveListener(listener: (tab: HexaWebTab) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.browserAction?.onClicked?.removeListener) {
                    throw new Error('browserAction.onClicked.removeListener API not available in this context');
                }
                browserApi.browserAction.onClicked.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.browserAction?.onClicked?.removeListener) {
                    throw new Error('browserAction.onClicked.removeListener API not available in this context');
                }
                chromeApi.browserAction.onClicked.removeListener(listener);
                return;
            }
        }
    }
}
