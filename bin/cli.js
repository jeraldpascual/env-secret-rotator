#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const scanner = require('../src/scanner');
const replacer = require('../src/replacer');
const generator = require('../src/generator');
const pkg = require('../package.json');
const _chalk = chalk && chalk.default ? chalk.default : chalk;

const program = new Command();

program
  .name('env-secret-rotator')
  .description('Detect and rotate environment secrets')
  .version(pkg.version);

program
  .command('scan')
  .description('Scan repository for leaked secrets')
  .option('--no-default-ignores', 'Do not apply built-in ignore patterns (useful to include examples or vendor files)')
  .option('-p, --path <path>', 'Path to scan', process.cwd())
  .option('-i, --ignore <patterns>', 'Patterns to ignore (comma-separated)')
  .option('-o, --output <file>', 'Output report file', 'secrets-report.json')
  .action(async (options) => {
    console.log(_chalk.blue(' Scanning for secrets...'));
    try {
      // Ensure output file is ignored when it's inside the scanned path
      const scanPath = options.path || process.cwd();
      const out = options.output;
      if (out) {
        const outAbs = path.resolve(out);
        const scanAbs = path.resolve(scanPath);
        const rel = path.relative(scanAbs, outAbs);
        if (!rel.startsWith('..')) {
          // output is inside scan path — add to ignore patterns
          options.ignore = options.ignore ? `${options.ignore},${rel}` : rel;
        }
      }

      // Ensure common folders are ignored by default to avoid scanning dependencies/build artifacts
      const defaultIgnores = ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'examples/**', '**/*.bak', 'tests/**'];
      let finalIgnore;
      if (options.ignore) {
        finalIgnore = Array.isArray(options.ignore)
          ? options.ignore.slice()
          : options.ignore.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        finalIgnore = [];
      }

      // By default we append built-in ignore patterns; callers can opt-out with --no-default-ignores
      if (options.defaultIgnores !== false) {
        for (const d of defaultIgnores) {
          if (!finalIgnore.includes(d)) finalIgnore.push(d);
        }
      }

      options.ignore = finalIgnore;

      const results = await scanner.scan(options);
      console.log(_chalk.green(`✓ Scan complete. Found ${results.secrets.length} potential secrets.`));

      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(results, null, 2), 'utf-8');
        console.log(_chalk.green(`✓ Report written to ${options.output}`));
      }
    } catch (err) {
      console.error(_chalk.red('Scan failed:'), err.message || err);
      process.exit(1);
    }
  });

program
  .command('replace')
  .description('Replace secrets with placeholders')
  .option('-p, --path <path>', 'Path to process', process.cwd())
  .option('-d, --dry-run', 'Show what would be changed without making changes')
  .option('-y, --yes', 'Skip confirmation prompt (useful for CI)')
  .action(async (options) => {
    console.log(_chalk.yellow(' Replacing secrets...'));
    try {
      const scanPath = options.path || process.cwd();
      try {
        const st = await fs.stat(scanPath);
        if (!st.isDirectory()) {
          console.error(_chalk.red('Path is not a directory:'), scanPath);
          process.exit(1);
        }
      } catch (e) {
        console.error(_chalk.red('Path does not exist:'), scanPath);
        process.exit(1);
      }

      const results = await replacer.replace(Object.assign({}, options, { dryRun: true }));
      console.log(_chalk.green(`✓ Dry-run: ${results.count} potential replacements across ${results.files.length} files.`));

      const doReplace = !options.dryRun;
      if (doReplace) {
        if (options.yes) {
          const actual = await replacer.replace(options);
          console.log(_chalk.green(`✓ Replaced ${actual.count} secrets.`));
        } else {
          // Interactive confirmation
          const readline = require('readline');
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          await new Promise((resolve) => {
            rl.question('Proceed with replacements and create backups? (y/N): ', async (answer) => {
              rl.close();
              const ok = (answer || '').trim().toLowerCase() === 'y';
              if (!ok) {
                console.log(_chalk.yellow('Aborting replacements. No files changed.'));
                return resolve();
              }
              const actual = await replacer.replace(options);
              console.log(_chalk.green(`✓ Replaced ${actual.count} secrets.`));
              resolve();
            });
          });
        }
      }
    } catch (err) {
      console.error(_chalk.red('Replace failed:'), err.message || err);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate .env.example from .env files')
  .option('-p, --path <path>', 'Path to .env file', '.env')
  .option('-o, --output <file>', 'Output file', '.env.example')
  .action(async (options) => {
    console.log(_chalk.blue(' Generating .env.example...'));
    await generator.generate(options);
    console.log(_chalk.green('✓ .env.example generated successfully.'));
  });

program.parse(process.argv);
