import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';
import { rejectUnsupportedApi, throwUnsupportedApi } from '../../shared/methods/port-errors.methods';

@Injectable({ context: HexaContext.Background })
export class ActionPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    setTitle(details: { title: string; tabId?: number }): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.action?.setTitle) {
                        rejectUnsupportedApi(reject, 'ActionPort.setTitle', this.platform, 'action.setTitle');
                        return;
                    }
                    Promise.resolve(browserApi.action.setTitle(details)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.action?.setTitle) {
                        rejectUnsupportedApi(reject, 'ActionPort.setTitle', this.platform, 'action.setTitle');
                        return;
                    }
                    Promise.resolve(chromeApi.action.setTitle(details)).then(() => resolve()).catch(reject);
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
                    if (!browserApi?.action?.setBadgeText) {
                        rejectUnsupportedApi(reject, 'ActionPort.setBadgeText', this.platform, 'action.setBadgeText');
                        return;
                    }
                    Promise.resolve(browserApi.action.setBadgeText(details)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.action?.setBadgeText) {
                        rejectUnsupportedApi(reject, 'ActionPort.setBadgeText', this.platform, 'action.setBadgeText');
                        return;
                    }
                    Promise.resolve(chromeApi.action.setBadgeText(details)).then(() => resolve()).catch(reject);
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
                    if (!browserApi?.action?.setBadgeBackgroundColor) {
                        rejectUnsupportedApi(reject, 'ActionPort.setBadgeBackgroundColor', this.platform, 'action.setBadgeBackgroundColor');
                        return;
                    }
                    Promise.resolve(browserApi.action.setBadgeBackgroundColor(details)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.action?.setBadgeBackgroundColor) {
                        rejectUnsupportedApi(reject, 'ActionPort.setBadgeBackgroundColor', this.platform, 'action.setBadgeBackgroundColor');
                        return;
                    }
                    Promise.resolve(chromeApi.action.setBadgeBackgroundColor(details)).then(() => resolve()).catch(reject);
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
                    if (!browserApi?.action?.setIcon) {
                        rejectUnsupportedApi(reject, 'ActionPort.setIcon', this.platform, 'action.setIcon');
                        return;
                    }
                    Promise.resolve(browserApi.action.setIcon(details)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.action?.setIcon) {
                        rejectUnsupportedApi(reject, 'ActionPort.setIcon', this.platform, 'action.setIcon');
                        return;
                    }
                    Promise.resolve(chromeApi.action.setIcon(details)).then(() => resolve()).catch(reject);
                    return;
                }
            }
        });
    }

    setPopup(details: { popup: string; tabId?: number }): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.action?.setPopup) {
                        rejectUnsupportedApi(reject, 'ActionPort.setPopup', this.platform, 'action.setPopup');
                        return;
                    }
                    Promise.resolve(browserApi.action.setPopup(details)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.action?.setPopup) {
                        rejectUnsupportedApi(reject, 'ActionPort.setPopup', this.platform, 'action.setPopup');
                        return;
                    }
                    Promise.resolve(chromeApi.action.setPopup(details)).then(() => resolve()).catch(reject);
                    return;
                }
            }
        });
    }

    enable(tabId?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.action?.enable) {
                        rejectUnsupportedApi(reject, 'ActionPort.enable', this.platform, 'action.enable');
                        return;
                    }
                    Promise.resolve(browserApi.action.enable(tabId)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.action?.enable) {
                        rejectUnsupportedApi(reject, 'ActionPort.enable', this.platform, 'action.enable');
                        return;
                    }
                    Promise.resolve(chromeApi.action.enable(tabId)).then(() => resolve()).catch(reject);
                    return;
                }
            }
        });
    }

    disable(tabId?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.action?.disable) {
                        rejectUnsupportedApi(reject, 'ActionPort.disable', this.platform, 'action.disable');
                        return;
                    }
                    Promise.resolve(browserApi.action.disable(tabId)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.action?.disable) {
                        rejectUnsupportedApi(reject, 'ActionPort.disable', this.platform, 'action.disable');
                        return;
                    }
                    Promise.resolve(chromeApi.action.disable(tabId)).then(() => resolve()).catch(reject);
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
                if (!browserApi?.action?.onClicked?.addListener) {
                    console.warn('[ActionPort.onClickedAddListener] action.onClicked.addListener is not available on this platform.');
                    return;
                }
                browserApi.action.onClicked.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.action?.onClicked?.addListener) {
                    throwUnsupportedApi('ActionPort.onClickedAddListener', this.platform, 'action.onClicked.addListener');
                }
                chromeApi.action.onClicked.addListener(listener);
                return;
            }
        }
    }

    onClickedRemoveListener(listener: (tab: HexaWebTab) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.action?.onClicked?.removeListener) {
                    console.warn('[ActionPort.onClickedRemoveListener] action.onClicked.removeListener is not available on this platform.');
                    return;
                }
                browserApi.action.onClicked.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.action?.onClicked?.removeListener) {
                    throwUnsupportedApi('ActionPort.onClickedRemoveListener', this.platform, 'action.onClicked.removeListener');
                }
                chromeApi.action.onClicked.removeListener(listener);
                return;
            }
        }
    }
}
