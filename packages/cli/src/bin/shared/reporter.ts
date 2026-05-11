import chalk from 'chalk';
import { BRAND_COLOR } from './brand';
import { timestamp } from '../../shared/logging';

// ─── ASCII Art ────────────────────────────────────────────────────────────────

const HEXA_ASCII = `
██╗  ██╗███████╗██╗  ██╗ █████╗      ██╗███████╗
██║  ██║██╔════╝╚██╗██╔╝██╔══██╗     ██║██╔════╝
███████║█████╗   ╚███╔╝ ███████║     ██║███████╗
██╔══██║██╔══╝   ██╔██╗ ██╔══██║██   ██║╚════██║
██║  ██║███████╗██╔╝ ██╗██║  ██║╚█████╔╝███████║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚════╝ ╚══════╝`;

function separator(): void {
    console.log(chalk.gray('─'.repeat(60)));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function printHeader(version: string, projectName: string, platform: string, mode?: string): void {
    console.log(chalk.hex(BRAND_COLOR)(HEXA_ASCII));
    console.log();
    console.log(`${timestamp()} ${chalk.white('○')} ${chalk.bold.hex(BRAND_COLOR)(`HexaJS Build Engine ${version}`)}`);
    console.log(`${timestamp()} ${'🧱'} Project: ${chalk.bold.white(projectName)}`);
    console.log(`${timestamp()} ${'⚡'} Platform: ${chalk.bold.white(platform)}`);
    if (mode) {
        console.log(`${timestamp()} ${'🔧'} Mode: ${chalk.bold.white(mode)}`);
    }
    separator();
    console.log();
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Starts a build step with an animated spinner. Returns a `done()` function to call when the step finishes.
 * Optionally pass a detail string (shown as └ sub-line).
 *
 * @example
 * const done = startStep('Compiling TypeScript');
 * await compile();
 * done('Compiled 156 files');
 */
export function startStep(label: string): (detail?: string) => void {
    const start = Date.now();
    let frameIndex = 0;

    const isTTY = process.stdout.isTTY;

    if (isTTY) {
        // Animated spinner — rewrite the line on each tick
        const render = () => {
            const frame = chalk.cyan(SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length]);
            process.stdout.write(`\r${timestamp()} ${frame} ${chalk.cyan(label + '...')}`);
            frameIndex++;
        };
        render();
        const timer = setInterval(render, 80);

        return (detail?: string) => {
            clearInterval(timer);
            const ms = Date.now() - start;
            const duration = chalk.gray(`(${ms}ms)`);
            const paddedLabel = chalk.green(label).padEnd(70);
            // Clear the spinner line, then print the final status
            process.stdout.write(`\r\x1b[K`);
            console.log(`${timestamp()} ${chalk.green('✓')} ${paddedLabel} ${duration}`);
            if (detail) {
                console.log(`${timestamp()} ${chalk.gray('└')} ${chalk.gray(detail)}`);
            }
        };
    } else {
        // Non-TTY (CI, piped output) — fall back to a plain static line
        console.log(`${timestamp()} ${chalk.cyan('▶')} ${chalk.cyan(label + '...')}`);

        return (detail?: string) => {
            const ms = Date.now() - start;
            const duration = chalk.gray(`(${ms}ms)`);
            const paddedLabel = chalk.green(label).padEnd(70);
            console.log(`${timestamp()} ${chalk.green('✓')} ${paddedLabel} ${duration}`);
            if (detail) {
                console.log(`${timestamp()} ${chalk.gray('└')} ${chalk.gray(detail)}`);
            }
        };
    }
}

export function printInfo(icon: string, label: string, value: string): void {
    console.log(`${timestamp()} ${icon} ${chalk.gray(label + ':')} ${chalk.bold.white(value)}`);
}

export function printSuccess(totalMs: number, outDir: string): void {
    console.log();
    separator();
    console.log(`${timestamp()} ${chalk.green('○')} ${chalk.bold.green('Build completed successfully!')}`);
    console.log(`${timestamp()} ${'🏁'} ${chalk.gray('Total time:')} ${chalk.bold.white(totalMs + 'ms')}`);
    console.log(`${timestamp()} ${'📁'} ${chalk.gray('Output:')} ${chalk.bold.white(outDir)}`);
    console.log();
}

export function printError(message: string): void {
    console.log();
    separator();
    console.log(`${timestamp()} ${chalk.red('✖')} ${chalk.bold.red('Build failed!')}`);
    console.log(`${timestamp()} ${chalk.gray('└')} ${chalk.red(message)}`);
    console.log();
}
