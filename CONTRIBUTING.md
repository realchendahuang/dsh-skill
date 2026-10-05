# Contributing to dsh-skill

Thank you for your interest in improving `dsh-skill`! We welcome contributions to architectural references, playbooks, templates, and tooling.

## Code of Conduct

Please be respectful, collaborative, and considerate of others. Focus on technical facts, clear mechanisms, and clean engineering practices.

## Development Workflow

### Prerequisites
- Node.js `>= 20.0.0`
- `pnpm` `>= 9.0.0`
- `git`

### Setup
```bash
git clone https://github.com/realchendahuang/dsh-skill.git
cd dsh-skill
pnpm install
```

### Verification
Run tests and type checks before submitting a Pull Request:
```bash
pnpm verify
```

## Adding or Updating Documentation

- **References (`references/`)**:
  Must be grounded in actual `deepseek-ai/deepseek-harness` source code and official behaviors. Do not invent non-existent APIs or speculative features.
- **Playbooks (`playbooks/`)**:
  Step-by-step procedures must be verified and reproducible. Always enforce isolated development in `.dsh-dev`.
- **Templates (`templates/`)**:
  Must be minimal, self-contained, and valid TypeScript.

## Submitting Pull Requests

1. Fork the repository and create your branch from `main`.
2. Ensure your changes pass `pnpm verify`.
3. Keep commit messages clear, preferably following conventional commits (e.g. `feat: ...`, `fix: ...`, `docs: ...`).
4. Submit your pull request with a summary of the changes and motivation.
