import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: HexaContext.Background })
export class MenusPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    create(createProperties: HexaWebMenusCreateProperties): string | number {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.menus?.create) {
            throw new Error('menus.create API not available in this context');
        }
        return api.menus.create(createProperties);
    }

    update(id: string | number, updateProperties: Partial<HexaWebMenusCreateProperties>): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.menus?.update) {
            return Promise.reject(new Error('menus.update API not available in this context'));
        }
        return Promise.resolve(api.menus.update(id, updateProperties));
    }

    remove(id: string | number): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.menus?.remove) {
            return Promise.reject(new Error('menus.remove API not available in this context'));
        }
        return Promise.resolve(api.menus.remove(id));
    }

    removeAll(): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.menus?.removeAll) {
            return Promise.reject(new Error('menus.removeAll API not available in this context'));
        }
        return Promise.resolve(api.menus.removeAll());
    }

    onClickedAddListener(listener: (info: any, tab?: HexaWebTab) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.menus?.onClicked?.addListener) {
                    throw new Error('menus.onClicked.addListener API not available in this context');
                }
                browserApi.menus.onClicked.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.menus?.onClicked?.addListener) {
                    throw new Error('menus.onClicked.addListener API not available in this context');
                }
                chromeApi.menus.onClicked.addListener(listener);
                return;
            }
        }
    }

    onClickedRemoveListener(listener: (info: any, tab?: HexaWebTab) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.menus?.onClicked?.removeListener) {
                    throw new Error('menus.onClicked.removeListener API not available in this context');
                }
                browserApi.menus.onClicked.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.menus?.onClicked?.removeListener) {
                    throw new Error('menus.onClicked.removeListener API not available in this context');
                }
                chromeApi.menus.onClicked.removeListener(listener);
                return;
            }
        }
    }
}
