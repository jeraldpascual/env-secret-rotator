#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const scanner = require('../src/scanner');

(async () => {
  const args = process.argv.slice(2);
  const target = args[0] || '.';
  const out = args[1] || 'scan-report.json';
  const options = { path: target, ignore: '' };
  // If the output file is inside the target, add it to ignore so it is not scanned.
  try {
    const targetAbs = path.resolve(target);
    const outAbs = path.resolve(out);
    const rel = path.relative(targetAbs, outAbs);
    if (!rel.startsWith('..')) {
      options.ignore = options.ignore ? `${options.ignore},${rel}` : rel;
    }
  } catch (e) {
    // ignore errors here
  }
  try {
    const results = await scanner.scan(options);
    await fs.mkdir(path.dirname(out || '.'), { recursive: true });
    await fs.writeFile(out, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Wrote report to ${out}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
