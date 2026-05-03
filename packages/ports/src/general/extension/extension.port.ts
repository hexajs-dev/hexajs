import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: HexaContext.Empty })
export class ExtensionPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    getURL(path?: string): string {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.extension?.getURL) {
            throw new Error('extension.getURL API not available in this context');
        }
        return api.extension.getURL(path);
    }

    isAllowedIncognitoAccess(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.extension?.isAllowedIncognitoAccess) {
                        reject(new Error('extension.isAllowedIncognitoAccess API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.extension.isAllowedIncognitoAccess()).then((value: boolean) => resolve(!!value)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.extension?.isAllowedIncognitoAccess) {
                        reject(new Error('extension.isAllowedIncognitoAccess API not available in this context'));
                        return;
                    }
                    chromeApi.extension.isAllowedIncognitoAccess((value: boolean) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(!!value);
                        }
                    });
                    return;
                }
            }
        });
    }

    isAllowedFileSchemeAccess(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.extension?.isAllowedFileSchemeAccess) {
                        reject(new Error('extension.isAllowedFileSchemeAccess API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.extension.isAllowedFileSchemeAccess()).then((value: boolean) => resolve(!!value)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.extension?.isAllowedFileSchemeAccess) {
                        reject(new Error('extension.isAllowedFileSchemeAccess API not available in this context'));
                        return;
                    }
                    chromeApi.extension.isAllowedFileSchemeAccess((value: boolean) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(!!value);
                        }
                    });
                    return;
                }
            }
        });
    }

    getViews(fetchProperties?: { type?: 'tab' | 'popup' | 'background'; windowId?: number }): Window[] {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.extension?.getViews) {
                    throw new Error('extension.getViews API not available in this context');
                }
                return browserApi.extension.getViews(fetchProperties);
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.extension?.getViews) {
                    throw new Error('extension.getViews API not available in this context');
                }
                return chromeApi.extension.getViews(fetchProperties);
            }
        }
    }

    getBackgroundPage(): Window | null {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.extension?.getBackgroundPage) {
                    throw new Error('extension.getBackgroundPage API not available in this context');
                }
                return browserApi.extension.getBackgroundPage();
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.extension?.getBackgroundPage) {
                    throw new Error('extension.getBackgroundPage API not available in this context');
                }
                return chromeApi.extension.getBackgroundPage();
            }
        }
    }
}
