import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs-dev/common';
import { PlatformType } from '../../shared/platforms.methods';
import { throwUnsupportedApi } from '../../shared/methods/port-errors.methods';

export interface ScriptingExecuteOptions {
  target: {
    tabId: number;
    allFrames?: boolean;
  };
  files: string[];
}

@Injectable({ context: InjectableContext.Background })
export class ScriptingPort {
  constructor(@Inject(HEXA_PLATFORM) readonly platform?: string) {}

  async executeScript(options: ScriptingExecuteOptions): Promise<void> {
    switch (typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : this.platform) {
      case PlatformType.Firefox:
      case PlatformType.Safari: {
        const browserApi = (globalThis as any).browser;
        if (!browserApi?.scripting?.executeScript) {
          throwUnsupportedApi('ScriptingPort.executeScript', this.platform, 'scripting.executeScript');
        }
        await browserApi.scripting.executeScript({
          target: {
            tabId: options.target.tabId,
            allFrames: options.target.allFrames ?? false,
          },
          files: options.files,
        });
        return;
      }
      case PlatformType.Chrome:
      case PlatformType.Edge:
      case PlatformType.Opera:
      case PlatformType.Brave:
      default: {
        const chromeApi = (globalThis as any).chrome ?? (globalThis as any).browser;
        if (!chromeApi?.scripting?.executeScript) {
          throwUnsupportedApi('ScriptingPort.executeScript', this.platform, 'scripting.executeScript');
        }
        await chromeApi.scripting.executeScript({
          target: {
            tabId: options.target.tabId,
            allFrames: options.target.allFrames ?? false,
          },
          files: options.files,
        });
        return;
      }
    }
  }
}
