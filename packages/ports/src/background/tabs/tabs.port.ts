import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs/common';
import { PlatformType } from '../../shared/platforms.methods';
import { rejectUnsupportedApi } from '../../shared/methods/port-errors.methods';

@Injectable({ context: InjectableContext.Background })
export class TabsPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    captureVisibleTab(windowId?: number, options?: HexaWebCaptureVisibleTabOptions): Promise<string> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.tabs?.captureVisibleTab) {
                        rejectUnsupportedApi(reject, 'TabsPort.captureVisibleTab', this.platform, 'tabs.captureVisibleTab');
                        return;
                    }
                    Promise.resolve(browserApi.tabs.captureVisibleTab(windowId, options)).then((imageDataUrl: string) => resolve(imageDataUrl)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.tabs?.captureVisibleTab) {
                        rejectUnsupportedApi(reject, 'TabsPort.captureVisibleTab', this.platform, 'tabs.captureVisibleTab');
                        return;
                    }
                    chromeApi.tabs.captureVisibleTab(windowId, options, (imageDataUrl: string) => {
                        const lastError = chromeApi.runtime.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(imageDataUrl);
                        }
                    });
                    return;
                }
            }
        });
    }

    sendTabMessage(tabId: number, message: any): Promise<any> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.tabs) {
                        rejectUnsupportedApi(reject, 'TabsPort.sendTabMessage', this.platform, 'tabs');
                        return;
                    }
                    Promise.resolve(browserApi.tabs.sendMessage(tabId, message)).then(resolve).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.tabs) {
                        rejectUnsupportedApi(reject, 'TabsPort.sendTabMessage', this.platform, 'tabs');
                        return;
                    }
                    chromeApi.tabs.sendMessage(tabId, message, (response: any) => {
                        const lastError = chromeApi.runtime.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(response);
                        }
                    });
                    return;
                }
            }
        });
    }

    emitTabMessage(tabId: number, message: any): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.tabs) {
                        rejectUnsupportedApi(reject, 'TabsPort.emitTabMessage', this.platform, 'tabs');
                        return;
                    }
                    Promise.resolve(browserApi.tabs.sendMessage(tabId, message)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.tabs) {
                        rejectUnsupportedApi(reject, 'TabsPort.emitTabMessage', this.platform, 'tabs');
                        return;
                    }
                    chromeApi.tabs.sendMessage(tabId, message, () => {
                        const lastError = chromeApi.runtime.lastError;
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

    getTab(tabId: number): Promise<HexaWebTab> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.tabs) {
                        rejectUnsupportedApi(reject, 'TabsPort.getTab', this.platform, 'tabs');
                        return;
                    }
                    Promise.resolve(browserApi.tabs.get(tabId)).then((tab) => resolve(tab as HexaWebTab)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.tabs) {
                        rejectUnsupportedApi(reject, 'TabsPort.getTab', this.platform, 'tabs');
                        return;
                    }
                    chromeApi.tabs.get(tabId, (tab: HexaWebTab) => {
                        const lastError = chromeApi.runtime.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(tab);
                        }
                    });
                    return;
                }
            }
        });
    }

    queryTabs(queryInfo: HexaWebTabsQueryInfo): Promise<HexaWebTab[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.tabs) {
                        rejectUnsupportedApi(reject, 'TabsPort.queryTabs', this.platform, 'tabs');
                        return;
                    }
                    Promise.resolve(browserApi.tabs.query(queryInfo)).then((tabs) => resolve(tabs as HexaWebTab[])).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.tabs) {
                        rejectUnsupportedApi(reject, 'TabsPort.queryTabs', this.platform, 'tabs');
                        return;
                    }
                    chromeApi.tabs.query(queryInfo, (tabs: HexaWebTab[]) => {
                        const lastError = chromeApi.runtime.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(tabs);
                        }
                    });
                    return;
                }
            }
        });
    }

    broadcastMessage(message: any, queryInfo?: HexaWebTabsQueryInfo): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.tabs) {
                        rejectUnsupportedApi(reject, 'TabsPort.broadcastMessage', this.platform, 'tabs');
                        return;
                    }
                    Promise.resolve(browserApi.tabs.query(queryInfo || {})).then((tabs: HexaWebTab[]) => {
                        for (const tab of tabs) {
                            this.emitTabMessage(tab.id!, message).catch((err) => {
                                console.error(`Error broadcasting to tab ${tab.id}:`, err);
                            });
                        }
                        resolve();
                    }).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.tabs) {
                        rejectUnsupportedApi(reject, 'TabsPort.broadcastMessage', this.platform, 'tabs');
                        return;
                    }
                    chromeApi.tabs.query(queryInfo || {}, (tabs: HexaWebTab[]) => {
                        const lastError = chromeApi.runtime.lastError;
                        if (lastError) {
                            reject(lastError);
                            return;
                        }
                        for (const tab of tabs) {
                            this.emitTabMessage(tab.id!, message).catch((err) => {
                                console.error(`Error broadcasting to tab ${tab.id}:`, err);
                            });
                        }
                        resolve();
                    });
                    return;
                }
            }
        });
    }
}

