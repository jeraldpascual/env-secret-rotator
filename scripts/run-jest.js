#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

// Resolve jest CLI entry point
let jestBin;
try {
  jestBin = require.resolve('jest/bin/jest.js');
} catch (e) {
  jestBin = path.join(__dirname, '..', 'node_modules', 'jest', 'bin', 'jest.js');
}

const args = process.argv.slice(2);
// Decide whether to pass Node's --localstorage-file flag (only supported in Node 25+)
const nodeVersion = process.versions && process.versions.node ? process.versions.node.split('.') : ['0'];
const nodeMajor = parseInt(nodeVersion[0], 10) || 0;
const nodeArgs = [];
if (nodeMajor >= 25) {
  nodeArgs.push('--localstorage-file=.localstorage');
}
nodeArgs.push(jestBin, ...args);

const res = spawnSync(process.execPath, nodeArgs, { stdio: 'inherit' });
process.exit(res.status);
