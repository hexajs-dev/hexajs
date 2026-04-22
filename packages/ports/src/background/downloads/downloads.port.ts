import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class DownloadsPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    download(options: HexaWebDownloadsDownloadOptions): Promise<number> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.downloads?.download) {
                        reject(new Error('downloads.download API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.downloads.download(options)).then((downloadId: number) => resolve(downloadId)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.downloads?.download) {
                        reject(new Error('downloads.download API not available in this context'));
                        return;
                    }
                    chromeApi.downloads.download(options, (downloadId: number) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(downloadId);
                        }
                    });
                    return;
                }
            }
        });
    }

    search(query: HexaWebDownloadsQuery): Promise<HexaWebDownloadItem[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.downloads?.search) {
                        reject(new Error('downloads.search API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.downloads.search(query)).then((items: HexaWebDownloadItem[]) => resolve(items || [])).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.downloads?.search) {
                        reject(new Error('downloads.search API not available in this context'));
                        return;
                    }
                    chromeApi.downloads.search(query, (items: HexaWebDownloadItem[]) => {
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

    erase(query: HexaWebDownloadsQuery): Promise<number[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.downloads?.erase) {
                        reject(new Error('downloads.erase API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.downloads.erase(query)).then((ids: number[]) => resolve(ids || [])).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.downloads?.erase) {
                        reject(new Error('downloads.erase API not available in this context'));
                        return;
                    }
                    chromeApi.downloads.erase(query, (ids: number[]) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(ids || []);
                        }
                    });
                    return;
                }
            }
        });
    }

    pause(downloadId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.downloads?.pause) {
                        reject(new Error('downloads.pause API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.downloads.pause(downloadId)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.downloads?.pause) {
                        reject(new Error('downloads.pause API not available in this context'));
                        return;
                    }
                    chromeApi.downloads.pause(downloadId, () => {
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

    resume(downloadId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.downloads?.resume) {
                        reject(new Error('downloads.resume API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.downloads.resume(downloadId)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.downloads?.resume) {
                        reject(new Error('downloads.resume API not available in this context'));
                        return;
                    }
                    chromeApi.downloads.resume(downloadId, () => {
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

    cancel(downloadId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.downloads?.cancel) {
                        reject(new Error('downloads.cancel API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.downloads.cancel(downloadId)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.downloads?.cancel) {
                        reject(new Error('downloads.cancel API not available in this context'));
                        return;
                    }
                    chromeApi.downloads.cancel(downloadId, () => {
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

    show(downloadId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.downloads?.show) {
                        reject(new Error('downloads.show API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.downloads.show(downloadId)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.downloads?.show) {
                        reject(new Error('downloads.show API not available in this context'));
                        return;
                    }
                    chromeApi.downloads.show(downloadId);
                    resolve();
                    return;
                }
            }
        });
    }

    open(downloadId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.downloads?.open) {
                        reject(new Error('downloads.open API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.downloads.open(downloadId)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.downloads?.open) {
                        reject(new Error('downloads.open API not available in this context'));
                        return;
                    }
                    chromeApi.downloads.open(downloadId);
                    resolve();
                    return;
                }
            }
        });
    }

    onChangedAddListener(listener: (delta: any) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.downloads?.onChanged?.addListener) {
                    throw new Error('downloads.onChanged.addListener API not available in this context');
                }
                browserApi.downloads.onChanged.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.downloads?.onChanged?.addListener) {
                    throw new Error('downloads.onChanged.addListener API not available in this context');
                }
                chromeApi.downloads.onChanged.addListener(listener);
                return;
            }
        }
    }

    onChangedRemoveListener(listener: (delta: any) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.downloads?.onChanged?.removeListener) {
                    throw new Error('downloads.onChanged.removeListener API not available in this context');
                }
                browserApi.downloads.onChanged.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.downloads?.onChanged?.removeListener) {
                    throw new Error('downloads.onChanged.removeListener API not available in this context');
                }
                chromeApi.downloads.onChanged.removeListener(listener);
                return;
            }
        }
    }

}
