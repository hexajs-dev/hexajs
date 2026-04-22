import type { ScaffoldContext } from '../models/scaffold.types';

export const loggerServiceTemplate = (ctx: ScaffoldContext): string => `\
import { Injectable } from '@hexajs/common';

/**
 * Logger service that wraps the native console methods,
 * prefixing every message with the project name for easy filtering.
 */
@Injectable()
export class LoggerService {
  private readonly prefix = \`[${ctx.name}]\`;

  log(...args: unknown[]): void {
    console.log(this.prefix, ...args);
  }

  warn(...args: unknown[]): void {
    console.warn(this.prefix, ...args);
  }

  error(...args: unknown[]): void {
    console.error(this.prefix, ...args);
  }

  debug(...args: unknown[]): void {
    console.debug(this.prefix, ...args);
  }
}
`;
