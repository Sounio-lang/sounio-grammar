// The repository root is the only editable TextMate grammar.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sounio.tmLanguage.json'));
const target = path.join(root, 'vscode/syntaxes/sounio.tmLanguage.json');
if (process.argv.includes('--check')) {
  if (!source.equals(fs.readFileSync(target))) {
    throw new Error('Generated grammar differs; run npm run grammar:sync');
  }
} else { fs.writeFileSync(target, source); }
