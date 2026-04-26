import { spawnSync } from 'child_process';
import * as path from 'path';
import type { HexaUiSurface } from './types';

const SHELL_META_PATTERN = /[|&;<>`$]|[\r\n]/;

function splitCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | '\'' | null = null;
  let escaped = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (quote) {
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) {
        quote = null;
        continue;
      }
      current += char;
      continue;
    }

    if (char === '"' || char === '\'') {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (escaped || quote) {
    throw new Error('[Hexa UI] Invalid buildCommand: unmatched escaping or quotes.');
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function resolveExecutable(executable: string): string {
  if (process.platform !== 'win32') {
    return executable;
  }

  if (path.extname(executable) || executable.includes('\\') || executable.includes('/')) {
    return executable;
  }

  return `${executable}.cmd`;
}

/** Run a user-supplied shell command for an external UI surface build. */
export function runUiBuildCommand(surface: HexaUiSurface, command: string): void {
  const normalizedCommand = command.trim();
  if (!normalizedCommand) {
    throw new Error(`[Hexa UI] ${surface} buildCommand is empty.`);
  }

  if (SHELL_META_PATTERN.test(normalizedCommand)) {
    throw new Error(
      `[Hexa UI] ${surface} buildCommand contains disallowed shell control characters. ` +
        'Use a single executable plus arguments only.'
    );
  }

  const parts = splitCommand(normalizedCommand);
  const executable = parts.shift();
  if (!executable) {
    throw new Error(`[Hexa UI] ${surface} buildCommand did not resolve to an executable.`);
  }

  const resolvedExecutable = resolveExecutable(executable);
  console.log(`→ Running ${surface} build command: ${command}`);
  const result = spawnSync(resolvedExecutable, parts, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw new Error(
      `[Hexa UI] Failed to execute ${surface} build command "${normalizedCommand}": ${result.error.message}`
    );
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(
      `[Hexa UI] ${surface} build command exited with code ${result.status}: ${normalizedCommand}`
    );
  }
}
