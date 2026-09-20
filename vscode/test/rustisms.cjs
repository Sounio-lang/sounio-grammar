const assert = require('node:assert/strict');
const {detectRustisms} = require('../out/rustismRules');
assert.equal(detectRustisms('let mut x = 1; let y: &mut i64 = x; std::println!(x)').length, 3);
for (const text of ['let x = 1;', '// let mut x\n', '/* outer /* &mut */ println!(x) */', 'let x = "let mut &mut println!(x)"', 'fn okay() { return 1; }']) assert.deepEqual(detectRustisms(text), []);
assert.equal(detectRustisms('"😀" let mut x')[0].start, 5);
assert.equal(detectRustisms('"escaped \\" let mut"; let mut x').length, 1);
console.log('Syntax detector: compiler rules, comments, strings, semicolons and offsets passed');
