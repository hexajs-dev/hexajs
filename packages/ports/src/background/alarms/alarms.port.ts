import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: HexaContext.Background })
export class AlarmsPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    create(name: string, alarmInfo?: HexaWebAlarmCreateInfo): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.alarms?.create) {
            throw new Error('alarms.create API not available in this context');
        }
        api.alarms.create(name, alarmInfo);
    }

    getAll(): Promise<HexaWebAlarm[]> {
        return new Promise((resolve, reject) => {
            const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
                || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
                ? (globalThis as any).browser
                : ((globalThis as any).chrome ?? (globalThis as any).browser);
            if (!api?.alarms?.getAll) {
                reject(new Error('alarms.getAll API not available in this context'));
                return;
            }
            Promise.resolve(api.alarms.getAll()).then((alarms: HexaWebAlarm[]) => resolve(alarms || [])).catch(reject);
        });
    }

    get(name: string): Promise<HexaWebAlarm | undefined> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.alarms?.get) {
                        reject(new Error('alarms.get API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.alarms.get(name)).then((alarm: HexaWebAlarm | undefined) => resolve(alarm)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.alarms?.get) {
                        reject(new Error('alarms.get API not available in this context'));
                        return;
                    }
                    chromeApi.alarms.get(name, (alarm: HexaWebAlarm | undefined) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(alarm);
                        }
                    });
                    return;
                }
            }
        });
    }

    clear(name?: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.alarms?.clear) {
                        reject(new Error('alarms.clear API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.alarms.clear(name)).then((wasCleared: boolean) => resolve(!!wasCleared)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.alarms?.clear) {
                        reject(new Error('alarms.clear API not available in this context'));
                        return;
                    }
                    chromeApi.alarms.clear(name, (wasCleared: boolean) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(!!wasCleared);
                        }
                    });
                    return;
                }
            }
        });
    }

    clearAll(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.alarms?.clearAll) {
                        reject(new Error('alarms.clearAll API not available in this context'));
                        return;
                    }
                    Promise.resolve(browserApi.alarms.clearAll()).then((wasCleared: boolean) => resolve(!!wasCleared)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.alarms?.clearAll) {
                        reject(new Error('alarms.clearAll API not available in this context'));
                        return;
                    }
                    chromeApi.alarms.clearAll((wasCleared: boolean) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(!!wasCleared);
                        }
                    });
                    return;
                }
            }
        });
    }

    onAlarmAddListener(listener: (alarm: HexaWebAlarm) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.alarms?.onAlarm?.addListener) {
                    throw new Error('alarms.onAlarm.addListener API not available in this context');
                }
                browserApi.alarms.onAlarm.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.alarms?.onAlarm?.addListener) {
                    throw new Error('alarms.onAlarm.addListener API not available in this context');
                }
                chromeApi.alarms.onAlarm.addListener(listener);
                return;
            }
        }
    }

    onAlarmRemoveListener(listener: (alarm: HexaWebAlarm) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.alarms?.onAlarm?.removeListener) {
                    throw new Error('alarms.onAlarm.removeListener API not available in this context');
                }
                browserApi.alarms.onAlarm.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.alarms?.onAlarm?.removeListener) {
                    throw new Error('alarms.onAlarm.removeListener API not available in this context');
                }
                chromeApi.alarms.onAlarm.removeListener(listener);
                return;
            }
        }
    }
}
