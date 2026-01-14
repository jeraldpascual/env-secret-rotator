const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const patterns = require('./patterns');

class Scanner {
  async scan(options) {
    const { path: scanPath, ignore } = options;
    let ignorePatterns;
    if (Array.isArray(ignore)) {
      ignorePatterns = ignore;
    } else if (typeof ignore === 'string' && ignore.length) {
      ignorePatterns = ignore.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      ignorePatterns = ['node_modules/**', '.git/**', 'dist/**'];
    }

    const files = await this.getFiles(scanPath, ignorePatterns);
    const secrets = [];

    for (const file of files) {
      const fileSecrets = await this.scanFile(file);
      secrets.push(...fileSecrets);
    }

    return {
      scannedFiles: files.length,
      secrets,
      timestamp: new Date().toISOString()
    };
  }

  async getFiles(scanPath, ignorePatterns) {
    // Use glob when available (older API) otherwise fall back to recursive fs walk
    if (typeof glob === 'function') {
      return new Promise((resolve, reject) => {
        glob('**/*', {
          cwd: scanPath,
          ignore: ignorePatterns,
          nodir: true
        }, (err, files) => {
          if (err) reject(err);
          else resolve(files.map(f => path.join(scanPath, f)));
        });
      });
    }

    // Fallback: simple recursive file collector
    const results = [];

    const shouldIgnore = (filePath) => {
      // Compute path relative to the scan root and normalize to forward-slash
      const rel = path.relative(scanPath, filePath).replace(/\\/g, '/');
      for (const p of ignorePatterns) {
        if (!p) continue;
        // handle ** wildcard at end like 'node_modules/**'
        if (p.endsWith('/**')) {
          const base = p.slice(0, -3).replace(/\\/g, '/');
          if (rel === base || rel.startsWith(base + '/')) return true;
        } else {
          // direct prefix match or filename match
          const pat = p.replace(/\\/g, '/');
          if (rel === pat || rel.startsWith(pat + '/') || rel.includes('/' + pat + '/')) return true;
        }
      }
      return false;
    };

    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (shouldIgnore(full)) continue;
        if (entry.isDirectory()) await walk(full);
        else results.push(full);
      }
    };

    await walk(scanPath);
    return results;
  }

  async scanFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const secrets = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const pattern of patterns.SECRET_PATTERNS) {
        const matches = line.match(pattern.regex);
        if (matches) {
          secrets.push({
            file: filePath,
            line: index + 1,
            type: pattern.type,
            matched: matches[0],
            severity: pattern.severity
          });
        }
      }
    });

    return secrets;
  }
}

module.exports = new Scanner();
