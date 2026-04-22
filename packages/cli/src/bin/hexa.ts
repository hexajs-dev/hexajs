#!/usr/bin/env node
import { Command } from 'commander';
import { addCommand } from './programs/add';
import { build } from './programs/build';
import { generateCommand } from './programs/generate';
import { newCommand } from './programs/new/new';

const program = new Command();




program
    .name('hexa')
    .version('1.0.0')
    .description('HexaJS command line interface');


// --- THE BUILD COMMAND ---
build(program)

// --- THE NEW COMMAND ---
newCommand(program)

// --- THE ADD COMMAND ---
addCommand(program)

// --- THE GENERATE COMMAND ---
generateCommand(program)

program.parse(process.argv);