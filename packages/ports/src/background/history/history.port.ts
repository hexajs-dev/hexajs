import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class HistoryPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    search(query: HexaWebHistorySearchQuery): Promise<HexaWebHistoryItem[]> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.history?.search) {
            return Promise.reject(new Error('history.search API not available in this context'));
        }
        return Promise.resolve(api.history.search(query));
    }

    addUrl(details: { url: string; title?: string; transition?: string; visitTime?: number }): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.history?.addUrl) {
            return Promise.reject(new Error('history.addUrl API not available in this context'));
        }
        return Promise.resolve(api.history.addUrl(details));
    }

    deleteUrl(details: { url: string }): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.history?.deleteUrl) {
            return Promise.reject(new Error('history.deleteUrl API not available in this context'));
        }
        return Promise.resolve(api.history.deleteUrl(details));
    }

    deleteRange(range: { startTime: number; endTime: number }): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.history?.deleteRange) {
            return Promise.reject(new Error('history.deleteRange API not available in this context'));
        }
        return Promise.resolve(api.history.deleteRange(range));
    }
}
