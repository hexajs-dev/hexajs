import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class TabGroupsPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    query(queryInfo: HexaWebTabGroupQueryInfo): Promise<HexaWebTabGroup[]> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.tabGroups?.query) {
            return Promise.reject(new Error('tabGroups.query API not available in this context'));
        }
        return Promise.resolve(api.tabGroups.query(queryInfo));
    }

    get(groupId: number): Promise<HexaWebTabGroup> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.tabGroups?.get) {
            return Promise.reject(new Error('tabGroups.get API not available in this context'));
        }
        return Promise.resolve(api.tabGroups.get(groupId));
    }

    update(groupId: number, updateProperties: Partial<HexaWebTabGroup>): Promise<HexaWebTabGroup> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.tabGroups?.update) {
            return Promise.reject(new Error('tabGroups.update API not available in this context'));
        }
        return Promise.resolve(api.tabGroups.update(groupId, updateProperties));
    }
}
