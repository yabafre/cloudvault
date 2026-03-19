# Claude Code Configuration

Documentation et configuration de Claude Code pour le projet CloudVault.

## Structure

```
.claude/
|-- settings.json           # Configuration projet (hooks, permissions)
|-- settings.local.json     # Overrides personnels (gitignored)
|-- session-context.txt     # Contexte injecte au demarrage
|
|-- skills/                 # Auto-actives par Claude (structure officielle)
|   |-- code-security/
|   |   |-- SKILL.md            # Overview + activation
|   |   |-- references/
|   |   |   +-- owasp-checklist.md
|   |   +-- examples/
|   |       +-- secure-endpoint.example.ts
|   |-- prisma-expert/
|   |   |-- SKILL.md
|   |   |-- references/
|   |   |   +-- query-patterns.md
|   |   +-- examples/
|   |       |-- schema.example.prisma
|   |       +-- file-service.example.ts
|   |-- nestjs-patterns/
|   |   |-- SKILL.md
|   |   |-- references/
|   |   |   +-- module-architecture.md
|   |   +-- examples/
|   |       |-- controller.example.ts
|   |       +-- service.example.ts
|   +-- nextjs-patterns/
|       |-- SKILL.md
|       |-- references/
|       |   |-- hooks-first-architecture.md
|       |   +-- zsa-patterns.md
|       +-- examples/
|           |-- use-features.example.ts
|           |-- use-create-feature.example.ts
|           |-- use-delete-feature.example.ts
|           |-- feature-page.example.tsx
|           +-- feature-list.example.tsx
|
|-- commands/               # Slash commands manuels
|   |-- project/            # /status, /context-stats
|   |-- workflow/           # /feature, /commit, /review
|   |-- generation/         # /crud, /test-gen, /docs
|   +-- audit/              # /secure, /analyze, /adr, /spec
|
|-- agents/                 # Sub-agents specialises
|   |-- core/               # orchestrator, code-reviewer, debugger
|   |-- design/             # pm-spec, architect, data-modeler
|   |-- implementation/     # api-designer, frontend-expert, mobile-specialist
|   |-- quality/            # test-engineer, security-auditor, performance-optimizer, docs-writer
|   +-- devops/             # devops-engineer
|
+-- hooks/scripts/          # Scripts bash pour les hooks
    |-- session-start.sh    # Initialisation session
    |-- protect-files.sh    # Bloque fichiers sensibles
    |-- detect-secrets.sh   # Detecte secrets hardcodes
    |-- validate-commit.sh  # Valide conventional commits
    |-- format-code.sh      # Auto-format (Prettier, etc.)
    |-- audit-log.sh        # Log modifications fichiers
    |-- notify.sh           # Notifications desktop
    |-- on-stop.sh          # Fin de session
    +-- on-subagent-stop.sh # Fin sub-agent

docs/claude/
|-- README.md               # Ce fichier
|-- context/                # Contexte projet
|   +-- architecture.md     # Vue d'ensemble architecture
|-- decisions/              # Architecture Decision Records
|   +-- ADR-*.md
|-- working-notes/          # Specifications features
|   +-- {feature}.md
|-- metrics/                # Metriques usage
|   |-- features.json       # Features completees
|   |-- costs.json          # Couts estimes
|   +-- file-changes.json   # Historique modifications
+-- templates/              # Templates documents
    |-- adr.md
    +-- feature-spec.md

scripts/claude/             # Scripts utilitaires bash
|-- track-feature.sh        # Tracker une feature completee
|-- update-context.sh       # Mettre a jour le contexte architecture
+-- generate-report.sh      # Generer rapport usage

enhancements/
+-- _queue.json             # Etat pipeline features
```

## Skills vs Commands vs Agents

| Type | Activation | Utilisation |
|------|------------|-------------|
| **Skills** | Auto (Claude decide) | Expertise contextuelle |
| **Commands** | Manuel (`/command`) | Workflows templates |
| **Agents** | Via Task tool | Taches specialisees longues |

## Structure Officielle des Skills

Chaque skill suit la structure officielle Claude Code:

```
skill-name/
|-- SKILL.md              # (Required) Overview et regles d'activation
|-- references/           # Documentation detaillee (chargee a la demande)
|   +-- detailed-guide.md
+-- examples/             # Exemples de code (charges a la demande)
    +-- working-example.ts
```

### Progressive Disclosure
- **SKILL.md** = Ce que Claude voit immediatement quand le skill s'active
- **references/** = Documentation detaillee chargee quand necessaire
- **examples/** = Exemples de code charges pour implementation

### Skills Disponibles

| Skill | Description | References | Examples |
|-------|-------------|------------|----------|
| **nextjs-patterns** | Architecture Hooks-First Next.js 16+ | hooks-first-architecture.md, zsa-patterns.md | 5 exemples (hooks, pages, composants) |
| **prisma-expert** | Prisma ORM patterns | query-patterns.md | schema, service |
| **nestjs-patterns** | NestJS module architecture | module-architecture.md | controller, service |
| **code-security** | OWASP Top 10 audit | owasp-checklist.md | secure-endpoint |

## Slash Commands Disponibles

### Project
| Commande | Description |
|----------|-------------|
| `/status` | Dashboard sante projet |
| `/context-stats` | Statistiques contexte et couts |

### Workflow
| Commande | Description |
|----------|-------------|
| `/feature {slug}` | Pipeline feature complet (11 phases) |
| `/commit` | Helper conventional commits |
| `/review [path]` | Code review rapide |

### Generation
| Commande | Description |
|----------|-------------|
| `/crud {entity}` | Genere module CRUD complet |
| `/test-gen {path}` | Genere tests pour un fichier |
| `/docs {path}` | Genere documentation |

### Audit
| Commande | Description |
|----------|-------------|
| `/secure [path]` | Audit securite OWASP |
| `/analyze {issue}` | Analyse probleme et recommandations |
| `/adr {slug}` | Cree un ADR |
| `/spec {feature}` | Cree specification feature |

## Hooks Configuration

Les hooks utilisent des **scripts bash externes** via `$CLAUDE_PROJECT_DIR`:

### PreToolUse (Edit|Write)
- **protect-files.sh**: Bloque `.env`, `.git/`, `secrets/`, `*.pem`, `*.key`
- **detect-secrets.sh**: Detecte API keys, passwords, tokens hardcodes

### PreToolUse (Bash)
- **validate-commit.sh**: Valide format conventional commits

### PostToolUse (Edit|Write)
- **format-code.sh**: Formatte automatiquement (Prettier, ESLint, etc.)
- **audit-log.sh**: Log toutes les modifications de fichiers

### Notification
- **notify.sh**: Notifications desktop (macOS/Linux)

### Stop / SubagentStop
- **on-stop.sh**: Actions de fin de session
- **on-subagent-stop.sh**: Guide vers prochaine etape pipeline

### Permissions

**Allow** (automatique):
- Read, Write, Edit, Glob, Grep
- Bash: pnpm, npm, git (read), prisma, node, tsx, prettier, eslint

**Ask** (confirmation requise):
- Bash: git push/merge/rebase/reset, docker, rm, curl, wget

**Deny** (bloque):
- Edit/Write sur `.env`, `.git/`, secrets, *.pem, *.key
- Bash: rm -rf /, sudo, chmod 777, eval

## Feature Pipeline

Le pipeline `/feature` orchestre 11 phases:

```
1. SPEC         -> pm-spec agent
2. ARCHITECTURE -> architect agent
3. DATA-MODEL   -> data-modeler agent
4. BACKEND      -> api-designer agent
5. FRONTEND     -> frontend-expert agent
6. MOBILE       -> mobile-specialist agent (si applicable)
7. TESTS        -> test-engineer agent
8. SECURITY     -> security-auditor agent
9. PERFORMANCE  -> performance-optimizer agent
10. REVIEW      -> code-reviewer agent
11. DOCS        -> docs-writer agent
```

Etat suivi dans `enhancements/_queue.json`.

## Scripts Utilitaires

```bash
# Tracker une feature completee
./scripts/claude/track-feature.sh auth-2fa --tokens=5000 --files-created=10

# Mettre a jour le contexte architecture
./scripts/claude/update-context.sh auth-2fa

# Generer rapport usage
./scripts/claude/generate-report.sh --format=md
```

## StatusLine

Affiche des metriques en temps reel en bas du terminal via [ccstatusline](https://github.com/sirmalloc/ccstatusline):

```json
"statusLine": {
  "type": "command",
  "command": "bunx ccstatusline@latest"
}
```

**Widgets disponibles:**
- Model Name, Git Branch, Git Changes
- Session Clock, Session Cost, Block Timer
- Tokens (Input, Output, Cached, Total)
- Context Percentage, Context Length

**Personnaliser:**
```bash
bunx ccstatusline@latest
```
Lance une TUI interactive pour configurer les widgets.

## MCP Servers

Configure dans `.mcp.json`:
- **context7** - Documentation librairies a jour
- **sequential-thinking** - Raisonnement structure
- **memory** - Knowledge graph persistant
- **fast-filesystem** - Operations fichiers optimisees
- **github** - API GitHub integration

## Skills Auto-Actives

### code-security
- Scan vulnerabilites OWASP Top 10
- Detection secrets hardcodes
- Validation input/output

### prisma-expert
- Schema design patterns
- Migrations strategies
- Performance optimisation queries

### nestjs-patterns
- Module architecture
- Guards, Decorators, Pipes
- Testing patterns

### nextjs-patterns (Hooks-First Architecture)
- Server Components par defaut
- Custom hooks pour logique metier
- ZSA Server Actions
- Limites strictes: Page <40 lignes, Component <80, Hook <60

## Templates

### ADR (Architecture Decision Record)
`docs/claude/templates/adr.md`
- Status, Contexte, Decision
- Consequences (positives, negatives, risques)
- Alternatives considerees
- Implementation (data model, API, frontend)

### Feature Spec
`docs/claude/templates/feature-spec.md`
- Metadonnees (status, priorite, estimation)
- User Stories avec criteres d'acceptation
- Edge cases
- Impact technique
- Questions bloquantes

## Configuration Locale

Creer `.claude/settings.local.json` pour overrides personnels:
```json
{
  "permissions": {
    "allow": ["Bash(docker:*)"]
  }
}
```

Ce fichier est gitignored.
