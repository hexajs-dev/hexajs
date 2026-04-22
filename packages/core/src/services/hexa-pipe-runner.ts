import { HexaPipeFn, HexaPipeInput, HexaPipeValidationError, HexaPipeValidationResult } from './hexa-client.base';

/**
 * @internal
 * Manages inbound/outbound validation pipe chains.
 * Used exclusively by framework containers and generated bootstrap — not intended for direct use.
 */
export class HexaPipeRunner {
    private inboundPipes: HexaPipeFn[] = [];
    private outboundPipes: HexaPipeFn[] = [];

    public usePipe(pipe: HexaPipeFn) {
        this.inboundPipes.push(pipe);
    }

    public useOutboundPipe(pipe: HexaPipeFn) {
        this.outboundPipes.push(pipe);
    }

    public async runInboundPipes(input: HexaPipeInput): Promise<unknown> {
        let currentPayload = input.payload;

        for (const pipe of this.inboundPipes) {
            const result = await pipe({
                ...input,
                payload: currentPayload,
            });

            if (HexaPipeRunner.isValidationResult(result) && result.valid === false) {
                throw new HexaPipeValidationError(result.error || 'Payload validation failed', result.code, result.details);
            }

            if (typeof result !== 'undefined' && !HexaPipeRunner.isValidationResult(result)) {
                currentPayload = result;
            }
        }

        return currentPayload;
    }

    public async runOutboundPipes(input: HexaPipeInput): Promise<unknown> {
        let currentPayload = input.payload;

        for (const pipe of this.outboundPipes) {
            const result = await pipe({
                ...input,
                payload: currentPayload,
            });

            if (HexaPipeRunner.isValidationResult(result) && result.valid === false) {
                throw new HexaPipeValidationError(result.error || 'Payload validation failed', result.code, result.details);
            }

            if (typeof result !== 'undefined' && !HexaPipeRunner.isValidationResult(result)) {
                currentPayload = result;
            }
        }

        return currentPayload;
    }

    private static isValidationResult(value: unknown): value is HexaPipeValidationResult {
        return !!value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'valid');
    }
}
