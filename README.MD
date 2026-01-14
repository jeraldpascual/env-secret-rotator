# env-secret-rotator

Detect leaked environment secrets, replace with placeholders, and generate .env.example files.

## Installation
```bash
npm install -g env-secret-rotator
```

## Usage
```bash
# Scan for secrets
esr scan

# Replace secrets with placeholders
esr replace

# Generate .env.example
esr generate
```

## Features

-  Detect common secret patterns (API keys, tokens, passwords)
-  Auto-replace secrets with secure placeholders
-  Generate .env.example from .env files
- CI/CD integration guidance
-  Detailed security reports

## Testing note

If you run tests on Node v25 or later you may encounter this error:

```
SecurityError: Cannot initialize local storage without a `--localstorage-file` path
```

This repository includes a small wrapper that runs Jest under Node and supplies a `--localstorage-file` path so the VM-based test environment can initialize localStorage safely. Use the standard test command:

```bash
npm test
```

The wrapper is `scripts/run-jest.js` and it will create a `.localstorage` file in the repo root when run. It's safe to add `.localstorage` to `.gitignore` if you prefer not to commit it.

## Local CLI testing

To test the CLI locally without publishing, use `npm link` (this creates a global symlink to the package):

```bash
npm link
# Now `esr` or `env-secret-rotator` is available globally in your shell
esr scan -p /path/to/repo -o /path/to/report.json
```

CI example

This repo includes a simple GitHub Actions workflow at `.github/workflows/ci.yml` that runs tests and then runs a secret scan. The scan step uses `scripts/ci-scan.js` and will fail the job if any secrets are found.

Note: the included `ci.yml` triggers on `push` and `pull_request` (see `.github/workflows/ci.yml`). If you want publishing on releases, add a workflow that listens to `release.published` or create a Release in GitHub to trigger release-based workflows.


## Replace (automatic replacement)

The CLI includes a `replace` command to replace detected secrets with configurable placeholders. Important safety notes:

- Run a dry-run first:

```bash
node bin/cli.js replace -p /path/to/repo -d
```

- To perform replacements (creates `.bak` backups) the CLI will prompt you for confirmation:

```bash
node bin/cli.js replace -p /path/to/repo
```

- Placeholder configuration options (programmatic):
	- `keepSuffix` (number): how many trailing characters of the secret to keep visible in the mask. Default: `4`.
	- `placeholder` (string): template for replacement. Use `%TYPE%` and `%VALUE%` as tokens. Default: `'<REDACTED:%TYPE%:%VALUE%>'`.

Example programmatic replace call:

```js
const replacer = require('./src/replacer');
await replacer.replace({ path: '.', dryRun: false, keepSuffix: 3, placeholder:'<REMOVED:%TYPE%:%VALUE%>' });
```

Unit tests for the replacer are in `tests/replacer.test.js`.

## License

MIT

## Cleanup & backup files

- Backups: when the `replace` command modifies a file it creates a `.bak` file next to the original. That `.bak` file contains the original contents (including any secrets). Treat `.bak` files as sensitive — they may contain keys or tokens. If you confirm replacements and no longer need backups, delete the `.bak` files or move them to a secure location.

- Restore: to restore a single file from backup:

```bash
mv file.js.bak file.js
```

- `.localstorage` and example report files are ignored by default via `.gitignore`. If you created reports inside a scanned folder, consider removing them before committing.

### Common CLI options (examples)

- Scan with a path, ignore patterns, and output a JSON report:
```bash
npx env-secret-rotator scan -p ./src -i "node_modules/**,.git/**,build/**,dist/**" -o secrets-report.json
```

- Dry-run replace (safe):
```bash
npx env-secret-rotator replace -p . --dry-run -i "node_modules/**,.git/**"
```

- Force apply replacements in CI (non-interactive; creates `.bak` backups):
```bash
npx env-secret-rotator replace -p . --yes -i "node_modules/**,.git/**"
```

When running in CI you should set the appropriate auth/environment variables (for npm publishing) and use `--yes` only after reviewing the dry-run report.

## Suggested next actions (non-technical)

- Add a `--yes` or `--ci` script in your CI to run `replace -y` after manual triage.
- Use `replace -d` first for all repositories to create a report, review it, then run interactive replace.
- Consider adding a secure vault or secrets manager and rotate the keys found by this tool.

