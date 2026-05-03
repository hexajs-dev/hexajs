import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: HexaContext.Background })
export class PermissionsPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    contains(permissions: HexaWebPermissions): Promise<boolean> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.permissions?.contains) {
            return Promise.reject(new Error('permissions.contains API not available in this context'));
        }
        return Promise.resolve(api.permissions.contains(permissions));
    }

    getAll(): Promise<HexaWebPermissions> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.permissions?.getAll) {
            return Promise.reject(new Error('permissions.getAll API not available in this context'));
        }
        return Promise.resolve(api.permissions.getAll());
    }

    request(permissions: HexaWebPermissions): Promise<boolean> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.permissions?.request) {
            return Promise.reject(new Error('permissions.request API not available in this context'));
        }
        return Promise.resolve(api.permissions.request(permissions));
    }

    remove(permissions: HexaWebPermissions): Promise<boolean> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.permissions?.remove) {
            return Promise.reject(new Error('permissions.remove API not available in this context'));
        }
        return Promise.resolve(api.permissions.remove(permissions));
    }

    onAddedAddListener(listener: (permissions: HexaWebPermissions) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.permissions?.onAdded?.addListener) {
                    throw new Error('permissions.onAdded.addListener API not available in this context');
                }
                browserApi.permissions.onAdded.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.permissions?.onAdded?.addListener) {
                    throw new Error('permissions.onAdded.addListener API not available in this context');
                }
                chromeApi.permissions.onAdded.addListener(listener);
                return;
            }
        }
    }

    onAddedRemoveListener(listener: (permissions: HexaWebPermissions) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.permissions?.onAdded?.removeListener) {
                    throw new Error('permissions.onAdded.removeListener API not available in this context');
                }
                browserApi.permissions.onAdded.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.permissions?.onAdded?.removeListener) {
                    throw new Error('permissions.onAdded.removeListener API not available in this context');
                }
                chromeApi.permissions.onAdded.removeListener(listener);
                return;
            }
        }
    }

    onRemovedAddListener(listener: (permissions: HexaWebPermissions) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.permissions?.onRemoved?.addListener) {
                    throw new Error('permissions.onRemoved.addListener API not available in this context');
                }
                browserApi.permissions.onRemoved.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.permissions?.onRemoved?.addListener) {
                    throw new Error('permissions.onRemoved.addListener API not available in this context');
                }
                chromeApi.permissions.onRemoved.addListener(listener);
                return;
            }
        }
    }

    onRemovedRemoveListener(listener: (permissions: HexaWebPermissions) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.permissions?.onRemoved?.removeListener) {
                    throw new Error('permissions.onRemoved.removeListener API not available in this context');
                }
                browserApi.permissions.onRemoved.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.permissions?.onRemoved?.removeListener) {
                    throw new Error('permissions.onRemoved.removeListener API not available in this context');
                }
                chromeApi.permissions.onRemoved.removeListener(listener);
                return;
            }
        }
    }
}
