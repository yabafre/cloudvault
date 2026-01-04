# prisma-setup - Implementation de Prisma ORM

## Metadonnees

| Attribut | Valeur |
|----------|--------|
| **Feature** | prisma-setup |
| **Status** | COMPLETED |
| **Date debut** | 2025-12-31 |
| **Date fin** | 2025-12-31 |
| **Auteur** | Claude Code Pipeline |
| **ADR** | ADR-001-prisma-integration |

---

## Resume

Implementation complete de Prisma ORM dans l'API NestJS de CloudVault pour la persistance des donnees avec PostgreSQL. Cette feature etablit la couche de base de donnees necessaire pour toutes les fonctionnalites futures (auth, fichiers, partage).

### Objectifs atteints

- [x] Installation et configuration de Prisma 6.x
- [x] Schema de donnees avec modeles User et File
- [x] Service injectable dans l'ecosysteme NestJS
- [x] Scripts npm pour les operations courantes
- [x] Tests unitaires (7 tests passants)
- [x] Documentation mise a jour

---

## Architecture Technique

### Structure des fichiers

```
/ (racine)
├── .env                       # Variables d'environnement (unique, gitignored)
├── .env.example               # Template des variables
├── package.json               # Scripts Prisma centralises

apps/api/
├── prisma/
│   └── schema.prisma          # Schema de base de donnees
├── src/
│   ├── prisma/
│   │   ├── prisma.module.ts   # Module global (@Global)
│   │   ├── prisma.service.ts  # Service injectable
│   │   ├── prisma.service.spec.ts  # Tests unitaires
│   │   └── index.ts           # Barrel export
│   ├── app.module.ts          # Import ConfigModule + PrismaModule
│   └── main.ts                # Bootstrap + Swagger setup
```

### Modeles de donnees

#### User
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hash bcrypt (a implementer)
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  files     File[]   // Relation 1:N

  @@index([email])
  @@map("users")
}
```

#### File
```prisma
model File {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  filename     String
  originalName String
  mimeType     String
  size         Int
  s3Key        String   @unique
  s3Url        String
  thumbnailKey String?
  thumbnailUrl String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([s3Key])
  @@index([createdAt])
  @@map("files")
}
```

### Pattern d'integration NestJS

Le PrismaService etend PrismaClient et implemente les hooks de lifecycle NestJS:

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Le PrismaModule est marque `@Global()` pour etre disponible dans tous les modules sans import explicite.

---

## User Stories Implementees

### US-1: Configuration Prisma
**En tant que** developpeur
**Je veux** Prisma configure dans le projet
**Afin de** pouvoir persister des donnees

**Criteres d'acceptation:**
- [x] Prisma et @prisma/client installes
- [x] Schema prisma avec datasource PostgreSQL
- [x] Client Prisma genere sans erreur

### US-2: Service injectable
**En tant que** developpeur backend
**Je veux** un PrismaService injectable
**Afin de** l'utiliser dans mes services NestJS

**Criteres d'acceptation:**
- [x] PrismaService injectable via DI
- [x] Connexion automatique au demarrage
- [x] Deconnexion propre a l'arret

### US-3: Scripts de developpement
**En tant que** developpeur
**Je veux** des scripts npm pratiques
**Afin de** ne pas retenir les commandes Prisma

**Criteres d'acceptation:**
- [x] `pnpm prisma:generate` fonctionne
- [x] `pnpm prisma:migrate` fonctionne
- [x] `pnpm prisma:studio` fonctionne

---

## Commandes Disponibles

**IMPORTANT:** Toutes les commandes doivent etre executees depuis la racine du monorepo.

| Commande | Description |
|----------|-------------|
| `pnpm prisma:generate` | Genere le client Prisma apres modification du schema |
| `pnpm prisma:migrate` | Cree et applique une migration (dev) |
| `pnpm prisma:migrate:prod` | Deploie les migrations en production |
| `pnpm prisma:studio` | Ouvre l'interface graphique Prisma |
| `pnpm prisma:push` | Pousse le schema sans creer de migration |
| `pnpm prisma:reset` | Reset la base de donnees (supprime tout) |

Les scripts utilisent `dotenv-cli` pour charger le `.env` racine avant d'executer Prisma.

---

## Tests

### Tests unitaires (7/7 PASS)

| Test | Description |
|------|-------------|
| `should be defined` | Verifie que le service est instancie |
| `should extend PrismaClient` | Verifie les methodes user, file, $connect |
| `onModuleInit should call $connect` | Verifie la connexion au demarrage |
| `onModuleDestroy should call $disconnect` | Verifie la deconnexion a l'arret |
| `cleanDatabase should throw in production` | Securite: pas de clean en prod |
| `cleanDatabase should delete records in dev` | Suppression ordonnee (FK) |

### Couverture

```bash
pnpm test:cov  # Executer pour obtenir le rapport
```

---

## Patterns et Bonnes Pratiques

### 1. Global Module Pattern
Le PrismaModule est `@Global()` pour eviter les imports repetitifs:
```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 2. Environment-based Logging
Le logging est conditionnel selon l'environnement:
```typescript
super({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});
```

### 3. Protection Production
La methode `cleanDatabase()` refuse de s'executer en production:
```typescript
if (process.env.NODE_ENV === 'production') {
  throw new Error('Cannot clean database in production');
}
```

### 4. Cascade Delete
Les fichiers sont supprimes automatiquement quand un utilisateur est supprime:
```prisma
user User @relation(..., onDelete: Cascade)
```

---

## Lecons Apprises

### 1. Prisma 7 vs 6
Prisma 7.x a introduit des changements majeurs (prisma.config.ts obligatoire). Pour une meilleure stabilite, nous avons choisi Prisma 6.x qui utilise le format classique avec DATABASE_URL dans le schema.

### 2. Index Strategy
Les index ont ete places sur:
- `User.email` - Lookups d'authentification frequents
- `File.userId` - Requetes de listing par utilisateur
- `File.s3Key` - Unicite et lookups S3
- `File.createdAt` - Tri chronologique

### 3. UUID vs Auto-increment
UUIDs choisis pour:
- Securite (non predictibles)
- Distribution (pas de collision en environnement distribue)
- URLs propres dans l'API REST

---

## Configuration Requise

### Variables d'environnement

Le fichier `.env` est unique et situe a la racine du monorepo:

```env
# /.env (racine)
NODE_ENV=development
API_PORT=4000
DATABASE_URL="postgresql://postgres:password@localhost:5432/cloudvault?schema=public"
```

### PostgreSQL Local

PostgreSQL doit etre installe localement (pas Docker). La base `cloudvault` doit exister:

```bash
# Creer la base de donnees
psql -U postgres -c "CREATE DATABASE cloudvault;"

# Appliquer les migrations
pnpm prisma:migrate
```

### NestJS Configuration

Le module `ConfigModule` de `@nestjs/config` charge le `.env` racine:

```typescript
// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '../../.env',
})
```

### Swagger

La documentation API est disponible a `http://localhost:4000/api/docs` en mode dev.

---

## Prochaines Etapes

1. **Module Auth** - JWT + bcrypt pour hasher les passwords
2. **Module Files** - CRUD fichiers avec S3
3. **Seeding** - Script de donnees de test
4. **Soft Delete** - Ajout d'un champ `deletedAt` pour RGPD

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Prisma Recipe](https://docs.nestjs.com/recipes/prisma)
- [ADR-001: Prisma Integration](../decisions/ADR-001-prisma-integration.md)
- [CLAUDE.md](../../../CLAUDE.md)
