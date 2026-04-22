import { Command } from 'commander';

export async function runCli(program: Command, args: string[]): Promise<void> {
  program.exitOverride();
  await program.parseAsync(args, { from: 'user' });
}

export function getCommand(program: Command, name: string): Command {
  const command = program.commands.find(item => item.name() === name);
  if (!command) {
    throw new Error(`Command "${name}" not found.`);
  }
  return command;
}
