import * as vscode from 'vscode';
import { detectRustisms } from './rustismRules';
export function createRustismDetector(context: vscode.ExtensionContext): void {
    const collection = vscode.languages.createDiagnosticCollection('sounio-syntax');
    const inspect = (doc: vscode.TextDocument) => {
        if (doc.languageId !== 'sounio') { return; }
        const enabled = vscode.workspace.getConfiguration('sounio').get<boolean>('rustismDetector.enabled', true);
        collection.set(doc.uri, enabled ? detectRustisms(doc.getText()).map(f => {
            const diagnostic = new vscode.Diagnostic(new vscode.Range(doc.positionAt(f.start), doc.positionAt(f.end)), f.message, vscode.DiagnosticSeverity.Warning);
            diagnostic.source = 'sounio-syntax';
            return diagnostic;
        }) : []);
    };
    context.subscriptions.push(collection,
        vscode.workspace.onDidOpenTextDocument(inspect),
        vscode.workspace.onDidChangeTextDocument(e => inspect(e.document)),
        vscode.workspace.onDidCloseTextDocument(doc => collection.delete(doc.uri)),
        vscode.workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('sounio.rustismDetector.enabled')) { vscode.workspace.textDocuments.forEach(inspect); } }),
        vscode.commands.registerCommand('sounio.detectRustisms', () => { const doc = vscode.window.activeTextEditor?.document; if (doc) { inspect(doc); } })
    );
    vscode.workspace.textDocuments.forEach(inspect);
}
