import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class WebNavigationPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    onCompletedAddListener(listener: (details: HexaWebWebNavigationOnCompletedDetails) => void, filter?: HexaWebWebNavigationEventFilter): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.webNavigation?.onCompleted?.addListener) {
                    throw new Error('webNavigation.onCompleted.addListener API not available in this context');
                }
                browserApi.webNavigation.onCompleted.addListener(listener, filter);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.webNavigation?.onCompleted?.addListener) {
                    throw new Error('webNavigation.onCompleted.addListener API not available in this context');
                }
                chromeApi.webNavigation.onCompleted.addListener(listener, filter);
                return;
            }
        }
    }

    onCompletedRemoveListener(listener: (details: HexaWebWebNavigationOnCompletedDetails) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.webNavigation?.onCompleted?.removeListener) {
                    throw new Error('webNavigation.onCompleted.removeListener API not available in this context');
                }
                browserApi.webNavigation.onCompleted.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.webNavigation?.onCompleted?.removeListener) {
                    throw new Error('webNavigation.onCompleted.removeListener API not available in this context');
                }
                chromeApi.webNavigation.onCompleted.removeListener(listener);
                return;
            }
        }
    }

    onCommittedAddListener(listener: (details: any) => void, filter?: HexaWebWebNavigationEventFilter): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.webNavigation?.onCommitted?.addListener) {
                    throw new Error('webNavigation.onCommitted.addListener API not available in this context');
                }
                browserApi.webNavigation.onCommitted.addListener(listener, filter);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.webNavigation?.onCommitted?.addListener) {
                    throw new Error('webNavigation.onCommitted.addListener API not available in this context');
                }
                chromeApi.webNavigation.onCommitted.addListener(listener, filter);
                return;
            }
        }
    }

    onCommittedRemoveListener(listener: (details: any) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.webNavigation?.onCommitted?.removeListener) {
                    throw new Error('webNavigation.onCommitted.removeListener API not available in this context');
                }
                browserApi.webNavigation.onCommitted.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.webNavigation?.onCommitted?.removeListener) {
                    throw new Error('webNavigation.onCommitted.removeListener API not available in this context');
                }
                chromeApi.webNavigation.onCommitted.removeListener(listener);
                return;
            }
        }
    }

    onBeforeNavigateAddListener(listener: (details: any) => void, filter?: HexaWebWebNavigationEventFilter): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.webNavigation?.onBeforeNavigate?.addListener) {
                    throw new Error('webNavigation.onBeforeNavigate.addListener API not available in this context');
                }
                browserApi.webNavigation.onBeforeNavigate.addListener(listener, filter);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.webNavigation?.onBeforeNavigate?.addListener) {
                    throw new Error('webNavigation.onBeforeNavigate.addListener API not available in this context');
                }
                chromeApi.webNavigation.onBeforeNavigate.addListener(listener, filter);
                return;
            }
        }
    }

    onBeforeNavigateRemoveListener(listener: (details: any) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.webNavigation?.onBeforeNavigate?.removeListener) {
                    throw new Error('webNavigation.onBeforeNavigate.removeListener API not available in this context');
                }
                browserApi.webNavigation.onBeforeNavigate.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.webNavigation?.onBeforeNavigate?.removeListener) {
                    throw new Error('webNavigation.onBeforeNavigate.removeListener API not available in this context');
                }
                chromeApi.webNavigation.onBeforeNavigate.removeListener(listener);
                return;
            }
        }
    }
}
