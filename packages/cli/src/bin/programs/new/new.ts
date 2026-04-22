import { Command } from 'commander';
// enquirer uses `export = Enquirer` — must use default import + Enquirer.prompt()
import Enquirer from 'enquirer';
import chalk from 'chalk';
import { printError, printSuccess } from '../../shared/reporter';
import { scaffold } from './services/scaffold.service';

const VALID_NAME_RE = /^[a-z0-9][a-z0-9-_]*$/i;

const ALL_PLATFORMS = ['chrome', 'firefox', 'safari', 'opera', 'edge', 'brave'] as const;
type Platform = (typeof ALL_PLATFORMS)[number];

/** Parse a comma-separated platform string into a validated list */
function parsePlatforms(raw: string): Platform[] {
  const parts = raw
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean) as Platform[];

  const invalid = parts.filter((p) => !(ALL_PLATFORMS as readonly string[]).includes(p));
  if (invalid.length) {
    throw new Error(
      `Unknown platform(s): ${invalid.join(', ')}. Allowed: ${ALL_PLATFORMS.join(', ')}`
    );
  }
  return parts;
}

export const newCommand = (program: Command): void => {
  program
    .command('new [name]')
    .description('Scaffold a new HexaJS extension project')
    .option(
      '--platform <platforms>',
      'Comma-separated list of target platforms (chrome,firefox,…)'
    )
    .action(async (nameArg: string | undefined, options: { platform?: string }) => {
      const start = Date.now();

      try {
        // ── 1. Resolve project name ──────────────────────────────────────────
        let name: string = nameArg ?? '';

        if (!name || !VALID_NAME_RE.test(name)) {
          if (name) {
            console.log(
              chalk.yellow(`  "${name}" is not a valid project name.`) +
                ' Use lowercase letters, numbers, hyphens and underscores.'
            );
          }

          const prompt = await Enquirer.prompt<{ name: string }>({
            type: 'input',
            name: 'name',
            message: 'What is your extension name?',
            initial: name || 'my-extension',
            validate: (value: string) =>
              VALID_NAME_RE.test(value)
                ? true
                : 'Name must start with a letter or digit and contain only a-z, 0-9, - or _',
          });

          name = prompt.name;
        }

        // ── 2. Select project template ───────────────────────────────────────
        const templateAnswer = await Enquirer.prompt<{ template: string }>({
          type: 'select',
          name: 'template',
          message: 'Select project template',
          choices: [
            {
              name: 'full',
              message: 'Full example  (background + content + store + services + ping/pong demo)',
            },
            {
              name: 'blank',
              message: 'Blank         (background + content only, ready to build from scratch)',
            },
          ],
        } as any);

        const blank = templateAnswer.template === 'blank';

        // ── 3. Resolve platforms ─────────────────────────────────────────────
        let platforms: Platform[];

        if (options.platform) {
          platforms = parsePlatforms(options.platform);
        } else {
          const answer = await Enquirer.prompt<{ platforms: string[] }>({
            type: 'multiselect',
            name: 'platforms',
            message: 'Select target platforms  (space to toggle, enter to confirm)',
            choices: ALL_PLATFORMS.map((p) => ({
              name: p,
              value: p,
              // pre-select chrome
              enabled: p === 'chrome',
            })),
          } as any);

          if (!answer.platforms?.length) {
            throw new Error('Please select at least one platform.');
          }

          platforms = answer.platforms as Platform[];
        }

        // ── 4. React popup ─────────────────────────────────────────────────
        const popupAnswer = await Enquirer.prompt<{ reactPopup: boolean }>({
          type: 'confirm',
          name: 'reactPopup',
          message: 'Add a React popup? (managed by Hexa)',
          initial: false,
        } as any);

        const reactPopup = popupAnswer.reactPopup;

        // ── 5. Devtools ─────────────────────────────────────────────────
        const devtoolsAnswer = await Enquirer.prompt<{ managedDevtools: boolean }>({
          type: 'confirm',
          name: 'managedDevtools',
          message: 'Add a managed React DevTools panel? (requires @vitejs/plugin-react)',
          initial: false,
        } as any);

        const managedDevtools = devtoolsAnswer.managedDevtools;
        const reactDevtools = managedDevtools;

        // ── 6. Scaffold ──────────────────────────────────────────────────────
        console.log('');
        console.log(chalk.cyan(`  Creating project ${chalk.bold(name)}…`));
        console.log('');

        const projectDir = await scaffold({ name, platforms, reactPopup, managedDevtools, reactDevtools, blank });

        console.log(chalk.dim(`  Platforms : ${platforms.join(', ')}`));
        console.log(chalk.dim(`  Location  : ${projectDir}`));
        console.log('');

        printSuccess(Date.now() - start, projectDir);

        console.log('');
        console.log('  Next steps:');
        console.log(chalk.cyan(`    cd ${name}`));
        console.log(chalk.cyan('    pnpm install'));
        console.log(chalk.cyan('    pnpm build'));
        console.log('');
      } catch (error) {
        // Enquirer throws '' when the user cancels with Ctrl-C
        if (error === '') return;
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
};
