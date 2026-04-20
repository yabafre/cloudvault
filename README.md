# ☁️ CloudVault

**CloudVault** est une plateforme de stockage et de partage de fichiers sécurisée, construite avec une stack moderne TypeScript et déployée sur AWS. Ce projet démontre une architecture cloud complète avec CI/CD, monitoring et bonnes pratiques DevOps.

## 🎯 Objectifs du projet

- Maîtriser les services AWS (S3, Lambda, ECS Fargate)
- Implémenter une stack TypeScript moderne (NestJS + Next.js)
- Gérer un monorepo avec Turborepo et pnpm
- Mettre en place un pipeline CI/CD professionnel
- Intégrer Cloudflare pour CDN et sécurité
- Développer des Lambda Python pour traitement asynchrone
- Appliquer les bonnes pratiques DevOps (Docker, monitoring, tests)

## 🏗️ Architecture

### Stack technique

**Backend**
- NestJS (TypeScript)
- Prisma ORM
- PostgreSQL
- JWT Authentication
- AWS SDK (S3)

**Frontend**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

**Infrastructure**
- AWS S3 eu-west-3 (stockage fichiers, SSE-S3, pre-signed POST)
- AWS Lambda (traitement asynchrone Python — thumbnails Pillow)
- AWS ECS Fargate eu-west-3 (hébergement API NestJS)
- PostgreSQL (Neon EU, via Prisma 7)
- Cloudflare (DNS, CDN, WAF)
- Docker & Docker Compose

**DevOps**
- Turborepo (monorepo)
- pnpm (package manager)
- GitHub Actions (CI/CD)
- Nginx (reverse proxy)
- CloudWatch (logs & monitoring)

## 📁 Structure du projet

```
cloudvault/
├── apps/
│   ├── api/              # Backend NestJS
│   └── web/              # Frontend Next.js
├── packages/
│   └── types/            # Types TypeScript partagés
├── lambdas/
│   └── thumbnail-generator/  # Lambda Python
├── infra/                # Configuration infrastructure
└── .github/workflows/    # CI/CD
```

## 🚀 Démarrage rapide

### Prérequis

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose
- PostgreSQL (local ou Docker)
- Compte AWS configuré

### Installation

```
# Cloner le repo
git clone https://github.com/votre-username/cloudvault.git
cd cloudvault

# Installer les dépendances
pnpm install

# Configuration environnement
cp .env.example .env

# Configurer la base de données
pnpm db:generate
pnpm db:migrate

# Lancer en mode développement
pnpm dev
```

L'API sera accessible sur `http://localhost:4000`  
Le frontend sur `http://localhost:3000`

## 🔧 Commandes disponibles

```
# Développement
pnpm dev              # Lance tous les services en mode watch

# Build
pnpm build            # Build tous les packages

# Tests
pnpm test             # Lance tous les tests

# Lint
pnpm lint             # Vérifie le code

# Format
pnpm format           # Formate le code avec Prettier

# Prisma
pnpm db:generate  # Génère le client Prisma
pnpm db:migrate   # Crée une migration
pnpm db:studio    # Interface GUI base de données
```

## 📦 Fonctionnalités

### MVP v1.0

- [x] Authentification utilisateur (register/login)
- [ ] Upload de fichiers vers S3 avec URL pré-signée
- [ ] Liste des fichiers utilisateur
- [ ] Suppression de fichiers
- [ ] Génération automatique de thumbnails (Lambda Python)
- [ ] Dashboard utilisateur

### Roadmap v2.0

- [ ] Partage de fichiers (liens publics/privés)
- [ ] Organisation par dossiers
- [ ] Statistiques d'utilisation
- [ ] Gestion des quotas
- [ ] Worker Lambda de nettoyage automatique
- [ ] Métriques et alertes avancées

## 🐳 Déploiement

### Développement local

```
docker-compose -f infra/docker-compose.yml up -d
pnpm dev
```

### Production (ECS Fargate eu-west-3)

Le déploiement passe par GitHub Actions (`.github/workflows/deploy.yml`) :

- trigger : succès CI sur `main` ou `workflow_dispatch` depuis `main` uniquement
- gate : environnement GitHub `production` (approbation manuelle obligatoire)
- auth : OIDC vers AWS via `aws-actions/configure-aws-credentials` (SHA-pinned, aucune clé IAM long-lived)
- 3 jobs parallèles : `deploy-infra` (CDK), `deploy-api` (Fargate), `deploy-lambda`

Le bootstrap du provider OIDC + rôle IAM est suivi dans KON-88 (story 1-7).

## 🔐 Sécurité

- Authentification JWT
- Hash argon2id (`@node-rs/argon2`) pour mots de passe
- URL S3 pré-signées (expiration 15min)
- CORS configuré
- Variables d'environnement sécurisées
- Cloudflare WAF actif

## 📊 Monitoring

- Logs CloudWatch (Lambda)
- Healthcheck endpoint `/health`
- Métriques système (CPU, RAM, disque)

## ⚙️ CI/CD

Le repository utilise **GitHub Actions** avec authentification OIDC vers AWS.

### Workflows

- **`.github/workflows/ci.yml`** — déclenché sur chaque pull request et push sur `main`. Exécute `pnpm lint`, `pnpm test`, `pnpm build`, upload la couverture, et lint les workflows avec `actionlint`.
- **`.github/workflows/deploy.yml`** — déclenché après succès de CI sur `main` ou via `workflow_dispatch`. Contient trois jobs (`deploy-infra`, `deploy-api`, `deploy-lambda`) derrière l'environnement `production` (approbation manuelle GitHub).
- **`.github/actions/setup-monorepo`** — composite action partagée : pnpm 9 (depuis `packageManager` du `package.json`), Node (depuis `engines.node`), install, `prisma generate`. Toutes les actions tierces sont SHA-pinned.

### Repository secrets requis

| Secret | Statut | Usage |
|---|---|---|
| `AWS_ROLE_TO_ASSUME` | **requis** | ARN du rôle IAM assumé via OIDC par les jobs `deploy-*` |
| `TURBO_TOKEN` | optionnel | Active le cache distant Turborepo (fallback local sans lui) |
| `TURBO_TEAM` | optionnel | Team slug Turborepo (paire avec `TURBO_TOKEN`) |
| `VERCEL_TOKEN` | futur | Réservé pour le futur job de déploiement Vercel (frontend) |

> **Permissions requises côté job.** Chaque job `deploy-*` doit déclarer `permissions: { id-token: write, contents: read }` pour que l'échange de token OIDC fonctionne. Déjà configuré dans `deploy.yml` — à préserver dans tout nouveau job de déploiement.
>
> **Required reviewers.** L'environnement GitHub `production` DOIT être configuré avec au moins un required reviewer (Settings → Environments → production). Sans reviewers, `workflow_dispatch` devient une porte ouverte sur la prod.

### Politique de credentials AWS

**Ne créez jamais de clés IAM long-lived** (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) pour CI. L'authentification est **OIDC-only** :

1. Le provider OIDC GitHub est enregistré dans le compte AWS (`https://token.actions.githubusercontent.com`).
2. Un rôle IAM avec trust policy restreinte à `repo:<org>/CloudVault-official:ref:refs/heads/main` et `repo:<org>/CloudVault-official:environment:production`.
3. L'ARN du rôle est exposé via le secret `AWS_ROLE_TO_ASSUME`.

Le bootstrap du provider OIDC et du rôle IAM est suivi dans KON-88 (story 1-7 AWS CDK stacks).

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 Licence

MIT

## 👤 Auteur

**Frédéric Yaba**
- GitHub: [@yabafre](https://github.com/yabafre)
- LinkedIn: [Frédéric Yaba](https://linkedin.com/in/frederic-y-322597185)

---

⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile !
