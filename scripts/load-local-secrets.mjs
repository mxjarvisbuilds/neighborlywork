import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function loadLocalSecrets() {
  const path = join(homedir(), '.jarvis', 'secrets.env');
  if (!existsSync(path)) return {};
  const text = readFileSync(path, 'utf8');
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).replace(/^['"]|['"]$/g, '');
    if (!key) continue;
    const existing = process.env[key];
    const existingLooksPlaceholder = typeof existing === 'string' && (/HERE\b/i.test(existing) || /your[-_]/i.test(existing));
    if (!(key in process.env) || existingLooksPlaceholder) process.env[key] = value;
    values[key] = value;
  }
  return values;
}
