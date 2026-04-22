import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class BrowsingDataPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    remove(options: HexaWebRemovalOptions, dataToRemove: HexaWebDataTypeSet): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.browsingData?.remove) {
            return Promise.reject(new Error('browsingData.remove API not available in this context'));
        }
        return Promise.resolve(api.browsingData.remove(options, dataToRemove));
    }

    removeCache(options: HexaWebRemovalOptions): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.browsingData?.removeCache) {
            return Promise.reject(new Error('browsingData.removeCache API not available in this context'));
        }
        return Promise.resolve(api.browsingData.removeCache(options));
    }

    removeCookies(options: HexaWebRemovalOptions): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.browsingData?.removeCookies) {
            return Promise.reject(new Error('browsingData.removeCookies API not available in this context'));
        }
        return Promise.resolve(api.browsingData.removeCookies(options));
    }

    removeHistory(options: HexaWebRemovalOptions): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.browsingData?.removeHistory) {
            return Promise.reject(new Error('browsingData.removeHistory API not available in this context'));
        }
        return Promise.resolve(api.browsingData.removeHistory(options));
    }
}
