import { Command } from 'commander';

export function parseArgs(argv) {
  const program = new Command();

  program
    .name('echo-host')
    .description('UDP echo/simulator host for driver development')
    .option('-p, --port <number>', 'listen port', v => Number(v))
    .option('-e, --eom <char>', 'end-of-message character')
    .option('--save', 'persist --port/--eom to settings for future runs')
    .parse(argv);

  return program.opts();
}
