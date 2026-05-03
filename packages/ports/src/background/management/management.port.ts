import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: HexaContext.Background })
export class ManagementPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    getAll(): Promise<HexaWebManagementExtensionInfo[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.management?.getAll) {
                        reject(new Error('management.getAll API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.management.getAll()).then((items: HexaWebManagementExtensionInfo[]) => resolve(items || [])).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.management?.getAll) {
                        reject(new Error('management.getAll API not available in this context'));
                        return;
                    }
                    chromeApi.management.getAll((items: HexaWebManagementExtensionInfo[]) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(items || []);
                        }
                    });
                    return;
                }
            }
        });
    }

    getSelf(): Promise<HexaWebManagementExtensionInfo> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.management?.getSelf) {
                        reject(new Error('management.getSelf API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.management.getSelf()).then((item: HexaWebManagementExtensionInfo) => resolve(item)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.management?.getSelf) {
                        reject(new Error('management.getSelf API not available in this context'));
                        return;
                    }
                    chromeApi.management.getSelf((item: HexaWebManagementExtensionInfo) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(item);
                        }
                    });
                    return;
                }
            }
        });
    }

    setEnabled(id: string, enabled: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.management?.setEnabled) {
                        reject(new Error('management.setEnabled API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.management.setEnabled(id, enabled)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.management?.setEnabled) {
                        reject(new Error('management.setEnabled API not available in this context'));
                        return;
                    }
                    chromeApi.management.setEnabled(id, enabled, () => {
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

    onInstalledAddListener(listener: (info: HexaWebManagementExtensionInfo) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.management?.onInstalled?.addListener) {
                    throw new Error('management.onInstalled.addListener API not available in this context');
                }
                browserApi.management.onInstalled.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.management?.onInstalled?.addListener) {
                    throw new Error('management.onInstalled.addListener API not available in this context');
                }
                chromeApi.management.onInstalled.addListener(listener);
                return;
            }
        }
    }

    onInstalledRemoveListener(listener: (info: HexaWebManagementExtensionInfo) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.management?.onInstalled?.removeListener) {
                    throw new Error('management.onInstalled.removeListener API not available in this context');
                }
                browserApi.management.onInstalled.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.management?.onInstalled?.removeListener) {
                    throw new Error('management.onInstalled.removeListener API not available in this context');
                }
                chromeApi.management.onInstalled.removeListener(listener);
                return;
            }
        }
    }

    onUninstalledAddListener(listener: (id: string) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.management?.onUninstalled?.addListener) {
                    throw new Error('management.onUninstalled.addListener API not available in this context');
                }
                browserApi.management.onUninstalled.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.management?.onUninstalled?.addListener) {
                    throw new Error('management.onUninstalled.addListener API not available in this context');
                }
                chromeApi.management.onUninstalled.addListener(listener);
                return;
            }
        }
    }

    onUninstalledRemoveListener(listener: (id: string) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.management?.onUninstalled?.removeListener) {
                    throw new Error('management.onUninstalled.removeListener API not available in this context');
                }
                browserApi.management.onUninstalled.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.management?.onUninstalled?.removeListener) {
                    throw new Error('management.onUninstalled.removeListener API not available in this context');
                }
                chromeApi.management.onUninstalled.removeListener(listener);
                return;
            }
        }
    }

    onEnabledAddListener(listener: (info: HexaWebManagementExtensionInfo) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.management?.onEnabled?.addListener) {
                    throw new Error('management.onEnabled.addListener API not available in this context');
                }
                browserApi.management.onEnabled.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.management?.onEnabled?.addListener) {
                    throw new Error('management.onEnabled.addListener API not available in this context');
                }
                chromeApi.management.onEnabled.addListener(listener);
                return;
            }
        }
    }

    onEnabledRemoveListener(listener: (info: HexaWebManagementExtensionInfo) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.management?.onEnabled?.removeListener) {
                    throw new Error('management.onEnabled.removeListener API not available in this context');
                }
                browserApi.management.onEnabled.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.management?.onEnabled?.removeListener) {
                    throw new Error('management.onEnabled.removeListener API not available in this context');
                }
                chromeApi.management.onEnabled.removeListener(listener);
                return;
            }
        }
    }

    onDisabledAddListener(listener: (info: HexaWebManagementExtensionInfo) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.management?.onDisabled?.addListener) {
                    throw new Error('management.onDisabled.addListener API not available in this context');
                }
                browserApi.management.onDisabled.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.management?.onDisabled?.addListener) {
                    throw new Error('management.onDisabled.addListener API not available in this context');
                }
                chromeApi.management.onDisabled.addListener(listener);
                return;
            }
        }
    }

    onDisabledRemoveListener(listener: (info: HexaWebManagementExtensionInfo) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.management?.onDisabled?.removeListener) {
                    throw new Error('management.onDisabled.removeListener API not available in this context');
                }
                browserApi.management.onDisabled.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.management?.onDisabled?.removeListener) {
                    throw new Error('management.onDisabled.removeListener API not available in this context');
                }
                chromeApi.management.onDisabled.removeListener(listener);
                return;
            }
        }
    }
}
