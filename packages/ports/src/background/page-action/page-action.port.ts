import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: HexaContext.Background })
export class PageActionPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    show(tabId: number): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.pageAction?.show) {
            return Promise.reject(new Error('pageAction.show API not available in this context'));
        }
        return Promise.resolve(api.pageAction.show(tabId));
    }

    hide(tabId: number): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.pageAction?.hide) {
            return Promise.reject(new Error('pageAction.hide API not available in this context'));
        }
        return Promise.resolve(api.pageAction.hide(tabId));
    }

    setTitle(details: { tabId: number; title?: string }): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.pageAction?.setTitle) {
            return Promise.reject(new Error('pageAction.setTitle API not available in this context'));
        }
        return Promise.resolve(api.pageAction.setTitle(details));
    }

    setIcon(details: { tabId: number; path?: string | { [size: number]: string }; imageData?: any }): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.pageAction?.setIcon) {
            return Promise.reject(new Error('pageAction.setIcon API not available in this context'));
        }
        return Promise.resolve(api.pageAction.setIcon(details));
    }

    setPopup(details: { tabId: number; popup: string }): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.pageAction?.setPopup) {
            return Promise.reject(new Error('pageAction.setPopup API not available in this context'));
        }
        return Promise.resolve(api.pageAction.setPopup(details));
    }

    onClickedAddListener(listener: (tab: HexaWebTab) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.pageAction?.onClicked?.addListener) {
                    throw new Error('pageAction.onClicked.addListener API not available in this context');
                }
                browserApi.pageAction.onClicked.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.pageAction?.onClicked?.addListener) {
                    throw new Error('pageAction.onClicked.addListener API not available in this context');
                }
                chromeApi.pageAction.onClicked.addListener(listener);
                return;
            }
        }
    }

    onClickedRemoveListener(listener: (tab: HexaWebTab) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.pageAction?.onClicked?.removeListener) {
                    throw new Error('pageAction.onClicked.removeListener API not available in this context');
                }
                browserApi.pageAction.onClicked.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.pageAction?.onClicked?.removeListener) {
                    throw new Error('pageAction.onClicked.removeListener API not available in this context');
                }
                chromeApi.pageAction.onClicked.removeListener(listener);
                return;
            }
        }
    }
}
