import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class UserScriptsPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    register(scripts: HexaWebUserScriptOptions[]): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.userScripts?.register) {
            return Promise.reject(new Error('userScripts.register API not available in this context'));
        }
        return Promise.resolve(api.userScripts.register(scripts)).then(() => undefined);
    }

    unregister(filter?: { ids?: string[] }): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.userScripts?.unregister) {
            return Promise.reject(new Error('userScripts.unregister API not available in this context'));
        }
        return Promise.resolve(api.userScripts.unregister(filter));
    }

    configureWorld(properties: { csp?: string; messaging?: boolean }): Promise<void> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.userScripts?.configureWorld) {
            return Promise.reject(new Error('userScripts.configureWorld API not available in this context'));
        }
        return Promise.resolve(api.userScripts.configureWorld(properties));
    }

    getScripts(filter?: { ids?: string[] }): Promise<HexaWebUserScriptOptions[]> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.userScripts?.getScripts) {
            return Promise.reject(new Error('userScripts.getScripts API not available in this context'));
        }
        return Promise.resolve(api.userScripts.getScripts(filter));
    }
}
