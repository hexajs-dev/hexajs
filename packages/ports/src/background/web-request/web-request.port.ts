import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: HexaContext.Background })
export class WebRequestPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    onBeforeRequestAddListener(listener: (details: HexaWebWebRequestDetails) => any, filter: HexaWebWebRequestFilter, extraInfoSpec?: HexaWebWebRequestExtraInfoSpec[]): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.webRequest?.onBeforeRequest?.addListener) {
            throw new Error('webRequest.onBeforeRequest.addListener API not available in this context');
        }
        api.webRequest.onBeforeRequest.addListener(listener, filter, extraInfoSpec);
    }

    onBeforeRequestRemoveListener(listener: (details: HexaWebWebRequestDetails) => any): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.webRequest?.onBeforeRequest?.removeListener) {
            throw new Error('webRequest.onBeforeRequest.removeListener API not available in this context');
        }
        api.webRequest.onBeforeRequest.removeListener(listener);
    }

    onBeforeSendHeadersAddListener(listener: (details: HexaWebWebRequestDetails) => any, filter: HexaWebWebRequestFilter, extraInfoSpec?: HexaWebWebRequestExtraInfoSpec[]): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.webRequest?.onBeforeSendHeaders?.addListener) {
            throw new Error('webRequest.onBeforeSendHeaders.addListener API not available in this context');
        }
        api.webRequest.onBeforeSendHeaders.addListener(listener, filter, extraInfoSpec);
    }

    onBeforeSendHeadersRemoveListener(listener: (details: HexaWebWebRequestDetails) => any): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.webRequest?.onBeforeSendHeaders?.removeListener) {
            throw new Error('webRequest.onBeforeSendHeaders.removeListener API not available in this context');
        }
        api.webRequest.onBeforeSendHeaders.removeListener(listener);
    }

    onHeadersReceivedAddListener(listener: (details: HexaWebWebRequestDetails) => any, filter: HexaWebWebRequestFilter, extraInfoSpec?: HexaWebWebRequestExtraInfoSpec[]): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.webRequest?.onHeadersReceived?.addListener) {
            throw new Error('webRequest.onHeadersReceived.addListener API not available in this context');
        }
        api.webRequest.onHeadersReceived.addListener(listener, filter, extraInfoSpec);
    }

    onHeadersReceivedRemoveListener(listener: (details: HexaWebWebRequestDetails) => any): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.webRequest?.onHeadersReceived?.removeListener) {
            throw new Error('webRequest.onHeadersReceived.removeListener API not available in this context');
        }
        api.webRequest.onHeadersReceived.removeListener(listener);
    }

    onCompletedAddListener(listener: (details: HexaWebWebRequestDetails) => void, filter: HexaWebWebRequestFilter): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.webRequest?.onCompleted?.addListener) {
            throw new Error('webRequest.onCompleted.addListener API not available in this context');
        }
        api.webRequest.onCompleted.addListener(listener, filter);
    }

    onCompletedRemoveListener(listener: (details: HexaWebWebRequestDetails) => void): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.webRequest?.onCompleted?.removeListener) {
            throw new Error('webRequest.onCompleted.removeListener API not available in this context');
        }
        api.webRequest.onCompleted.removeListener(listener);
    }

    onErrorOccurredAddListener(listener: (details: HexaWebWebRequestDetails) => void, filter: HexaWebWebRequestFilter): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.webRequest?.onErrorOccurred?.addListener) {
            throw new Error('webRequest.onErrorOccurred.addListener API not available in this context');
        }
        api.webRequest.onErrorOccurred.addListener(listener, filter);
    }

    onErrorOccurredRemoveListener(listener: (details: HexaWebWebRequestDetails) => void): void {
        const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
            || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
            ? (globalThis as any).browser
            : ((globalThis as any).chrome ?? (globalThis as any).browser);
        if (!api?.webRequest?.onErrorOccurred?.removeListener) {
            throw new Error('webRequest.onErrorOccurred.removeListener API not available in this context');
        }
        api.webRequest.onErrorOccurred.removeListener(listener);
    }
}
