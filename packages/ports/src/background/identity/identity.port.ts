import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class IdentityPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    getRedirectURL(path?: string): string {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.identity?.getRedirectURL) {
            throw new Error('identity.getRedirectURL API not available in this context');
        }
        return api.identity.getRedirectURL(path);
    }

    launchWebAuthFlow(details: HexaWebIdentityLaunchWebAuthFlowDetails): Promise<string> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.identity?.launchWebAuthFlow) {
            return Promise.reject(new Error('identity.launchWebAuthFlow API not available in this context'));
        }
        return Promise.resolve(api.identity.launchWebAuthFlow(details));
    }

    getProfileUserInfo(profileDetails?: { accountStatus?: 'ANY' | 'SYNC' }): Promise<HexaWebProfileUserInfo> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.identity?.getProfileUserInfo) {
            return Promise.reject(new Error('identity.getProfileUserInfo API not available in this context'));
        }
        return Promise.resolve(api.identity.getProfileUserInfo(profileDetails));
    }
}
