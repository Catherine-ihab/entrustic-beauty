/* One-off: replace low-contrast literal colours in the web app source.
 *   #94A3B8 (2.6:1)  -> #64748B (4.6:1)
 *   #059669 (3.8:1)  -> #047857 (5.1:1)
 *   #0284C7 (4.1:1)  -> #0369A1 (5.5:1)
 *   #22C55E          -> #047857
 *   #10B981          -> #047857
 * Arabic text and JSX stay untouched; only the hex literals change.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'apps', 'web', 'src');
const MAP = {
  '#94a3b8': '#64748B',
  '#059669': '#047857',
  '#0284c7': '#0369A1',
  '#22c55e': '#047857',
  '#10b981': '#047857',
  '#ef4444': '#B91C1C',
  '#16a34a': '#047857',
  '#d97706': '#B45309',
  '#dc2626': '#B91C1C',
  '#f43f5e': '#BE123C',
  '#3b82f6': '#1D4ED8',
  '#7c3aed': '#6D28D9',
  '#8b5cf6': '#7C3AED',
};

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
};

let changed = 0;
const touched = [];
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  let next = src;
  for (const [from, to] of Object.entries(MAP)) {
    next = next.replace(new RegExp(from.replace('#', '#'), 'gi'), to);
  }
  if (next !== src) {
    fs.writeFileSync(file, next, 'utf8');
    changed += 1;
    touched.push(path.relative(ROOT, file));
  }
}
console.log('files changed:', changed);
touched.forEach((f) => console.log('  ', f));
