import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Empty })
export class I18nPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    getMessage(messageName: string, substitutions?: string | string[]): string {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.i18n?.getMessage) {
                    throw new Error('i18n.getMessage API not available in this context');
                }
                return browserApi.i18n.getMessage(messageName, substitutions);
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.i18n?.getMessage) {
                    throw new Error('i18n.getMessage API not available in this context');
                }
                return chromeApi.i18n.getMessage(messageName, substitutions);
            }
        }
    }

    getUILanguage(): string {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.i18n?.getUILanguage) {
                    throw new Error('i18n.getUILanguage API not available in this context');
                }
                return browserApi.i18n.getUILanguage();
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.i18n?.getUILanguage) {
                    throw new Error('i18n.getUILanguage API not available in this context');
                }
                return chromeApi.i18n.getUILanguage();
            }
        }
    }

    getAcceptLanguages(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.i18n?.getAcceptLanguages) {
                        reject(new Error('i18n.getAcceptLanguages API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.i18n.getAcceptLanguages()).then((languages: string[]) => resolve(languages)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.i18n?.getAcceptLanguages) {
                        reject(new Error('i18n.getAcceptLanguages API not available in this context'));
                        return;
                    }
                    chromeApi.i18n.getAcceptLanguages((languages: string[]) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(languages || []);
                        }
                    });
                    return;
                }
            }
        });
    }
}
