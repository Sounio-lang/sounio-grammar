const {runTests} = require('@vscode/test-electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
(async () => {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sounio editor '));
 const workspace = path.join(root, 'workspace');
 fs.mkdirSync(path.join(workspace, '.vscode'), {recursive: true});
 const compiler = path.join(root, 'fixture compiler');
 fs.writeFileSync(compiler, '#!/usr/bin/env node\n' + `if(process.argv[2] !== 'check') process.exit(7);\nconsole.error(process.argv[3] + ':1:1: error: fixture diagnostic');\nprocess.exit(1);\n`, {mode: 0o755});
 fs.writeFileSync(path.join(workspace, '.vscode/settings.json'), JSON.stringify({'sounio.lsp.enabled': false, 'sounio.serverPath': compiler, 'sounio.checkOnSave': false}));
 fs.writeFileSync(path.join(workspace, 'sample.sio'), 'fn main() -> i32 { 0 }\n');
 try {
  await runTests({version: '1.96.4', extensionDevelopmentPath: path.resolve(__dirname, '..'), extensionTestsPath: path.resolve(__dirname, 'host-suite.cjs'), launchArgs: [workspace, '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes', '--no-sandbox', '--user-data-dir=' + path.join(root, 'user'), '--extensions-dir=' + path.join(root, 'extensions')]});
 } finally {fs.rmSync(root, {recursive: true, force: true});}
})().catch(e => {console.error(e); process.exitCode = 1;});
