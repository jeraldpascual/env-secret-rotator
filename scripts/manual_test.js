const scanner = require('../src/scanner');
const fs = require('fs').promises;
const path = require('path');

(async () => {
  try {
    const dir = path.join(__dirname, '..', 'tests', 'fixtures_manual');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'test.env'), 'API_KEY=secret_12345\nDATABASE_URL=postgres://localhost');

    const results = await scanner.scan({ path: dir, ignore: '' });
    console.log(JSON.stringify(results, null, 2));

    // cleanup
    await fs.rm(dir, { recursive: true, force: true });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
