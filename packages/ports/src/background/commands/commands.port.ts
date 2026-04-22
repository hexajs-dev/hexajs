import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs/common';
import { PlatformType } from '../../shared/platforms.methods';

@Injectable({ context: InjectableContext.Background })
export class CommandsPort {
    constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

    getAll(): Promise<HexaWebCommand[]> {
        return new Promise((resolve, reject) => {
            const api = (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Firefox
                || (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) === PlatformType.Safari
                ? (globalThis as any).browser
                : ((globalThis as any).chrome ?? (globalThis as any).browser);
            if (!api?.commands?.getAll) {
                reject(new Error('commands.getAll API not available in this context'));
                return;
            }
            Promise.resolve(api.commands.getAll()).then((commands: HexaWebCommand[]) => resolve(commands || [])).catch(reject);
        });
    }

    onCommandAddListener(listener: (command: string) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
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
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.commands?.onCommand?.addListener) {
                    throw new Error('commands.onCommand.addListener API not available in this context');
                }
                chromeApi.commands.onCommand.addListener(listener);
                return;
            }
        }
    }

    onCommandRemoveListener(listener: (command: string) => void): void {
        switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
            case PlatformType.Firefox:
            case PlatformType.Safari: {
                const browserApi = (globalThis as any).browser;
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
                const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
                if (!chromeApi?.commands?.onCommand?.removeListener) {
                    throw new Error('commands.onCommand.removeListener API not available in this context');
                }
                chromeApi.commands.onCommand.removeListener(listener);
                return;
            }
        }
    }
}
