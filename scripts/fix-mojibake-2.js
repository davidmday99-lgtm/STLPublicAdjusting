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

const reps = [
  // “ ... ” etc (note the last char is U+009D or U+009C or U+0099 often)
  ['”', '”'],
  ['“', '“'],
  ['’', '’'],
  ['‘', '‘'],
  ['–', '–'],
  ['—', '—'],
  ['…', '…'],

  // Common visible forms (sometimes pasted literally)
  ['”', '”'],
  ['“', '“'],
  ['’', '’'],
  ['‘', '‘'],
  ['–', '–'],
  ['—', '—'],
  ['…', '…'],
  ['•', '•'],

  // stray NBSP marker
  ['', ''],
];

let changed = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const before = s;
  for (const [a,b] of reps) s = s.split(a).join(b);
  if (s !== before) {
    fs.writeFileSync(f, s, 'utf8');
    console.log('FIXED', path.relative(root, f));
    changed++;
  }
}
console.log('Done. Changed files:', changed);
