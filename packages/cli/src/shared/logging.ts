import chalk from 'chalk';
import { GeneratedArtifactRow } from '../build/types';

export function timestamp(): string {
    const now = new Date();
    return chalk.gray(`[${now.toTimeString().slice(0, 8)}]`);
}

export function printInfoLine(message: string): void {
    console.log(`${timestamp()} ${chalk.blue('i')} ${chalk.blue(message)}`);
}

export function printWarningLine(message: string): void {
    console.log(`${timestamp()} ${chalk.yellow('!')} ${chalk.yellow(message)}`);
}

function truncateValue(value: string, width: number): string {
    if (value.length <= width) {
        return value.padEnd(width);
    }
    if (width < 4) {
        return value.slice(0, width);
    }
    return `${value.slice(0, width - 3)}...`;
}

export function printGeneratedTable(rows: GeneratedArtifactRow[]): void {
    if (rows.length === 0) {
        return;
    }

    const fileHeader = 'Generated File';
    const sizeHeader = 'Size';
    const timeHeader = 'Write Time';

    const fileWidth = Math.max(fileHeader.length, ...rows.map(row => row.file.length), 28);
    const sizeWidth = Math.max(sizeHeader.length, ...rows.map(row => row.size.length), 8);
    const timeWidth = Math.max(timeHeader.length, ...rows.map(row => row.duration.length), 10);

    const top = `+${'-'.repeat(fileWidth + 2)}+${'-'.repeat(sizeWidth + 2)}+${'-'.repeat(timeWidth + 2)}+`;
    const header = `| ${truncateValue(fileHeader, fileWidth)} | ${truncateValue(sizeHeader, sizeWidth)} | ${truncateValue(timeHeader, timeWidth)} |`;
    const separator = `+${'-'.repeat(fileWidth + 2)}+${'-'.repeat(sizeWidth + 2)}+${'-'.repeat(timeWidth + 2)}+`;

    console.log(`${timestamp()} ${chalk.green('v')} ${chalk.green('Generated artifacts')}`);
    console.log(`${timestamp()} ${chalk.gray(top)}`);
    console.log(`${timestamp()} ${chalk.gray(header)}`);
    console.log(`${timestamp()} ${chalk.gray(separator)}`);
    for (const row of rows) {
        const line = `| ${truncateValue(row.file, fileWidth)} | ${truncateValue(row.size, sizeWidth)} | ${truncateValue(row.duration, timeWidth)} |`;
        console.log(`${timestamp()} ${chalk.green(line)}`);
    }
    console.log(`${timestamp()} ${chalk.gray(top)}`);
}
