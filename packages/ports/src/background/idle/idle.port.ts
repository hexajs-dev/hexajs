import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class IdlePort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    queryState(detectionIntervalInSeconds: number): Promise<HexaWebIdleState> {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.idle?.queryState) {
            return Promise.reject(new Error('idle.queryState API not available in this context'));
        }
        return Promise.resolve(api.idle.queryState(detectionIntervalInSeconds));
    }

    setDetectionInterval(intervalInSeconds: number): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.idle?.setDetectionInterval) {
                    throw new Error('idle.setDetectionInterval API not available in this context');
                }
                browserApi.idle.setDetectionInterval(intervalInSeconds);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.idle?.setDetectionInterval) {
                    throw new Error('idle.setDetectionInterval API not available in this context');
                }
                chromeApi.idle.setDetectionInterval(intervalInSeconds);
                return;
            }
        }
    }

    onStateChangedAddListener(listener: (newState: HexaWebIdleState) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.idle?.onStateChanged?.addListener) {
                    throw new Error('idle.onStateChanged.addListener API not available in this context');
                }
                browserApi.idle.onStateChanged.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.idle?.onStateChanged?.addListener) {
                    throw new Error('idle.onStateChanged.addListener API not available in this context');
                }
                chromeApi.idle.onStateChanged.addListener(listener);
                return;
            }
        }
    }

    onStateChangedRemoveListener(listener: (newState: HexaWebIdleState) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
                if (!browserApi?.idle?.onStateChanged?.removeListener) {
                    throw new Error('idle.onStateChanged.removeListener API not available in this context');
                }
                browserApi.idle.onStateChanged.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.idle?.onStateChanged?.removeListener) {
                    throw new Error('idle.onStateChanged.removeListener API not available in this context');
                }
                chromeApi.idle.onStateChanged.removeListener(listener);
                return;
            }
        }
    }
}
