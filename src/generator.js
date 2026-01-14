const fs = require('fs').promises;
const path = require('path');
const { ENV_VAR_PATTERN } = require('./patterns');

class Generator {
  async generate(options) {
    const { path: envPath, output } = options;

    const content = await fs.readFile(envPath, 'utf-8');
    const lines = content.split('\n');
    const exampleLines = [];

    for (const line of lines) {
      if (line.trim().startsWith('#') || line.trim() === '') {
        exampleLines.push(line);
        continue;
      }

      const match = line.match(ENV_VAR_PATTERN);
      if (match) {
        const [, key] = match;
        exampleLines.push(`${key}=`);
      } else {
        exampleLines.push(line);
      }
    }

    await fs.writeFile(output, exampleLines.join('\n'));
    return { generated: output };
  }
}

module.exports = new Generator();
