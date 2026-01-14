# Contributing

Thanks for your interest in contributing to env-secret-rotator. This file explains the recommended development environment and how to run tests locally.

Development environment
- Node: use an LTS version (recommended `18.x` or `20.x`). This project is tested on Node 20 in CI. If you use Node 25+, tests require a small flag for Jest (see below).

Set up

```bash
git clone <repo>
cd env-secret-rotator
npm install
```

Running tests

```bash
# Preferred (wrapper handles Node v25+ issues)
npm test

# Or run directly with Node flag if needed:
node --localstorage-file=.localstorage node_modules/jest/bin/jest.js --runInBand
```

Linking the CLI for local testing

```bash
npm link
# now you can run `esr` globally in your shell
esr --help
```

How to contribute
- Open an issue describing the change or bug.
- Create a feature branch and open a PR. Include tests for new behavior where appropriate.

Security and secrets handling
- The project may create `.bak` backups and `.localstorage` files during test and replace operations. These files can contain secrets — do not commit them to the repository.
- Make sure `.gitignore` contains `.localstorage` and `*.bak` (it does by default in this repo).
