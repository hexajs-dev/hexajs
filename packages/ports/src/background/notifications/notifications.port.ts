import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs/common';
import { PlatformType } from '../../shared/platforms.methods';
import { rejectUnsupportedApi, throwUnsupportedApi } from '../../shared/methods/port-errors.methods';

@Injectable({ context: InjectableContext.Background })
export class NotificationsPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    create(options: HexaWebNotificationOptions): Promise<string>;
    create(notificationId: string, options: HexaWebNotificationOptions): Promise<string>;
    create(notificationIdOrOptions: string | HexaWebNotificationOptions, optionsMaybe?: HexaWebNotificationOptions): Promise<string> {
        const notificationId = typeof notificationIdOrOptions === 'string' ? notificationIdOrOptions : undefined;
        const options = typeof notificationIdOrOptions === 'string' ? optionsMaybe : notificationIdOrOptions;
        if (!options) {
            return Promise.reject(new Error('notifications.create options are required'));
        }
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.notifications?.create) {
                        rejectUnsupportedApi(reject, 'NotificationsPort.create', this.platform, 'notifications.create');
                        return;
                    }
                    Promise.resolve(notificationId ? browserApi.notifications.create(notificationId, options) : browserApi.notifications.create(options)).then((id: string) => resolve(id)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.notifications?.create) {
                        rejectUnsupportedApi(reject, 'NotificationsPort.create', this.platform, 'notifications.create');
                        return;
                    }
                    const callback = (id: string) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(id);
                        }
                    };
                    if (notificationId) {
                        chromeApi.notifications.create(notificationId, options, callback);
                    } else {
                        chromeApi.notifications.create(options, callback);
                    }
                    return;
                }
            }
        });
    }

    clear(notificationId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.notifications?.clear) {
                        rejectUnsupportedApi(reject, 'NotificationsPort.clear', this.platform, 'notifications.clear');
                        return;
                    }
                    Promise.resolve(browserApi.notifications.clear(notificationId)).then((wasCleared: boolean) => resolve(!!wasCleared)).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.notifications?.clear) {
                        rejectUnsupportedApi(reject, 'NotificationsPort.clear', this.platform, 'notifications.clear');
                        return;
                    }
                    chromeApi.notifications.clear(notificationId, (wasCleared: boolean) => {
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

    getAll(): Promise<{ [notificationId: string]: boolean }> {
        return new Promise((resolve, reject) => {
            switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
                case PlatformType.Firefox:
                case PlatformType.Safari: {
                    const browserApi = (globalThis as any).browser;
                    if (!browserApi?.notifications?.getAll) {
                        rejectUnsupportedApi(reject, 'NotificationsPort.getAll', this.platform, 'notifications.getAll');
                        return;
                    }
                    Promise.resolve(browserApi.notifications.getAll()).then((all: { [notificationId: string]: boolean }) => resolve(all || {})).catch(reject);
                    return;
                }
                case PlatformType.Chrome:
                case PlatformType.Edge:
                case PlatformType.Opera:
                case PlatformType.Brave:
                default: {
                    const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                    if (!chromeApi?.notifications?.getAll) {
                        rejectUnsupportedApi(reject, 'NotificationsPort.getAll', this.platform, 'notifications.getAll');
                        return;
                    }
                    chromeApi.notifications.getAll((all: { [notificationId: string]: boolean }) => {
                        const lastError = chromeApi.runtime?.lastError;
                        if (lastError) {
                            reject(lastError);
                        } else {
                            resolve(all || {});
                        }
                    });
                    return;
                }
            }
        });
    }

    onClickedAddListener(listener: (notificationId: string) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.notifications?.onClicked?.addListener) {
                    throwUnsupportedApi('NotificationsPort.onClickedAddListener', this.platform, 'notifications.onClicked.addListener');
                }
                browserApi.notifications.onClicked.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.notifications?.onClicked?.addListener) {
                    throwUnsupportedApi('NotificationsPort.onClickedAddListener', this.platform, 'notifications.onClicked.addListener');
                }
                chromeApi.notifications.onClicked.addListener(listener);
                return;
            }
        }
    }

    onClickedRemoveListener(listener: (notificationId: string) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.notifications?.onClicked?.removeListener) {
                    throwUnsupportedApi('NotificationsPort.onClickedRemoveListener', this.platform, 'notifications.onClicked.removeListener');
                }
                browserApi.notifications.onClicked.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.notifications?.onClicked?.removeListener) {
                    throwUnsupportedApi('NotificationsPort.onClickedRemoveListener', this.platform, 'notifications.onClicked.removeListener');
                }
                chromeApi.notifications.onClicked.removeListener(listener);
                return;
            }
        }
    }

    onClosedAddListener(listener: (notificationId: string, byUser: boolean) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.notifications?.onClosed?.addListener) {
                    throwUnsupportedApi('NotificationsPort.onClosedAddListener', this.platform, 'notifications.onClosed.addListener');
                }
                browserApi.notifications.onClosed.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.notifications?.onClosed?.addListener) {
                    throwUnsupportedApi('NotificationsPort.onClosedAddListener', this.platform, 'notifications.onClosed.addListener');
                }
                chromeApi.notifications.onClosed.addListener(listener);
                return;
            }
        }
    }

    onClosedRemoveListener(listener: (notificationId: string, byUser: boolean) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.notifications?.onClosed?.removeListener) {
                    throwUnsupportedApi('NotificationsPort.onClosedRemoveListener', this.platform, 'notifications.onClosed.removeListener');
                }
                browserApi.notifications.onClosed.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.notifications?.onClosed?.removeListener) {
                    throwUnsupportedApi('NotificationsPort.onClosedRemoveListener', this.platform, 'notifications.onClosed.removeListener');
                }
                chromeApi.notifications.onClosed.removeListener(listener);
                return;
            }
        }
    }

    onButtonClickedAddListener(listener: (notificationId: string, buttonIndex: number) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.notifications?.onButtonClicked?.addListener) {
                    throwUnsupportedApi('NotificationsPort.onButtonClickedAddListener', this.platform, 'notifications.onButtonClicked.addListener');
                }
                browserApi.notifications.onButtonClicked.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.notifications?.onButtonClicked?.addListener) {
                    throwUnsupportedApi('NotificationsPort.onButtonClickedAddListener', this.platform, 'notifications.onButtonClicked.addListener');
                }
                chromeApi.notifications.onButtonClicked.addListener(listener);
                return;
            }
        }
    }

    onButtonClickedRemoveListener(listener: (notificationId: string, buttonIndex: number) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.notifications?.onButtonClicked?.removeListener) {
                    throwUnsupportedApi('NotificationsPort.onButtonClickedRemoveListener', this.platform, 'notifications.onButtonClicked.removeListener');
                }
                browserApi.notifications.onButtonClicked.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.notifications?.onButtonClicked?.removeListener) {
                    throwUnsupportedApi('NotificationsPort.onButtonClickedRemoveListener', this.platform, 'notifications.onButtonClicked.removeListener');
                }
                chromeApi.notifications.onButtonClicked.removeListener(listener);
                return;
            }
        }
    }
}
