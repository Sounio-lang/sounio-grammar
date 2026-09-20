import * as vscode from 'vscode';
import { execFile, ChildProcess } from 'child_process';

export function createDiagnostics(
    context: vscode.ExtensionContext,
    executable: () => string,
    environment: () => NodeJS.ProcessEnv
): (doc: vscode.TextDocument) => void {
    const collection = vscode.languages.createDiagnosticCollection('sounio-check');
    const output = vscode.window.createOutputChannel('Sounio Check');
    const running = new Map<string, ChildProcess>();
    const generations = new Map<string, number>();
    let disposed = false;
    const check = (doc: vscode.TextDocument): void => {
        if (doc.languageId !== 'sounio' || doc.uri.scheme !== 'file' || doc.isDirty || doc.isClosed) { return; }
        const key = doc.uri.toString();
        const generation = (generations.get(key) || 0) + 1;
        generations.set(key, generation);
        running.get(key)?.kill();
        const version = doc.version;
        const child = execFile(executable(), ['check', doc.uri.fsPath],
            { env: environment(), timeout: 60000, maxBuffer: 2 * 1024 * 1024 },
            (error, stdout, stderr) => {
                if (disposed || generations.get(key) !== generation) { return; }
                running.delete(key);
                if (doc.isClosed || doc.isDirty || doc.version !== version) { return; }
                const text = `${stdout}\n${stderr}`.replace(/\x1b\[[0-9;]*m/g, '');
                const diagnostics = parseSoucOutput(text, doc);
                if (error && diagnostics.length === 0) {
                    const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0),
                        `Compiler check failed: ${error.message}. See Sounio Check output.`,
                        vscode.DiagnosticSeverity.Error);
                    diagnostic.source = 'souc';
                    diagnostics.push(diagnostic);
                }
                if (error || text.trim()) { output.appendLine(`${doc.uri.fsPath}\n${text}\n${error?.message || ''}`); }
                collection.set(doc.uri, diagnostics);
            });
        running.set(key, child);
    };
    context.subscriptions.push(collection, output,
        vscode.workspace.onDidSaveTextDocument(doc => {
            if (vscode.workspace.getConfiguration('sounio').get<boolean>('checkOnSave', true)) { check(doc); }
        }),
        vscode.workspace.onDidCloseTextDocument(doc => {
            const key = doc.uri.toString();
            generations.delete(key);
            running.get(key)?.kill();
            running.delete(key);
            collection.delete(doc.uri);
        }),
        { dispose: () => { disposed = true; for (const process of running.values()) { process.kill(); } running.clear(); } }
    );
    return check;
}

export function parseSoucOutput(stderr: string, doc: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = stderr.split('\n');

    const pattern1Header = /^(error|warning|note)\[?[A-Z0-9]*\]?:\s+(.+)$/;
    const pattern1Location = /^\s+-->\s+.+:(\d+):(\d+)/;
    const pattern2 = /^.+:(\d+):(\d+):\s+(error|warning|note):\s+(.+)$/;
    const pattern3 = /^(error|warning):\s+(.+)\s+at\s+(\d+):(\d+)$/;

    let pendingMessage: string | null = null;
    let pendingSeverity = vscode.DiagnosticSeverity.Error;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const inline = pattern3.exec(line);
        if (inline) {
            diagnostics.push(makeDiag(doc, Number(inline[3]) - 1, Number(inline[4]) - 1,
                inline[2].trim(), severityFromWord(inline[1])));
            pendingMessage = null;
            continue;
        }
        const h = pattern1Header.exec(line);
        if (h) {
            pendingMessage = h[2].trim();
            pendingSeverity = severityFromWord(h[1]);
            continue;
        }

        if (pendingMessage !== null) {
            const loc = pattern1Location.exec(line);
            if (loc) {
                diagnostics.push(makeDiag(doc,
                    parseInt(loc[1], 10) - 1,
                    parseInt(loc[2], 10) - 1,
                    pendingMessage, pendingSeverity));
                pendingMessage = null;
                continue;
            }
            if (!line.startsWith(' ') && !line.startsWith('\t')) {
                pendingMessage = null;
            }
        }

        const m2 = pattern2.exec(line);
        if (m2) {
            diagnostics.push(makeDiag(doc,
                parseInt(m2[1], 10) - 1,
                parseInt(m2[2], 10) - 1,
                m2[4].trim(), severityFromWord(m2[3])));
            continue;
        }

        const m3 = pattern3.exec(line);
        if (m3) {
            diagnostics.push(makeDiag(doc,
                parseInt(m3[3], 10) - 1,
                parseInt(m3[4], 10) - 1,
                m3[2].trim(), severityFromWord(m3[1])));
        }
    }

    return diagnostics;
}

function severityFromWord(word: string): vscode.DiagnosticSeverity {
    switch (word.toLowerCase()) {
        case 'warning': return vscode.DiagnosticSeverity.Warning;
        case 'note': return vscode.DiagnosticSeverity.Information;
        default: return vscode.DiagnosticSeverity.Error;
    }
}

function makeDiag(
    doc: vscode.TextDocument,
    lineNum: number, colNum: number,
    message: string, severity: vscode.DiagnosticSeverity
): vscode.Diagnostic {
    const safeLine = Math.max(0, Math.min(lineNum, doc.lineCount - 1));
    const docLine = doc.lineAt(safeLine);
    const safeCol = Math.max(0, Math.min(colNum, docLine.text.length));
    const range = new vscode.Range(safeLine, safeCol, safeLine, docLine.text.length);
    const diag = new vscode.Diagnostic(range, message, severity);
    diag.source = 'souc';
    return diag;
}
