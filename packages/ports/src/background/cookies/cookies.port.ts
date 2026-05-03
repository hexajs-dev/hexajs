import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';
import { rejectUnsupportedApi, rejectUnsupportedPlatform, throwUnsupportedApi, throwUnsupportedPlatform } from '../../shared/methods/port-errors.methods';

type CookiesChangeListener = (changeInfo: HexaWebCookiesOnChangedChangeInfo) => void;

@Injectable({ context: HexaContext.Background })
export class CookiesPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    findStoreIdByTabId(tabId: number): Promise<string | undefined> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.cookies?.getAllCookieStores) {
                        rejectUnsupportedApi(reject, 'CookiesPort.findStoreIdByTabId', this.platform, 'cookies.getAllCookieStores');
                        return;
                    }
                    Promise.resolve(browserApi.cookies.getAllCookieStores()).then((stores: HexaWebCookieStore[]) => {
                        const match = stores.find((store: HexaWebCookieStore) => Array.isArray(store?.tabIds) && store.tabIds.includes(tabId));
                        resolve(match?.id);
                    }).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.cookies?.getAllCookieStores) {
                        rejectUnsupportedApi(reject, 'CookiesPort.findStoreIdByTabId', this.platform, 'cookies.getAllCookieStores');
                        return;
                    }
                    chromeApi.cookies.getAllCookieStores((stores: HexaWebCookieStore[]) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                            return;
                        }
                        const match = stores.find((store: HexaWebCookieStore) => Array.isArray(store?.tabIds) && store.tabIds.includes(tabId));
                        resolve(match?.id);
                    });
                    return;
                }
                default: {
                    rejectUnsupportedPlatform(reject, 'CookiesPort.findStoreIdByTabId', this.platform, 'cookies.findStoreIdByTabId');
                    return;
                }
            }
        });
    }

    get(details: HexaWebCookiesGetDetails): Promise<HexaWebCookie | null> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.cookies?.get) {
                        rejectUnsupportedApi(reject, 'CookiesPort.get', this.platform, 'cookies.get');
                        return;
                    }
                    Promise.resolve(browserApi.cookies.get(details)).then(resolve).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.cookies?.get) {
                        rejectUnsupportedApi(reject, 'CookiesPort.get', this.platform, 'cookies.get');
                        return;
                    }
                    chromeApi.cookies.get(details, (cookie: HexaWebCookie | null) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(cookie);
                        }
                    });
                    return;
                }
                default: {
                    rejectUnsupportedPlatform(reject, 'CookiesPort.get', this.platform, 'cookies.get');
                    return;
                }
            }
        });
    }

    getAll(details: HexaWebCookiesGetAllDetails): Promise<HexaWebCookie[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.cookies?.getAllCookieStores || !browserApi?.cookies?.getAll) {
                        rejectUnsupportedApi(reject, 'CookiesPort.getAll', this.platform, 'cookies.getAll');
                        return;
                    }
                    Promise.resolve(browserApi.cookies.getAllCookieStores()).then(async (stores: HexaWebCookieStore[]) => {
                        const aggregated: HexaWebCookie[] = [];
                        for (const store of stores) {
                            const storeDetails = { ...(details || {}), storeId: store?.id };
                            const storeCookies = await Promise.resolve(browserApi.cookies.getAll(storeDetails));
                            aggregated.push(...(storeCookies || []));
                        }
                        resolve(aggregated);
                    }).catch(reject);
                    return;
                }
                case PlatformType.Firefox: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.cookies?.getAll) {
                        rejectUnsupportedApi(reject, 'CookiesPort.getAll', this.platform, 'cookies.getAll');
                        return;
                    }
                    Promise.resolve(browserApi.cookies.getAll(details)).then((cookies: HexaWebCookie[]) => resolve(cookies)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.cookies?.getAll) {
                        rejectUnsupportedApi(reject, 'CookiesPort.getAll', this.platform, 'cookies.getAll');
                        return;
                    }
                    chromeApi.cookies.getAll(details, (cookies: HexaWebCookie[]) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(cookies);
                        }
                    });
                    return;
                }
                default: {
                    rejectUnsupportedPlatform(reject, 'CookiesPort.getAll', this.platform, 'cookies.getAll');
                    return;
                }
            }
        });
    }

    removeAll(details: HexaWebCookiesGetAllDetails): Promise<HexaWebCookiesRemoveCallbackDetails[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.cookies?.getAllCookieStores || !browserApi?.cookies?.getAll || !browserApi?.cookies?.remove) {
                        rejectUnsupportedApi(reject, 'CookiesPort.removeAll', this.platform, 'cookies.removeAll');
                        return;
                    }
                    Promise.resolve(browserApi.cookies.getAllCookieStores()).then(async (stores: HexaWebCookieStore[]) => {
                        const removed: HexaWebCookiesRemoveCallbackDetails[] = [];
                        for (const store of stores) {
                            const storeDetails = { ...(details || {}), storeId: store?.id };
                            const cookies = await Promise.resolve(browserApi.cookies.getAll(storeDetails));
                            for (const cookie of cookies || []) {
                                const secure = cookie?.secure ? 'https://' : 'http://';
                                const domain = `${cookie?.domain || ''}`.replace(/^\./, '');
                                const path = cookie?.path || '/';
                                const removeDetails = { url: `${secure}${domain}${path}`, name: cookie?.name, storeId: store?.id };
                                const removeResult = await Promise.resolve(browserApi.cookies.remove(removeDetails));
                                removed.push(removeResult);
                            }
                        }
                        resolve(removed);
                    }).catch(reject);
                    return;
                }
                case PlatformType.Firefox: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.cookies?.getAll || !browserApi?.cookies?.remove) {
                        rejectUnsupportedApi(reject, 'CookiesPort.removeAll', this.platform, 'cookies.removeAll');
                        return;
                    }
                    Promise.resolve(browserApi.cookies.getAll(details || {})).then(async (cookies: HexaWebCookie[]) => {
                        const removed: HexaWebCookiesRemoveCallbackDetails[] = [];
                        for (const cookie of cookies || []) {
                            const secure = cookie?.secure ? 'https://' : 'http://';
                            const domain = `${cookie?.domain || ''}`.replace(/^\./, '');
                            const path = cookie?.path || '/';
                            const removeDetails = { url: `${secure}${domain}${path}`, name: cookie?.name, storeId: cookie?.storeId };
                            const removeResult = await Promise.resolve(browserApi.cookies.remove(removeDetails));
                            removed.push(removeResult);
                        }
                        resolve(removed);
                    }).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.cookies?.getAll || !chromeApi?.cookies?.remove) {
                        rejectUnsupportedApi(reject, 'CookiesPort.removeAll', this.platform, 'cookies.removeAll');
                        return;
                    }
                    chromeApi.cookies.getAll(details || {}, (cookies: HexaWebCookie[]) => {
                        const getAllError = chromeApi.runtime?.lastError;
                        if (getAllError) {
                            reject(getAllError);
                            return;
                        }
                        const removals = (cookies || []).map((cookie: HexaWebCookie) => new Promise<HexaWebCookiesRemoveCallbackDetails>((resolveRemove, rejectRemove) => {
                            const secure = cookie?.secure ? 'https://' : 'http://';
                            const domain = `${cookie?.domain || ''}`.replace(/^\./, '');
                            const path = cookie?.path || '/';
                            const removeDetails = { url: `${secure}${domain}${path}`, name: cookie?.name, storeId: cookie?.storeId };
                            chromeApi.cookies.remove(removeDetails, (removeInfo: HexaWebCookiesRemoveCallbackDetails) => {
                                const removeError = chromeApi.runtime?.lastError;
                                if (removeError) {
                                    rejectRemove(removeError);
                                } else {
                                    resolveRemove(removeInfo);
                                }
                            });
                        }));
                        Promise.all(removals).then((removed) => resolve(removed)).catch(reject);
                    });
                    return;
                }
                default: {
                    rejectUnsupportedPlatform(reject, 'CookiesPort.removeAll', this.platform, 'cookies.removeAll');
                    return;
                }
            }
        });
    }

    set(details: HexaWebCookiesSetDetails): Promise<HexaWebCookie | null> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.cookies?.set) {
                        rejectUnsupportedApi(reject, 'CookiesPort.set', this.platform, 'cookies.set');
                        return;
                    }
                    Promise.resolve(browserApi.cookies.set(details)).then(resolve).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.cookies?.set) {
                        rejectUnsupportedApi(reject, 'CookiesPort.set', this.platform, 'cookies.set');
                        return;
                    }
                    chromeApi.cookies.set(details, (cookie: HexaWebCookie | null) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(cookie);
                        }
                    });
                    return;
                }
                default: {
                    rejectUnsupportedPlatform(reject, 'CookiesPort.set', this.platform, 'cookies.set');
                    return;
                }
            }
        });
    }

    remove(details: HexaWebCookiesRemoveDetails): Promise<HexaWebCookiesRemoveCallbackDetails> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.cookies?.remove) {
                        rejectUnsupportedApi(reject, 'CookiesPort.remove', this.platform, 'cookies.remove');
                        return;
                    }
                    Promise.resolve(browserApi.cookies.remove(details)).then(resolve).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.cookies?.remove) {
                        rejectUnsupportedApi(reject, 'CookiesPort.remove', this.platform, 'cookies.remove');
                        return;
                    }
                    chromeApi.cookies.remove(details, (removeInfo: HexaWebCookiesRemoveCallbackDetails) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(removeInfo);
                        }
                    });
                    return;
                }
                default: {
                    rejectUnsupportedPlatform(reject, 'CookiesPort.remove', this.platform, 'cookies.remove');
                    return;
                }
            }
        });
    }

    getAllCookieStores(): Promise<HexaWebCookieStore[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.cookies?.getAllCookieStores) {
                        rejectUnsupportedApi(reject, 'CookiesPort.getAllCookieStores', this.platform, 'cookies.getAllCookieStores');
                        return;
                    }
                    Promise.resolve(browserApi.cookies.getAllCookieStores()).then((stores: HexaWebCookieStore[]) => resolve(stores)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.cookies?.getAllCookieStores) {
                        rejectUnsupportedApi(reject, 'CookiesPort.getAllCookieStores', this.platform, 'cookies.getAllCookieStores');
                        return;
                    }
                    chromeApi.cookies.getAllCookieStores((stores: HexaWebCookieStore[]) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(stores);
                        }
                    });
                    return;
                }
                default: {
                    rejectUnsupportedPlatform(reject, 'CookiesPort.getAllCookieStores', this.platform, 'cookies.getAllCookieStores');
                    return;
                }
            }
        });
    }

    onChangedAddListener(listener: CookiesChangeListener): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.cookies?.onChanged?.addListener) {
                    throwUnsupportedApi('CookiesPort.onChangedAddListener', this.platform, 'cookies.onChanged.addListener');
                }
                browserApi.cookies.onChanged.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.cookies?.onChanged?.addListener) {
                    throwUnsupportedApi('CookiesPort.onChangedAddListener', this.platform, 'cookies.onChanged.addListener');
                }
                chromeApi.cookies.onChanged.addListener(listener);
                return;
            }
            default: {
                throwUnsupportedPlatform('CookiesPort.onChangedAddListener', this.platform, 'cookies.onChanged.addListener');
            }
        }
    }

    onChangedRemoveListener(listener: CookiesChangeListener): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.cookies?.onChanged?.removeListener) {
                    throwUnsupportedApi('CookiesPort.onChangedRemoveListener', this.platform, 'cookies.onChanged.removeListener');
                }
                browserApi.cookies.onChanged.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.cookies?.onChanged?.removeListener) {
                    throwUnsupportedApi('CookiesPort.onChangedRemoveListener', this.platform, 'cookies.onChanged.removeListener');
                }
                chromeApi.cookies.onChanged.removeListener(listener);
                return;
            }
            default: {
                throwUnsupportedPlatform('CookiesPort.onChangedRemoveListener', this.platform, 'cookies.onChanged.removeListener');
            }
        }
    }
}

