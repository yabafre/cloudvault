# Documentation Index

Index de toute la documentation Claude Code pour CloudVault.

## Quick Links

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Vue d'ensemble configuration |
| [context/architecture.md](./context/architecture.md) | Architecture systeme |

## Architecture Decision Records (ADRs)

| ADR | Status | Description |
|-----|--------|-------------|
| [ADR-001](./decisions/ADR-001-prisma-integration.md) | ACCEPTED | Integration Prisma ORM |
| [ADR-002](./decisions/ADR-002-frontend-auth-architecture.md) | ACCEPTED | Architecture Auth Frontend |

## Working Notes (Specs en cours)

| Feature | Status | Description |
|---------|--------|-------------|
| [prisma-setup](./working-notes/prisma-setup.md) | DONE | Setup Prisma ORM |
| [auth-jwt-system](./working-notes/auth-jwt-system.md) | DONE | Systeme JWT Backend |
| [frontend-auth-system](./working-notes/frontend-auth-system.md) | IN_PROGRESS | Auth Frontend |

## Templates

| Template | Usage |
|----------|-------|
| [adr.md](./templates/adr.md) | Creer un nouvel ADR |
| [feature-spec.md](./templates/feature-spec.md) | Creer une spec feature |

## Metrics

| Fichier | Contenu |
|---------|---------|
| [features.json](./metrics/features.json) | Features completees |
| [costs.json](./metrics/costs.json) | Couts estimes par feature |
| [file-changes.json](./metrics/file-changes.json) | Historique modifications |

## Structure des fichiers

```
docs/claude/
├── INDEX.md              # Ce fichier
├── README.md             # Configuration Claude Code
├── context/
│   └── architecture.md   # Vue architecture systeme
├── decisions/
│   ├── ADR-001-*.md     # ADRs numerotes
│   └── ADR-002-*.md
├── working-notes/
│   ├── {feature}.md     # Specs en cours
│   └── ...
├── metrics/
│   ├── features.json    # Features completees
│   ├── costs.json       # Couts estimes
│   └── file-changes.json
└── templates/
    ├── adr.md           # Template ADR
    └── feature-spec.md  # Template spec
```

## Liens vers .claude/

### Agents (avec templates)

| Agent | Templates |
|-------|-----------|
| frontend-expert | [nextjs-feature-structure.md](../../.claude/agents/implementation/templates/nextjs-feature-structure.md) |
| api-designer | [nestjs-module-structure.md](../../.claude/agents/implementation/templates/nestjs-module-structure.md) |
| devops-engineer | [ci-cd-workflows.md](../../.claude/agents/devops/templates/ci-cd-workflows.md) |
| test-engineer | [testing-patterns.md](../../.claude/agents/quality/templates/testing-patterns.md) |
| security-auditor | [security-checklist.md](../../.claude/agents/quality/templates/security-checklist.md) |

### Skills

| Skill | Description |
|-------|-------------|
| [nextjs-patterns](../../.claude/skills/nextjs-patterns/SKILL.md) | Architecture Hooks-First |
| [nestjs-patterns](../../.claude/skills/nestjs-patterns/SKILL.md) | NestJS patterns |
| [prisma-expert](../../.claude/skills/prisma-expert/SKILL.md) | Prisma ORM |
| [code-security](../../.claude/skills/code-security/SKILL.md) | OWASP security |

### Commands

| Category | Commands |
|----------|----------|
| Project | `/status`, `/context-stats` |
| Workflow | `/feature`, `/commit`, `/review` |
| Generation | `/crud`, `/test-gen`, `/docs` |
| Audit | `/analyze`, `/secure`, `/adr`, `/spec` |

## Convention de nommage

### ADRs
Format: `ADR-{NNN}-{slug}.md`
- NNN = numero incremental (001, 002, ...)
- slug = nom-en-kebab-case

### Working Notes
Format: `{feature-slug}.md`
- Utiliser kebab-case
- Correspondance avec le slug dans `enhancements/_queue.json`

### Metrics
- `features.json` - Array de features completees
- `costs.json` - Object avec totaux et par feature
- `file-changes.json` - Historique des modifications
