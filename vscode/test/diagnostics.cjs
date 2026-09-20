const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
const fake = {
  DiagnosticSeverity: {Error: 0, Warning: 1, Information: 2},
  Range: class {constructor(line, col, endLine, endCol) {Object.assign(this, {line, col, endLine, endCol});}},
  Diagnostic: class {constructor(range, message, severity) {Object.assign(this, {range, message, severity});}}
};
Module._load = function(name, ...args) {return name === 'vscode' ? fake : original.call(this, name, ...args);};
const {parseSoucOutput} = require('../out/diagnostics');
Module._load = original;
const doc = {lineCount: 3, lineAt: () => ({text: 'let value = 1'})};
let result = parseSoucOutput('error: bad type at 2:3', doc);
assert.equal(result.length, 1);
assert.equal(result[0].range.line, 1);
assert.equal(result[0].range.col, 2);
assert.equal(result[0].message, 'bad type');
result = parseSoucOutput('error[E1]: wrong type\n  --> /tmp/source.sio:3:4', doc);
assert.equal(result.length, 1);
assert.equal(result[0].range.line, 2);
result = parseSoucOutput('/tmp/source.sio:1:2: warning: unused', doc);
assert.equal(result[0].severity, 1);
result = parseSoucOutput('error: outside at 999:999', doc);
assert.equal(result[0].range.line, 2);
assert.equal(result[0].range.col, 13);
assert.deepEqual(parseSoucOutput('Compilation succeeded', doc), []);
console.log('5 compiler diagnostic parsing regressions passed');
