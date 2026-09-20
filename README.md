# Sounio TextMate Grammar

TextMate grammar for the [Sounio programming language](https://github.com/Sounio-lang/sounio).

## Scope

`source.sounio`

## Supported Syntax

- Keywords: `fn`, `let`, `var`, `struct`, `enum`, `impl`, `match`, `if`, `else`, `while`, `for`, `return`, `pub`, `use`, `module`, `with`, `type`, `unit`, `linear`, `assert`, `extern`
- Effects: `IO`, `Mut`, `Div`, `Panic`, `Alloc`, `Async`, `GPU`, `Prob`
- Types: `i8`-`i64`, `u8`-`u64`, `f32`, `f64`, `bool`, `char`, `usize`
- Comments: `//` line and `/* */` block
- Strings, numbers with suffixes, operators (`&!`, `->`, `=>`, `::`, `++`)

## License

MIT

## VS Code client consolidation

The `vscode/` directory contains the client imported from Sounio's
`tools/editors/vscode`. Its consolidation with the other in-tree client is
still in progress; this is not a published replacement yet.

The root `sounio.tmLanguage.json` is the canonical grammar. Edit it here,
then run `npm --prefix vscode run grammar:sync`. The extension's copy is
generated and checked for byte equality. The consolidated grammar retains
declaration captures, nested comments and numeric suffixes, and adds the
client's character, unit, modifier and function patterns. Highlighting is
not a statement that every recognized construct is supported by a particular
compiler release.

To validate: `npm --prefix vscode ci`, `npm --prefix vscode test`, and
`npm --prefix vscode run compile`. Tokenization tests use the actual TextMate
and Oniguruma engines. LSP runtime validation and reconciliation of the
second client's settings and diagnostics remain pending.
