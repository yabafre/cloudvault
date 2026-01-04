# ☁️ CloudVault

**CloudVault** est une plateforme de stockage et de partage de fichiers sécurisée, construite avec une stack moderne TypeScript et déployée sur AWS. Ce projet démontre une architecture cloud complète avec CI/CD, monitoring et bonnes pratiques DevOps.

## 🎯 Objectifs du projet

- Maîtriser les services AWS (S3, Lambda, EC2)
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
- AWS S3 (stockage fichiers)
- AWS Lambda (traitement asynchrone Python)
- AWS EC2 (hébergement API)
- PostgreSQL (base de données)
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

### Production (EC2)

```
# Voir infra/scripts/deploy.sh
./infra/scripts/deploy.sh
```

## 🔐 Sécurité

- Authentification JWT
- Hash bcrypt pour mots de passe
- URL S3 pré-signées (expiration 15min)
- CORS configuré
- Variables d'environnement sécurisées
- Cloudflare WAF actif

## 📊 Monitoring

- Logs CloudWatch (Lambda)
- Healthcheck endpoint `/health`
- Métriques système (CPU, RAM, disque)

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
```

***