import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: HexaContext.Background })
export class CommandsPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    private resolvePlatform(): string | undefined {
        return typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform;
    }

    private resolveBrowserFirstCommandsApi(): any {
        const browserApi = (globalThis as any).browser;
        const chromeApi = (globalThis as any).chrome;

        if (browserApi?.commands) {
            return browserApi;
        }
        if (chromeApi?.commands) {
            return chromeApi;
        }

        return browserApi ?? chromeApi;
    }

    private resolveChromeFirstCommandsApi(): any {
        const browserApi = (globalThis as any).browser;
        const chromeApi = (globalThis as any).chrome;

        if (chromeApi?.commands) {
            return chromeApi;
        }
        if (browserApi?.commands) {
            return browserApi;
        }

        return chromeApi ?? browserApi;
    }

    getAll(): Promise<HexaWebCommand[]> {
        return new Promise((resolve, reject) => {
            const platform = this.resolvePlatform();
            const api = platform === PlatformType.Firefox || platform === PlatformType.Safari
                ? this.resolveBrowserFirstCommandsApi()
                : this.resolveChromeFirstCommandsApi();
            const getAll = api?.commands?.getAll;
            if (typeof getAll !== 'function') {
                reject(new Error('commands.getAll API not available in this context'));
                return;
            }

            let settled = false;
            const resolveOnce = (commands?: HexaWebCommand[]): void => {
                if (settled) {
                    return;
                }
                settled = true;
                resolve(commands || []);
            };
            const rejectOnce = (error: unknown): void => {
                if (settled) {
                    return;
                }
                settled = true;
                reject(error);
            };

            try {
                const maybePromise = getAll.call(api.commands, (commands: HexaWebCommand[]) => {
                    resolveOnce(commands);
                });

                if (maybePromise && typeof maybePromise.then === 'function') {
                    Promise.resolve(maybePromise).then((commands: HexaWebCommand[]) => resolveOnce(commands)).catch(rejectOnce);
                    return;
                }

                if (getAll.length === 0) {
                    resolveOnce(maybePromise as HexaWebCommand[] | undefined);
                }
            } catch (error) {
                rejectOnce(error);
            }
        });
    }

    onCommandAddListener(listener: (command: string) => void): void {
        switch (this.resolvePlatform()) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = this.resolveBrowserFirstCommandsApi();
                if (!browserApi?.commands?.onCommand?.addListener) {
                    throw new Error('commands.onCommand.addListener API not available in this context');
                }
                browserApi.commands.onCommand.addListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = this.resolveChromeFirstCommandsApi();
                if (!chromeApi?.commands?.onCommand?.addListener) {
                    throw new Error('commands.onCommand.addListener API not available in this context');
                }
                chromeApi.commands.onCommand.addListener(listener);
                return;
            }
        }
    }

    onCommandRemoveListener(listener: (command: string) => void): void {
        switch (this.resolvePlatform()) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = this.resolveBrowserFirstCommandsApi();
                if (!browserApi?.commands?.onCommand?.removeListener) {
                    throw new Error('commands.onCommand.removeListener API not available in this context');
                }
                browserApi.commands.onCommand.removeListener(listener);
                return;
            }
            case PlatformType.Chrome:
            case PlatformType.Edge:
            case PlatformType.Opera:
            case PlatformType.Brave:
            default: {
                const chromeApi = this.resolveChromeFirstCommandsApi();
                if (!chromeApi?.commands?.onCommand?.removeListener) {
                    throw new Error('commands.onCommand.removeListener API not available in this context');
                }
                chromeApi.commands.onCommand.removeListener(listener);
                return;
            }
        }
    }
}
