import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class StoragePort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    get(areaName: HexaWebStorageAreaName, keys: string | string[] | { [key: string]: any } | null): Promise<{ [key: string]: any }> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    const area = browserApi?.storage?.[areaName];
                    if (!area?.get) {
                        reject(new Error(`storage.${areaName}.get API not available in this context`));
                        return;
                    }
                    Promise.resolve(area.get(keys)).then((items: { [key: string]: any }) => resolve(items || {})).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    const area = chromeApi?.storage?.[areaName];
                    if (!area?.get) {
                        reject(new Error(`storage.${areaName}.get API not available in this context`));
                        return;
                    }
                    area.get(keys, (items: { [key: string]: any }) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(items || {});
                        }
                    });
                    return;
                }
            }
        });
    }

    set(areaName: HexaWebStorageAreaName, items: { [key: string]: any }): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    const area = browserApi?.storage?.[areaName];
                    if (!area?.set) {
                        reject(new Error(`storage.${areaName}.set API not available in this context`));
                        return;
                    }
                    Promise.resolve(area.set(items)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    const area = chromeApi?.storage?.[areaName];
                    if (!area?.set) {
                        reject(new Error(`storage.${areaName}.set API not available in this context`));
                        return;
                    }
                    area.set(items, () => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve();
                        }
                    });
                    return;
                }
            }
        });
    }

    remove(areaName: HexaWebStorageAreaName, keys: string | string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    const area = browserApi?.storage?.[areaName];
                    if (!area?.remove) {
                        reject(new Error(`storage.${areaName}.remove API not available in this context`));
                        return;
                    }
                    Promise.resolve(area.remove(keys)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    const area = chromeApi?.storage?.[areaName];
                    if (!area?.remove) {
                        reject(new Error(`storage.${areaName}.remove API not available in this context`));
                        return;
                    }
                    area.remove(keys, () => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve();
                        }
                    });
                    return;
                }
            }
        });
    }

    clear(areaName: HexaWebStorageAreaName): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    const area = browserApi?.storage?.[areaName];
                    if (!area?.clear) {
                        reject(new Error(`storage.${areaName}.clear API not available in this context`));
                        return;
                    }
                    Promise.resolve(area.clear()).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    const area = chromeApi?.storage?.[areaName];
                    if (!area?.clear) {
                        reject(new Error(`storage.${areaName}.clear API not available in this context`));
                        return;
                    }
                    area.clear(() => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve();
                        }
                    });
                    return;
                }
            }
        });
    }

    onChangedAddListener(listener: (changes: HexaWebStorageChangesMap, areaName: HexaWebStorageAreaName) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.storage?.onChanged?.addListener) {
                    throw new Error('storage.onChanged.addListener API not available in this context');
                }
                browserApi.storage.onChanged.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.storage?.onChanged?.addListener) {
                    throw new Error('storage.onChanged.addListener API not available in this context');
                }
                chromeApi.storage.onChanged.addListener(listener);
                return;
            }
        }
    }

    onChangedRemoveListener(listener: (changes: HexaWebStorageChangesMap, areaName: HexaWebStorageAreaName) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.storage?.onChanged?.removeListener) {
                    throw new Error('storage.onChanged.removeListener API not available in this context');
                }
                browserApi.storage.onChanged.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.storage?.onChanged?.removeListener) {
                    throw new Error('storage.onChanged.removeListener API not available in this context');
                }
                chromeApi.storage.onChanged.removeListener(listener);
                return;
            }
        }
    }

    setAccessLevel(options: HexaWebStorageSetAccessLevelOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.storage?.setAccessLevel) {
                        reject(new Error('storage.setAccessLevel API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.storage.setAccessLevel(options)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.storage?.setAccessLevel) {
                        reject(new Error('storage.setAccessLevel API not available in this context'));
                        return;
                    }
                    Promise.resolve(chromeApi.storage.setAccessLevel(options)).then(() => resolve()).catch(reject);
                    return;
                }
            }
        });
    }
}
