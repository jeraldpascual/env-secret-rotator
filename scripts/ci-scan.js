#!/usr/bin/env node
const scanner = require('../src/scanner');

(async () => {
  const target = process.argv[2] || '.';
  try {
    // Ignore common noisy locations and example/test fixtures
    const res = await scanner.scan({
      path: target,
      ignore: 'node_modules/**,.git/**,tests/**,examples/**,**/*.bak,scripts/manual_test.js,src/patterns.js'
    });
    console.log(JSON.stringify(res, null, 2));
    if (res.secrets && res.secrets.length) {
      console.error(`Found ${res.secrets.length} secrets — failing CI`);
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('CI scan failed:', err.message || err);
    process.exit(2);
  }
})();
