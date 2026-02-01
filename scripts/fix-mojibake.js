const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const files = [];
(function walk(dir){
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === '.git') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(html|css|js|txt|md)$/i.test(ent.name)) files.push(p);
  }
})(root);

const reps = new Map([
  // Common UTF-8-as-Windows-1252 mojibake
  ['’', '’'],
  ['“', '“'],
  ['”', '”'],
  ['–', '–'],
  ['—', '—'],
  ['•', '•'],
  ['…', '…'],
  ['™', '™'],
  // Some files contain the 3-character sequence U+00E2 U+20AC U+00A2 (shows as •)
  ['\u00E2\u20AC\u00A2', '•'],
  // Remove stray non‑breaking artifacts
  ['', ''],
  ['', ''],
  // Emoji mojibake seen on contact page
  ['📧', '📧'],
  ['📞', '📞'],
  ['🌐', '🌐'],
  ['💬', '💬'],
]);

function applyReplacements(text){
  let out = text;
  for (const [from,to] of reps.entries()) {
    // Handle the explicit unicode escape key for the bullet sequence
    if (from === '\\u00E2\\u20AC\\u00A2') {
      out = out.replace(/\u00E2\u20AC\u00A2/g, to);
    } else {
      out = out.split(from).join(to);
    }
  }
  return out;
}

let changedFiles = 0;
for (const f of files) {
  const before = fs.readFileSync(f, 'utf8');
  const after = applyReplacements(before);
  if (after !== before) {
    fs.writeFileSync(f, after, 'utf8');
    changedFiles++;
    console.log('FIXED', path.relative(root, f));
  }
}

console.log('Done. Changed files:', changedFiles);
