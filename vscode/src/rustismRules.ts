export interface SyntaxFinding { start: number; end: number; message: string; }
export function detectRustisms(text: string): SyntaxFinding[] {
    // Mask comments and literals without changing UTF-16 document offsets.
    const chars = text.split('');
    let i = 0;
    const blank = (n: number) => { while (n-- > 0) { if (chars[i] !== '\n') { chars[i] = ' '; } i++; } };
    while (i < text.length) {
        if (text.startsWith('//', i)) {
            while (i < text.length && text[i] !== '\n') { blank(1); }
        } else if (text.startsWith('/*', i)) {
            let depth = 1; blank(2);
            while (i < text.length && depth > 0) {
                if (text.startsWith('/*', i)) { depth++; blank(2); }
                else if (text.startsWith('*/', i)) { depth--; blank(2); }
                else { blank(1); }
            }
        } else if (text[i] === '"' || text[i] === "'") {
            const quote = text[i]; blank(1);
            while (i < text.length) {
                if (text[i] === '\\') { blank(Math.min(2, text.length - i)); }
                else if (text[i] === quote) { blank(1); break; }
                else { blank(1); }
            }
        } else { i++; }
    }
    const code = chars.join('');
    const rules: [RegExp, string][] = [
        [/\blet\s+mut\b/g, 'Use var for mutable bindings (compiler E040).'],
        [/&\s*mut\b/g, 'Use &! for exclusive references (compiler E041).'],
        [/\b[A-Za-z_][A-Za-z0-9_]*!\s*\(/g, 'Use a regular function call instead of Rust macro syntax (compiler E043).']
    ];
    const findings: SyntaxFinding[] = [];
    for (const [regex, message] of rules) {
        for (const match of code.matchAll(regex)) {
            findings.push({start: match.index!, end: match.index! + match[0].length, message});
        }
    }
    return findings.sort((a, b) => a.start - b.start);
}
