const SECRET_PATTERNS = [
  {
    type: 'AWS Access Key',
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: 'high'
  },
  {
    type: 'Generic API Key',
    regex: /['\"]?api[_-]?key['\"]?\s*[:=]\s*['\"]([^'\"]+)['\"]/gi,
    severity: 'high'
  },
  {
    type: 'Generic API Key',
    // Match env-style API keys like: API_KEY=secret_12345 or APIKEY=abcd
    regex: /\bAPI[_-]?KEY\b\s*=\s*([^\s]+)/i,
    severity: 'high'
  },
  {
    type: 'Generic Secret',
    regex: /['\"]?secret['\"]?\s*[:=]\s*['\"]([^'\"]+)['\"]/gi,
    severity: 'high'
  },
  {
    type: 'Password',
    regex: /['\"]?password['\"]?\s*[:=]\s*['\"]([^'\"]+)['\"]/gi,
    severity: 'high'
  },
  {
    type: 'JWT Token',
    regex: /eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
    severity: 'medium'
  },
  {
    type: 'GitHub Token',
    regex: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
    severity: 'high'
  },
  {
    type: 'Slack Token',
    regex: /xox[baprs]-[0-9]{10,12}-[0-9]{10,12}-[A-Za-z0-9]{24,}/g,
    severity: 'high'
  }
];

const ENV_VAR_PATTERN = /^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/;

module.exports = {
  SECRET_PATTERNS,
  ENV_VAR_PATTERN
};
