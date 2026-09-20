const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const tm = require('vscode-textmate');
const onig = require('vscode-oniguruma');
(async () => {
  const wasm = fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
  await onig.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  const grammarPath = path.resolve(__dirname, '../../sounio.tmLanguage.json');
  const registry = new tm.Registry({
    onigLib: Promise.resolve({createOnigScanner: p => new onig.OnigScanner(p), createOnigString: s => new onig.OnigString(s)}),
    loadGrammar: async () => tm.parseRawGrammar(fs.readFileSync(grammarPath, 'utf8'), grammarPath)
  });
  const grammar = await registry.loadGrammar('source.sounio');
  function expect(line, text, scope) {
    const start = line.indexOf(text);
    const tokens = grammar.tokenizeLine(line).tokens;
    assert(tokens.some(t => t.startIndex <= start && t.endIndex >= start + text.length && t.scopes.includes(scope)), `${text} needs ${scope}: ${JSON.stringify(tokens)}`);
  }
  expect('fn compute(x: i64) with IO {', 'compute', 'entity.name.function.sounio');
  expect('fn compute(x: i64) with IO {', 'IO', 'support.type.effect.sounio');
  expect('struct Sample {', 'Sample', 'entity.name.type.struct.sounio');
  expect('use std::cmp', 'std::cmp', 'entity.name.namespace.sounio');
  expect('let x = 0xFFu8', '0xFFu8', 'constant.numeric.hex.sounio');
  expect('let x = 1.25f64', '1.25f64', 'constant.numeric.float.sounio');
  expect('let x = 10_kg', '10_kg', 'constant.numeric.unit.sounio');
  expect('x <<= 2', '<<=', 'keyword.operator.assignment.sounio');
  expect('x &! y', '&!', 'keyword.operator.borrow-mut.sounio');
  expect("let c = 'x'", "'x'", 'string.quoted.single.sounio');
  expect('/// docs', '/// docs', 'comment.line.documentation.sounio');
  let state = grammar.tokenizeLine('/* outer /* inner */').ruleStack;
  const nested = grammar.tokenizeLine('still comment */ let x = 1', state).tokens;
  assert(nested[0].scopes.includes('comment.block.sounio'));
  assert(nested.some(t => t.scopes.includes('keyword.declaration.sounio')));
  console.log('12 TextMate tokenization regressions passed');
  registry.dispose();
})().catch(error => { console.error(error); process.exitCode = 1; });
