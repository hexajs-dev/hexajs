import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class DeclarativeNetRequestPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    updateDynamicRules(options: HexaWebDNRUpdateDynamicRulesOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.declarativeNetRequest?.updateDynamicRules) {
                        reject(new Error('declarativeNetRequest.updateDynamicRules API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.declarativeNetRequest.updateDynamicRules(options)).then(() => resolve()).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.declarativeNetRequest?.updateDynamicRules) {
                        reject(new Error('declarativeNetRequest.updateDynamicRules API not available in this context'));
                        return;
                    }
                    Promise.resolve(chromeApi.declarativeNetRequest.updateDynamicRules(options)).then(() => resolve()).catch(reject);
                    return;
                }
            }
        });
    }

    getDynamicRules(): Promise<HexaWebDNRRule[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.declarativeNetRequest?.getDynamicRules) {
                        reject(new Error('declarativeNetRequest.getDynamicRules API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.declarativeNetRequest.getDynamicRules()).then((rules: HexaWebDNRRule[]) => resolve(rules || [])).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.declarativeNetRequest?.getDynamicRules) {
                        reject(new Error('declarativeNetRequest.getDynamicRules API not available in this context'));
                        return;
                    }
                    Promise.resolve(chromeApi.declarativeNetRequest.getDynamicRules()).then((rules: HexaWebDNRRule[]) => resolve(rules || [])).catch(reject);
                    return;
                }
            }
        });
    }
}
