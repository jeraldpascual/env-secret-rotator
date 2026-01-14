const scanner = require('../src/scanner');
const fs = require('fs').promises;
const path = require('path');

describe('Scanner', () => {
  const testDir = path.join(__dirname, 'fixtures');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'test.env'),
      'API_KEY=secret_12345\nDATABASE_URL=postgres://localhost'
    );
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('should detect API keys in files', async () => {
    const results = await scanner.scan({ path: testDir, ignore: '' });
    expect(results.secrets.length).toBeGreaterThan(0);
  });

  test('should identify correct secret types', async () => {
    const results = await scanner.scan({ path: testDir, ignore: '' });
    const apiKeySecret = results.secrets.find(s => s.type === 'Generic API Key');
    expect(apiKeySecret).toBeDefined();
  });
});
