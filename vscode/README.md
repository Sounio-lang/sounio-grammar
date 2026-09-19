# Sounio Language Support for VS Code

VS Code extension for the [Sounio](https://github.com/sounio-lang/sounio)
programming language — epistemic computing at the horizon of certainty.

## Features (preview)

Powered by the checked preview Language Server route (`souc lsp --stdio`):

- **Diagnostics** — type errors highlighted as you save.
- **Hover** — info on Sounio keywords, primitive types, effects, and
  stdlib functions.
- **Completion** — context-aware completions from the stdlib plus
  identifiers in the current file.
- **Go to Definition** (F12) — jump to where a name is declared.
- **Find References** (Shift+F12) — list every use of an identifier.
- **Rename Symbol** (F2) — rename across the current file with a
  workspace-edit preview.
- **Formatting** — routes through the checked `souc format` surface.
- **REPL terminal** — opens the file-backed `souc repl` preview.
- **Syntax Highlighting** — TextMate grammar covering effects, units of
  measure, refinement types, and Sounio's epistemic keywords.

## Setup

The extension spawns the Sounio compiler as a language server:

1. Install Sounio (the `souc` CLI) — see the
   [main repo](https://github.com/sounio-lang/sounio).
2. Make sure `souc` is on `PATH`, *or* set `sounio.serverPath` in your
   VS Code settings to an absolute path (e.g.
   `"/opt/sounio/bin/souc"`). An explicit setting is used as supplied; an
   unavailable executable produces a launch error. The extension does not
   search the opened project for another compiler.

The checked preview route uses the in-tree `bin/souc` wrapper. Rebuilding the
pure-Sounio server from `self-hosted/lsp/server.sio` is a separate compiler
blocker and should not be presented as green until `tools/lsp/test_protocol.sh`
or an equivalent gate passes.

## Commands

| Keybinding | Command |
|---|---|
| `F5` | Sounio: Run Current File |
| `Shift+F5` | Sounio: Run Current File (JIT) |
| `Ctrl+Shift+B` | Sounio: Check Current File |
| `Ctrl+Shift+C` | Sounio: Show Confidence Info |
| `Ctrl+Shift+P` | Sounio: Show Provenance Chain |
| `Ctrl+Shift+E` | Sounio: Toggle Epistemic Mode |

## Configuration

| Setting | Default | Description |
|---|---|---|
| `sounio.serverPath` | `souc` | Path to the Sounio compiler. |
| `sounio.trace.server` | `off` | LSP wire-protocol tracing. |
| `sounio.epistemic.enabled` | `true` | Confidence badges and provenance UI. |
| `sounio.epistemic.confidenceThreshold` | `0.8` | Lower confidence is flagged. |

## License

Dual-licensed under MIT OR Apache-2.0. See `LICENSE`.

### Compiler settings during migration

All CLI actions (run, check, IR views and REPL) and the LSP use the same
compiler selection. An explicitly configured `sounio.serverPath` takes
precedence over the older `sounio.soucPath`; otherwise `souc` is resolved
through PATH. `sounio.stdlibPath` sets `SOUNIO_STDLIB_PATH` for these processes;
leave it empty to use the installed distribution's default. CLI arguments are
passed directly to the executable, so file and installation paths are not
interpolated into a shell command. Restart the language server after changing
its executable or stdlib setting.

The second client's Rust-ism detector is still under review. Its blanket semicolon warning must not be carried over as a
language rule. Its syntax snippets and epistemic UI also require explicit
reconciliation before this preview replaces either in-tree extension.

### Compiler diagnostics

Check File saves a modified document before checking it. Check-on-save uses
`sounio.checkOnSave` and works without LSP. Both invoke the selected compiler
directly. Diagnostic parsing supports located compiler messages; process
failures without a recognized diagnostic appear as a file-level error, with
details in the Sounio Check output channel. Checks have a 60-second limit.
Results from older document versions are discarded, and outstanding processes
are cancelled when replaced or when their document closes.

### Snippet migration

The templates from both clients are retained. Identical bodies share one
entry and keep their trigger aliases. Different bodies that used the same
trigger are offered under `-alt` (for example `fn-alt`), avoiding ambiguous
completion entries with the same trigger. The full mapping is recorded in
`docs/snippet-reconciliation.json` at the repository root. These templates
include experimental language features; their presence is not a capability
claim for the installed compiler. In particular, a measurement template does
not validate a scientific uncertainty model.
