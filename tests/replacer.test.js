const fs = require('fs').promises;
const path = require('path');
const replacer = require('../src/replacer');

describe('Replacer', () => {
  const testDir = path.join(__dirname, 'fixtures_replacer');
  const filePath = path.join(testDir, 'secret.txt');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(filePath, 'API_KEY=secret_98765\nkeep=this', 'utf-8');
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('dry-run does not modify files and reports count', async () => {
    const res = await replacer.replace({ path: testDir, dryRun: true });
    expect(res.count).toBeGreaterThan(0);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('API_KEY=secret_98765');
  });

  test('actual replace creates backup and replaces values', async () => {
    const res = await replacer.replace({ path: testDir, dryRun: false, keepSuffix: 3 });
    expect(res.count).toBeGreaterThan(0);
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).not.toContain('API_KEY=secret_98765');
    const bak = await fs.readFile(filePath + '.bak', 'utf-8');
    expect(bak).toContain('API_KEY=secret_98765');
    // restored mask should keep last 3 chars
    expect(content).toMatch(/\*+765/);
  });
});
