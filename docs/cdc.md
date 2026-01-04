# CAHIER_DES_CHARGES.md

# 📋 Cahier des Charges - CloudVault

**Version:** 1.0  
**Date:** 17 décembre 2025  
**Auteur:** Frédéric Yaba  
**Statut:** En développement

---

## 1. Présentation du projet

### 1.1 Contexte

**CloudVault** est un projet personnel visant à démontrer une maîtrise complète de la stack JavaScript/TypeScript moderne et des services cloud AWS. Il sert de projet portfolio pour valider des compétences en architecture fullstack, DevOps et cloud computing.

### 1.2 Objectifs généraux

- Construire une plateforme de stockage de fichiers sécurisée et scalable
- Démontrer l'expertise sur AWS (S3, Lambda, EC2), Cloudflare et TypeScript
- Mettre en œuvre des pratiques DevOps professionnelles (CI/CD, monitoring, IaC)
- Créer un projet open-source réutilisable et documenté

### 1.3 Périmètre

**Inclus:**
- Authentification et gestion utilisateurs
- Upload/download de fichiers via S3
- Génération automatique de thumbnails
- Interface web responsive
- API REST sécurisée
- Déploiement automatisé
- Monitoring basique

**Exclus (phase 1):**
- Partage de fichiers entre utilisateurs
- Paiements et abonnements
- Application mobile native
- Éditeur de fichiers en ligne
- Versionning de fichiers

---

## 2. Spécifications fonctionnelles

### 2.1 Gestion des utilisateurs

**US-01: Inscription**
- Un visiteur peut créer un compte avec email/mot de passe
- Email doit être unique et valide
- Mot de passe min 8 caractères
- Création automatique d'un profil utilisateur

**US-02: Connexion**
- Un utilisateur peut se connecter avec email/mot de passe
- Génération d'un JWT valide 7 jours
- Redirection vers le dashboard après connexion

**US-03: Déconnexion**
- Un utilisateur connecté peut se déconnecter
- Suppression du token côté client

### 2.2 Gestion des fichiers

**US-04: Upload de fichier**
- Un utilisateur connecté peut uploader des fichiers (images, PDF)
- Taille max: 10 MB par fichier
- Formats acceptés: JPG, PNG, PDF, WEBP
- Upload direct vers S3 via URL pré-signée (pas de transit par le serveur)
- Enregistrement des métadonnées en base de données

**US-05: Liste des fichiers**
- Un utilisateur voit la liste de ses fichiers uploadés
- Affichage: nom, type, taille, date d'upload, thumbnail (si image)
- Pagination (20 fichiers par page)

**US-06: Suppression de fichier**
- Un utilisateur peut supprimer ses propres fichiers
- Suppression en base + suppression S3
- Confirmation avant suppression

**US-07: Génération de thumbnail**
- Pour chaque image uploadée, génération automatique d'un thumbnail 200x200px
- Traitement asynchrone via Lambda Python
- Stockage thumbnail dans S3 sous `thumbnails/`

### 2.3 Dashboard

**US-08: Dashboard utilisateur**
- Statistiques:
  - Nombre total de fichiers
  - Espace utilisé
  - Dernier upload
- Interface de drag & drop pour upload
- Liste des fichiers récents

---

## 3. Spécifications techniques

### 3.1 Architecture système

**Type:** Architecture microservices découplée

**Composants:**

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Frontend | Next.js 16 + React 19 | Interface utilisateur |
| Backend API | NestJS + Prisma | Logique métier + accès données |
| Base de données | PostgreSQL | Stockage relationnel |
| Stockage fichiers | AWS S3 | Stockage objet |
| Traitement async | AWS Lambda (Python) | Thumbnails |
| CDN/DNS | Cloudflare | Distribution + sécurité |
| Hosting API | AWS EC2 | Serveur applicatif |

### 3.2 Stack technique détaillée

**Backend (apps/api)**
- Framework: NestJS 10+
- Language: TypeScript 5.7
- ORM: Prisma
- Auth: Passport JWT
- Validation: class-validator
- AWS SDK: @aws-sdk/client-s3
- Hash: bcrypt

**Frontend (apps/web)**
- Framework: Next.js 16 (App Router)
- Language: TypeScript 5.7
- UI: Tailwind CSS
- HTTP client: Axios
- State: React hooks natifs

**Lambda (lambdas/thumbnail-generator)**
- Runtime: Python 3.12
- Librairies: boto3, Pillow
- Trigger: S3 ObjectCreated event

**Infrastructure**
- Monorepo: Turborepo
- Package manager: pnpm 9+
- Conteneurisation: Docker
- Reverse proxy: Nginx
- CI/CD: GitHub Actions

### 3.3 Base de données

**Modèle de données (Prisma schema)**

```
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // hash bcrypt
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  files     File[]
}

model File {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(...)
  filename     String   // nom unique généré
  originalName String   // nom d'origine
  mimeType     String
  size         Int      // octets
  s3Key        String   @unique
  s3Url        String
  thumbnailKey String?
  thumbnailUrl String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### 3.4 API REST

**Base URL:** `https://api.cloudvault.com`

**Endpoints:**

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /auth/register | Non | Créer un compte |
| POST | /auth/login | Non | Se connecter |
| GET | /auth/me | Oui | Profil utilisateur |
| POST | /files/upload-url | Oui | Obtenir URL S3 pré-signée |
| GET | /files | Oui | Liste fichiers (pagination) |
| DELETE | /files/:id | Oui | Supprimer un fichier |
| GET | /health | Non | Healthcheck |

**Format de réponse:**
```
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Codes HTTP:**
- 200: Succès
- 201: Créé
- 400: Requête invalide
- 401: Non authentifié
- 403: Non autorisé
- 404: Non trouvé
- 500: Erreur serveur

### 3.5 Sécurité

**Authentification:**
- JWT signé avec secret fort (256 bits min)
- Expiration: 7 jours
- Transmission via header `Authorization: Bearer <token>`

**Mots de passe:**
- Hash: bcrypt (salt rounds: 10)
- Validation: min 8 caractères

**S3:**
- Bucket privé (pas d'accès public)
- URL pré-signées avec expiration 15 minutes
- CORS configuré pour origine frontend uniquement

**API:**
- Rate limiting: 100 req/min par IP
- Validation des entrées (DTO)
- Sanitization des données
- HTTPS obligatoire en production

**Cloudflare:**
- WAF activé
- DDoS protection
- SSL/TLS Full (Strict)

### 3.6 Performances

**Objectifs:**
- Temps de réponse API: < 200ms (p95)
- Upload fichier 5MB: < 10s
- Génération thumbnail: < 5s
- Page load frontend: < 2s (LCP)

**Optimisations:**
- Upload direct S3 (bypass serveur)
- Thumbnails lazy-loaded
- Cache Cloudflare (assets statiques)
- Indexes PostgreSQL sur userId, createdAt

---

## 4. Infrastructure et déploiement

### 4.1 Environnements

| Environnement | Usage | Infrastructure |
|---------------|-------|----------------|
| Développement | Local dev | Docker Compose |
| Production | MVP public | AWS EC2 + S3 + Lambda |

### 4.2 Architecture AWS

**Ressources provisionnées:**

- **S3 Bucket:** `cloudvault-files-prod`
  - Région: eu-west-3 (Paris)
  - Versioning: désactivé
  - Lifecycle: fichiers orphelins supprimés après 30 jours

- **EC2 Instance:** `cloudvault-api-prod`
  - Type: t3.micro (2 vCPU, 1 GB RAM)
  - AMI: Ubuntu 24.04 LTS
  - Security Group: ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
  - Elastic IP: oui

- **Lambda Function:** `thumbnail-generator`
  - Runtime: Python 3.12
  - Memory: 512 MB
  - Timeout: 30s
  - Trigger: S3 ObjectCreated (suffixe .jpg, .png, .webp)

- **RDS PostgreSQL:** (optionnel, sinon PostgreSQL sur EC2)
  - Version: 16
  - Instance: db.t3.micro
  - Storage: 20 GB SSD

### 4.3 CI/CD Pipeline

**Outil:** GitHub Actions

**Workflow CI (`.github/workflows/ci.yml`):**
1. Checkout code
2. Setup Node + pnpm
3. Install dependencies
4. Lint (ESLint + Prettier)
5. Type check (tsc)
6. Run tests (Jest)
7. Build (Turborepo)

**Workflow CD (`.github/workflows/deploy.yml`):**
1. Trigger: merge sur branche `main`
2. Build Docker images
3. Push vers Docker Hub
4. SSH vers EC2
5. Pull nouvelles images
6. `docker-compose up -d`
7. Run migrations Prisma
8. Health check
9. Notification Slack (optionnel)

### 4.4 Monitoring

**Logs:**
- Lambda: CloudWatch Logs
- EC2: journalctl + CloudWatch Agent (optionnel)

**Métriques:**
- Endpoint `/health` vérifiant:
  - DB connection
  - S3 access
  - Uptime
- CloudWatch metrics basiques (CPU, network, disk)

**Alertes:**
- Lambda errors > 5/min
- API health check failure > 3 consécutifs

---

## 5. Plan de développement

### Phase 1 - Setup & Core (Semaine 1-2)

**Livrables:**
- ✅ Structure monorepo Turborepo
- ✅ Setup NestJS + Next.js
- ✅ Configuration Prisma + PostgreSQL
- ✅ Authentification JWT
- ✅ CRUD utilisateurs

### Phase 2 - Fichiers & S3 (Semaine 3)

**Livrables:**
- ✅ Intégration AWS S3 SDK
- ✅ Génération URL pré-signée
- ✅ Upload fichier depuis frontend
- ✅ Liste/suppression fichiers
- ✅ Métadonnées en DB

### Phase 3 - Lambda & Async (Semaine 4)

**Livrables:**
- ✅ Lambda Python thumbnail generator
- ✅ Configuration S3 trigger
- ✅ Tests Lambda
- ✅ Gestion erreurs async

### Phase 4 - Infrastructure (Semaine 5)

**Livrables:**
- ✅ Dockerfiles API + Web
- ✅ Setup EC2 + Security Groups
- ✅ Configuration Nginx reverse proxy
- ✅ Cloudflare DNS + SSL

### Phase 5 - DevOps (Semaine 6)

**Livrables:**
- ✅ GitHub Actions CI
- ✅ GitHub Actions CD
- ✅ Tests automatisés (Jest)
- ✅ Monitoring basique

### Phase 6 - Polish & Doc (Semaine 7)

**Livrables:**
- ✅ UI/UX amélioré
- ✅ README complet
- ✅ Documentation API (Swagger optionnel)
- ✅ Vidéo démo

---

## 6. Contraintes et risques

### 6.1 Contraintes techniques

- **Budget AWS:** Rester dans le free tier autant que possible
- **Performance:** EC2 t3.micro limitée (1 GB RAM)
- **Scalabilité:** Pas de load balancing en phase 1
- **Quota Lambda:** Max 1000 exécutions concurrentes

### 6.2 Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Dépassement coûts AWS | Moyenne | Moyen | Alertes billing, limits |
| Faille sécurité S3 | Faible | Élevé | IAM minimal, bucket privé |
| Downtime EC2 | Moyenne | Moyen | Health check, backup DB |
| Spam uploads | Moyenne | Moyen | Rate limiting, captcha |

---

## 7. Critères d'acceptation

### MVP validé si:

- [x] Un utilisateur peut créer un compte et se connecter
- [x] Un utilisateur peut uploader une image (< 10MB)
- [x] L'image est stockée sur S3
- [x] Un thumbnail est généré automatiquement en < 10s
- [x] Un utilisateur voit la liste de ses fichiers avec thumbnails
- [x] Un utilisateur peut supprimer un fichier
- [x] L'API répond en < 500ms (p95)
- [x] Le frontend est responsive (mobile + desktop)
- [x] Le code est linté, testé, documenté
- [x] Le déploiement CI/CD fonctionne

---

## 8. Maintenance et évolution

### Support

- Corrections de bugs critiques sous 48h
- Nouvelles features selon roadmap communauté

### Évolutions futures (v2.0)

- Partage de fichiers avec liens expirables
- Organisation par dossiers/tags
- Recherche full-text
- Quotas utilisateur (5 GB gratuit, puis payant)
- Dashboard admin
- API GraphQL
- App mobile React Native

---

## 9. Annexes

### 9.1 Glossaire

- **CDN:** Content Delivery Network
- **CI/CD:** Continuous Integration / Continuous Deployment
- **JWT:** JSON Web Token
- **ORM:** Object-Relational Mapping
- **S3:** Simple Storage Service (AWS)
- **WAF:** Web Application Firewall

### 9.2 Références

- [Documentation NestJS](https://docs.nestjs.com)
- [Documentation Prisma](https://prisma.io/docs)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/s3)
- [Turborepo Handbook](https://turbo.build/repo/docs)

### 9.3 Contact

**Chef de projet:** Frédéric Yaba  
**Email:** fred7927@gmail.com  
**GitHub:** https://github.com/yabafre

---

**Signature:** _Frédéric Yaba_  
**Date:** 17/12/2025
```

***

