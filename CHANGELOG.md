# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Agent Standard Playbooks (`playbooks/`)**:
  - `01-scaffolding.md`: Step-by-step project scaffolding with esbuild and TypeScript.
  - `02-tool-plugin.md`: Production-grade tool plugin implementation.
  - `03-hook-plugin.md`: Safety gates and execution interceptors.
  - `04-isolated-dev.md`: Safe `.dsh-dev` isolated local testing SOP.
  - `05-verification.md`: Quality gates, build artifact inspection, and pack verification.
- **Ready-to-Use Templates (`templates/`)**:
  - Minimal boilerplate for tool plugins, hook plugins, and skill bundles.
- **Hybrid Runtime Support**:
  - DSH Cordis plugin entry (`src/index.ts`) for dynamic skill registration.
  - Cross-platform CLI installer (`bin/dsh-skill.mjs`) supporting one-command installation to DSH, Claude Code, Codex, and Antigravity.
- **Repository Governance**:
  - Comprehensive GitHub Actions workflows for continuous integration and automated releases.
  - Bug report and feature request issue templates.
  - Contributing guidelines (`CONTRIBUTING.md`) and Security policy (`SECURITY.md`).
