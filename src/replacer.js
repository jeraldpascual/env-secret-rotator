const fs = require('fs').promises;
const path = require('path');
const scanner = require('./scanner');

function maskValue(value, opts = {}) {
  const keep = Number.isInteger(opts.keepSuffix) ? opts.keepSuffix : 4;
  if (!value || keep <= 0) return '<REDACTED>';
  if (value.length <= keep + 2) return '<REDACTED>';
  const visible = value.slice(-keep);
  const masked = '*'.repeat(Math.max(3, value.length - keep));
  return `${masked}${visible}`;
}

async function replace(options = {}) {
  const scanPath = options.path || process.cwd();
  const ignore = options.ignore || '';
  const dryRun = !!options.dryRun || !!options.dry_run;
  const keepSuffix = options.keepSuffix || options.keep_suffix || 4;
  const placeholderTemplate = options.placeholder || '<REDACTED:%TYPE%:%VALUE%>';

  const results = await scanner.scan({ path: scanPath, ignore });
  if (!results.secrets || results.secrets.length === 0) {
    return { count: 0, files: [] };
  }

  // Group secrets by file
  const byFile = results.secrets.reduce((acc, s) => {
    acc[s.file] = acc[s.file] || [];
    acc[s.file].push(s);
    return acc;
  }, {});

  const files = Object.keys(byFile);
  let count = 0;

  for (const file of files) {
    const abs = path.resolve(file);
    let content;
    try {
      content = await fs.readFile(abs, 'utf-8');
    } catch (e) {
      // skip unreadable files
      continue;
    }

    let newContent = content;
    for (const s of byFile[file]) {
      // Build replacement using configurable placeholder
      const masked = maskValue(s.matched, { keepSuffix });
      const tpl = placeholderTemplate
        .replace(/%TYPE%/g, s.type.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase())
        .replace(/%VALUE%/g, masked);

      // escape regex special chars in matched string
      const esc = s.matched.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      const re = new RegExp(esc, 'g');
      if (re.test(newContent)) {
        newContent = newContent.replace(re, tpl);
        count++;
      }
    }

    if (!dryRun && newContent !== content) {
      // backup
      try {
        await fs.copyFile(abs, abs + '.bak');
      } catch (e) {
        // ignore backup failure
      }
      await fs.writeFile(abs, newContent, 'utf-8');
    }
  }

  return { count, files };
}

module.exports = { replace, maskValue };
