# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-10-06

### Fixed
- **`dsh-skill uninstall` crashed**: `rmSync` was used without being imported, raising a `ReferenceError` on every uninstall. Added isolated-HOME regression tests covering `uninstall` and `update`.
- **Missing type declarations**: `package.json` pointed `types` at `./dist/index.d.ts`, but the build never emitted it. `npm run build` now runs `tsc --emitDeclarationOnly` after esbuild (also fixed in scaffolding output and templates).
- **Broken CI & Release pipelines**: `setup-node`'s pnpm cache failed with "packages field missing or empty" because `pnpm-workspace.yaml` lacked a `packages` field — every push since v0.2.0 was red. Added the field plus the missing `@types/node` devDependency so `pnpm run typecheck` passes again.

### Changed
- CI now runs on Windows in addition to Ubuntu/macOS, and installs with `--frozen-lockfile`.
- Release workflow runs full `verify` before creating the GitHub Release, and publishes to npm with provenance when the `NPM_TOKEN` secret is configured (skips otherwise).
- `install.sh` / `install.ps1` pin to the latest GitHub release tag instead of the mutable `main` branch; override with `DSH_SKILL_VERSION`.
- CLI hardening: Windows installs now also create a `dsh-skill.cmd` shim; install/update failures propagate to the exit code; unknown commands exit non-zero; `init` validates plugin names and fails gracefully on missing templates; `check` matches a real `apply()` export pattern; ANSI colors respect `NO_COLOR` and non-TTY output; `update` removes stale files from previous installs; added `--version`.

## [0.2.0] - 2026-10-05

### Added
- **Zero-Dependency One-Line Installers**:
  - `install.sh`: POSIX shell installer for macOS, Linux, and WSL via `curl -fsSL https://raw.githubusercontent.com/realchendahuang/dsh-skill/main/install.sh | bash`.
  - `install.ps1`: Native PowerShell installer for Windows via `irm https://raw.githubusercontent.com/realchendahuang/dsh-skill/main/install.ps1 | iex`.
  - Automatic injection of executable CLI shim `dsh-skill` into user's `~/.local/bin`.
- **Multi-Template Scaffolding**:
  - `dsh-skill init <name> [--type tool|hook|skill]` for instant bootstrapping of tools, hooks, or skill bundles.
- **CLI Lifecycle Management**:
  - `dsh-skill update`: Refresh installed skills and CLI across all platforms.
  - `dsh-skill uninstall`: Cleanly remove skill files and unbind the CLI shim.
- **8-Stage Compliance Check**:
  - Upgraded `dsh-skill check` with automated diagnostics for `tsconfig.json` and build bundling externalization.
- **Visual Architecture Blueprint**:
  - Added interactive Mermaid 3-tier architectural flow diagram in bilingual documentation.

## [0.1.0] - 2026-10-05

### Added
- **Core Skill Definition (`SKILL.md`)**:
  - Full operational guide and decision tree for AI coding assistants (Claude Code, Codex, Antigravity, Cursor, and DSH).
  - Standardized task routing across scaffolding, tool development, hooks, isolated testing, and verification.
- **Official Architectural References (`references/`)**:
  - `cordis-runtime.md`: Cordis microkernel lifecycle, service injection (`apply`), and Scoped Context rules.
  - `tools-contract.md`: `defineTool` specifications, parameter schemas, pure-function UI presentation cards, and cooperative cancellation (`exec.signal`).
  - `execution-pipeline.md`: 5-stage tool execution pipeline (`tools/pre-execute`, guards, `tools/execute`, `tools/post-execute`, `tools/result`).
  - `skills-subsystem.md`: 6-rank discovery hierarchy, directory bundle conventions, and dynamic digest invalidation.
  - `ui-and-events.md`: `session/event` event bus, token streaming (`assistant/chunk`), and steering controls (`followup`, `steer`, `inject`).
  - `packaging-rules.md`: Mandatory externalization rules for `@deepseek-ai/*` dependencies and dual Host/Client runtimes.
  - `plugin-testing.md`: Unit testing DSH plugins with context mocking and signal tests.
  - `presets-and-subagents.md`: Extending custom Presets and Subagent execution providers.
- **Agent Standard Playbooks (`playbooks/`)**:
  - `01-scaffolding.md`: Step-by-step project scaffolding with esbuild and TypeScript.
  - `02-tool-plugin.md`: Production-grade tool plugin implementation.
  - `03-hook-plugin.md`: Safety gates and execution interceptors.
  - `04-isolated-dev.md`: Safe `.dsh-dev` isolated local testing SOP.
  - `05-verification.md`: Quality gates, build artifact inspection, and pack verification.
- **Ready-to-Use Templates (`templates/`)**:
  - Minimal boilerplate for tool plugins, hook plugins, and skill bundles.
- **Hybrid Runtime & CLI Tooling**:
  - DSH Cordis plugin entry (`src/index.ts`) for dynamic skill registration.
  - Native `dsh.bundle` manifest and `cordis.patch.yml` compatibility for `dsh plugin add`.
  - Cross-platform CLI (`bin/dsh-skill.mjs`):
    - `install`: One-command installation to DSH, Claude Code, Codex, and Antigravity.
    - `status`: Live installation auditing across platforms.
    - `init`: Automated scaffolding of compliant DSH plugins from templates.
    - `check`: Automated linter verifying DSH rules, externalized dependencies, and patch manifests.
- **Repository Governance & Bilingual Docs**:
  - Comprehensive GitHub Actions workflows for continuous integration and automated releases.
  - Bug report and feature request issue templates.
  - Contributing guidelines (`CONTRIBUTING.md`) and Security policy (`SECURITY.md`).
  - Bilingual documentation with dedicated `README.en.md`.
