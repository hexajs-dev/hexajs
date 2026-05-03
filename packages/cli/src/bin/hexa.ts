#!/usr/bin/env node
import { Command } from 'commander';
import { addCommand } from './programs/add';
import { build } from './programs/build';
import { generateCommand } from './programs/generate';
import { infoCommand } from './programs/info';
import { newCommand } from './programs/new/new';
import cliPackage from '../../package.json';

const program = new Command();




program
    .name('hexa')
    .version(cliPackage.version, '-v, --version')
    .description('HexaJS command line interface');


// --- THE BUILD COMMAND ---
build(program)

// --- THE NEW COMMAND ---
newCommand(program)

// --- THE ADD COMMAND ---
addCommand(program)

// --- THE GENERATE COMMAND ---
generateCommand(program)

// --- THE INFO COMMAND ---
infoCommand(program)

program.parse(process.argv);