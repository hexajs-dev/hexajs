import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: HexaContext.UI })
export class DevtoolsPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    readonly panels = {
        create: (title: string, icon: string, page: string): Promise<HexaWebExtensionPanel> => {
            return new Promise((resolve, reject) => {
                switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                    case PlatformType.Firefox:
                    case PlatformType.Safari: {
                        const browserApi = (globalThis as any).browser;
                        if (!browserApi?.devtools?.panels) {
                            reject(new Error('devtools.panels API not available in this context'));
                            return;
                        }
                        Promise.resolve(browserApi.devtools.panels.create(title, icon, page)).then((panel: HexaWebExtensionPanel) => resolve(panel)).catch(reject);
                        return;
                    }
                    case PlatformType.Chrome:
                    case PlatformType.Edge:
                    case PlatformType.Opera:
                    case PlatformType.Brave:
                    default: {
                        const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                        if (!chromeApi?.devtools?.panels) {
                            reject(new Error('devtools.panels API not available in this context'));
                            return;
                        }
                        chromeApi.devtools.panels.create(title, icon, page, (panel: HexaWebExtensionPanel) => {
                            const lastError = chromeApi.runtime?.lastError;
                            if (lastError) { reject(lastError); return; }
                            resolve(panel);
                        });
                        return;
                    }
                }
            });
        },
        openResource: (url: string, lineNumber: number): Promise<void> => {
            return new Promise((resolve, reject) => {
                switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                    case PlatformType.Firefox:
                    case PlatformType.Safari: {
                        const browserApi = (globalThis as any).browser;
                        if (!browserApi?.devtools?.panels) {
                            reject(new Error('devtools.panels API not available in this context'));
                            return;
                        }
                        Promise.resolve(browserApi.devtools.panels.openResource(url, lineNumber)).then(() => resolve()).catch(reject);
                        return;
                    }
                    case PlatformType.Chrome:
                    case PlatformType.Edge:
                    case PlatformType.Opera:
                    case PlatformType.Brave:
                    default: {
                        const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                        if (!chromeApi?.devtools?.panels) {
                            reject(new Error('devtools.panels API not available in this context'));
                            return;
                        }
                        chromeApi.devtools.panels.openResource(url, lineNumber, () => {
                            const lastError = chromeApi.runtime?.lastError;
                            if (lastError) { reject(lastError); return; }
                            resolve();
                        });
                        return;
                    }
                }
            });
        },
        getThemeName: (): 'default' | 'dark' => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.devtools?.panels) {
                        throw new Error('devtools.panels API not available in this context');
                    }
                    return browserApi.devtools.panels.themeName;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.devtools?.panels) {
                        throw new Error('devtools.panels API not available in this context');
                    }
                    return chromeApi.devtools.panels.themeName;
                }
            }
        },
        elements: {
            createSidebarPane: (title: string): Promise<HexaWebExtensionSidebarPane> => {
                return new Promise((resolve, reject) => {
                    switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                        case PlatformType.Firefox:
                        case PlatformType.Safari: {
                            const browserApi = (globalThis as any).browser;
                            if (!browserApi?.devtools?.panels?.elements) {
                                reject(new Error('devtools.panels.elements API not available in this context'));
                                return;
                            }
                            Promise.resolve(browserApi.devtools.panels.elements.createSidebarPane(title)).then((pane: HexaWebExtensionSidebarPane) => resolve(pane)).catch(reject);
                            return;
                        }
                        case PlatformType.Chrome:
                        case PlatformType.Edge:
                        case PlatformType.Opera:
                        case PlatformType.Brave:
                        default: {
                            const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                            if (!chromeApi?.devtools?.panels?.elements) {
                                reject(new Error('devtools.panels.elements API not available in this context'));
                                return;
                            }
                            chromeApi.devtools.panels.elements.createSidebarPane(title, (pane: HexaWebExtensionSidebarPane) => {
                                const lastError = chromeApi.runtime?.lastError;
                                if (lastError) { reject(lastError); return; }
                                resolve(pane);
                            });
                            return;
                        }
                    }
                });
            },
            onSelectionChanged: (callback: () => void): void => {
                switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                    case PlatformType.Firefox:
                    case PlatformType.Safari: {
                        const browserApi = (globalThis as any).browser;
                        if (!browserApi?.devtools?.panels?.elements) {
                            throw new Error('devtools.panels.elements API not available in this context');
                        }
                        browserApi.devtools.panels.elements.onSelectionChanged.addListener(callback);
                        return;
                    }
                    case PlatformType.Chrome:
                    case PlatformType.Edge:
                    case PlatformType.Opera:
                    case PlatformType.Brave:
                    default: {
                        const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                        if (!chromeApi?.devtools?.panels?.elements) {
                            throw new Error('devtools.panels.elements API not available in this context');
                        }
                        chromeApi.devtools.panels.elements.onSelectionChanged.addListener(callback);
                        return;
                    }
                }
            },
        },
    };

    readonly inspectedWindow = {
        get tabId(): number {
            return (globalThis as any).chrome?.devtools?.inspectedWindow?.tabId
                ?? (globalThis as any).browser?.devtools?.inspectedWindow?.tabId
                ?? -1;
        },
        eval: (expression: string, options?: HexaWebDevtoolsEvalOptions): Promise<any> => {
            return new Promise((resolve, reject) => {
                switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                    case PlatformType.Firefox:
                    case PlatformType.Safari: {
                        const browserApi = (globalThis as any).browser;
                        if (!browserApi?.devtools?.inspectedWindow) {
                            reject(new Error('devtools.inspectedWindow API not available in this context'));
                            return;
                        }
                        Promise.resolve(browserApi.devtools.inspectedWindow.eval(expression, options)).then(resolve).catch(reject);
                        return;
                    }
                    case PlatformType.Chrome:
                    case PlatformType.Edge:
                    case PlatformType.Opera:
                    case PlatformType.Brave:
                    default: {
                        const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                        if (!chromeApi?.devtools?.inspectedWindow) {
                            reject(new Error('devtools.inspectedWindow API not available in this context'));
                            return;
                        }
                        chromeApi.devtools.inspectedWindow.eval(expression, options, (result: any, exceptionInfo: any) => {
                            if (exceptionInfo?.isException) {
                                reject(new Error(exceptionInfo.description ?? exceptionInfo.value ?? 'Eval exception'));
                            } else {
                                resolve(result);
                            }
                        });
                        return;
                    }
                }
            });
        },
        reload: (options?: HexaWebDevtoolsReloadOptions): void => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.devtools?.inspectedWindow) {
                        throw new Error('devtools.inspectedWindow API not available in this context');
                    }
                    browserApi.devtools.inspectedWindow.reload(options);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.devtools?.inspectedWindow) {
                        throw new Error('devtools.inspectedWindow API not available in this context');
                    }
                    chromeApi.devtools.inspectedWindow.reload(options);
                    return;
                }
            }
        },
        getResources: (): Promise<HexaWebResource[]> => {
            return new Promise((resolve, reject) => {
                switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                    case PlatformType.Firefox:
                    case PlatformType.Safari: {
                        const browserApi = (globalThis as any).browser;
                        if (!browserApi?.devtools?.inspectedWindow) {
                            reject(new Error('devtools.inspectedWindow API not available in this context'));
                            return;
                        }
                        Promise.resolve(browserApi.devtools.inspectedWindow.getResources()).then((resources: HexaWebResource[]) => resolve(resources)).catch(reject);
                        return;
                    }
                    case PlatformType.Chrome:
                    case PlatformType.Edge:
                    case PlatformType.Opera:
                    case PlatformType.Brave:
                    default: {
                        const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                        if (!chromeApi?.devtools?.inspectedWindow) {
                            reject(new Error('devtools.inspectedWindow API not available in this context'));
                            return;
                        }
                        chromeApi.devtools.inspectedWindow.getResources((resources: HexaWebResource[]) => {
                            const lastError = chromeApi.runtime?.lastError;
                            if (lastError) { reject(lastError); return; }
                            resolve(resources);
                        });
                        return;
                    }
                }
            });
        },
        onResourceAdded: (callback: (resource: HexaWebResource) => void): void => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.devtools?.inspectedWindow) {
                        throw new Error('devtools.inspectedWindow API not available in this context');
                    }
                    browserApi.devtools.inspectedWindow.onResourceAdded.addListener(callback);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.devtools?.inspectedWindow) {
                        throw new Error('devtools.inspectedWindow API not available in this context');
                    }
                    chromeApi.devtools.inspectedWindow.onResourceAdded.addListener(callback);
                    return;
                }
            }
        },
        onResourceContentCommitted: (callback: (resource: HexaWebResource, content: string) => void): void => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.devtools?.inspectedWindow) {
                        throw new Error('devtools.inspectedWindow API not available in this context');
                    }
                    browserApi.devtools.inspectedWindow.onResourceContentCommitted.addListener(callback);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.devtools?.inspectedWindow) {
                        throw new Error('devtools.inspectedWindow API not available in this context');
                    }
                    chromeApi.devtools.inspectedWindow.onResourceContentCommitted.addListener(callback);
                    return;
                }
            }
        },
    };

    readonly network = {
        getHAR: (): Promise<HexaWebHARLog> => {
            return new Promise((resolve, reject) => {
                switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                    case PlatformType.Firefox:
                    case PlatformType.Safari: {
                        const browserApi = (globalThis as any).browser;
                        if (!browserApi?.devtools?.network) {
                            reject(new Error('devtools.network API not available in this context'));
                            return;
                        }
                        Promise.resolve(browserApi.devtools.network.getHAR()).then((harLog: HexaWebHARLog) => resolve(harLog)).catch(reject);
                        return;
                    }
                    case PlatformType.Chrome:
                    case PlatformType.Edge:
                    case PlatformType.Opera:
                    case PlatformType.Brave:
                    default: {
                        const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                        if (!chromeApi?.devtools?.network) {
                            reject(new Error('devtools.network API not available in this context'));
                            return;
                        }
                        chromeApi.devtools.network.getHAR((harLog: HexaWebHARLog) => {
                            const lastError = chromeApi.runtime?.lastError;
                            if (lastError) { reject(lastError); return; }
                            resolve(harLog);
                        });
                        return;
                    }
                }
            });
        },
        onRequestFinished: (callback: (request: HexaWebHAREntry) => void): void => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.devtools?.network) {
                        throw new Error('devtools.network API not available in this context');
                    }
                    browserApi.devtools.network.onRequestFinished.addListener(callback);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.devtools?.network) {
                        throw new Error('devtools.network API not available in this context');
                    }
                    chromeApi.devtools.network.onRequestFinished.addListener(callback);
                    return;
                }
            }
        },
        offRequestFinished: (callback: (request: HexaWebHAREntry) => void): void => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.devtools?.network) {
                        throw new Error('devtools.network API not available in this context');
                    }
                    browserApi.devtools.network.onRequestFinished.removeListener(callback);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.devtools?.network) {
                        throw new Error('devtools.network API not available in this context');
                    }
                    chromeApi.devtools.network.onRequestFinished.removeListener(callback);
                    return;
                }
            }
        },
        onNavigated: (callback: (url: string) => void): void => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.devtools?.network) {
                        throw new Error('devtools.network API not available in this context');
                    }
                    browserApi.devtools.network.onNavigated.addListener(callback);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.devtools?.network) {
                        throw new Error('devtools.network API not available in this context');
                    }
                    chromeApi.devtools.network.onNavigated.addListener(callback);
                    return;
                }
            }
        },
        offNavigated: (callback: (url: string) => void): void => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.devtools?.network) {
                        throw new Error('devtools.network API not available in this context');
                    }
                    browserApi.devtools.network.onNavigated.removeListener(callback);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.devtools?.network) {
                        throw new Error('devtools.network API not available in this context');
                    }
                    chromeApi.devtools.network.onNavigated.removeListener(callback);
                    return;
                }
            }
        },
    };
}

