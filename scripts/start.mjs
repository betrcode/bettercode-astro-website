#!/usr/bin/env node
/** `npm start`: installs dependencies on the first run, then starts the dev server and opens the browser. */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (args) => spawnSync(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' }).status ?? 1;

if (!existsSync('node_modules/.bin/astro')) {
  console.log('First run: installing dependencies…');
  const status = run(['ci']);
  if (status !== 0) process.exit(status);
}
process.exit(run(['exec', '--', 'astro', 'dev', '--open']));
