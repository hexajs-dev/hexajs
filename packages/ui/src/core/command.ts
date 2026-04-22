import { execSync } from 'child_process';
import type { HexaUiSurface } from './types';

/** Run a user-supplied shell command for an external UI surface build. */
export function runUiBuildCommand(surface: HexaUiSurface, command: string): void {
  console.log(`→ Running ${surface} build command: ${command}`);
  execSync(command, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.env.ComSpec ?? (process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'),
  });
}
