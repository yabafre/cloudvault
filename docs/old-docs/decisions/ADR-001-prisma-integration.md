# ADR-001: Integration de Prisma ORM dans CloudVault API

## Status

**ACCEPTED** - 2025-12-31

## Context

CloudVault necessite une couche de persistance pour stocker:
- Les informations utilisateurs (authentification)
- Les metadonnees des fichiers uploades
- Les relations entre utilisateurs et fichiers
- Les futures fonctionnalites (partage, quotas, etc.)

### Contraintes

- TypeScript strict requis
- Integration NestJS native
- PostgreSQL comme SGBD cible
- Monorepo Turborepo avec pnpm
- Developer Experience prioritaire

### Options evaluees

1. **Prisma** - ORM moderne, schema-first, type-safe
2. **TypeORM** - ORM decorator-based, populaire avec NestJS
3. **MikroORM** - ORM avec Unit of Work pattern
4. **Drizzle** - ORM leger, SQL-like
5. **Raw SQL (pg)** - Pas d'abstraction

## Decision

Nous adoptons **Prisma 6.x** comme ORM pour CloudVault avec:

### 1. Architecture choisie

```
apps/api/
├── prisma/
│   └── schema.prisma    # Source de verite pour le schema
└── src/prisma/
    ├── prisma.module.ts # Module NestJS global
    └── prisma.service.ts # Service injectable
```

### 2. Pattern d'integration

**Global Module Pattern:**
```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Service avec Lifecycle Hooks:**
```typescript
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 3. Schema initial

Deux modeles de base avec relation 1:N:
- **User**: id, email, password, name, timestamps
- **File**: id, metadata, S3 references, userId (FK)

### 4. Strategie de migration

- **Dev**: `prisma migrate dev` (interactive)
- **Prod**: `prisma migrate deploy` (CI/CD)
- **Rollback**: Scripts SQL manuels si necessaire

## Consequences

### Positives

1. **Type Safety** - Types auto-generes depuis le schema, zero drift
2. **Developer Experience** - Prisma Studio, autocomplete excellent
3. **Migrations** - Systeme declaratif avec historique versionne
4. **Performance** - Connection pooling, query optimization
5. **Ecosystem** - Documentation riche, communaute active
6. **NestJS Integration** - Pattern bien documente et teste

### Negatives

1. **Build Step** - `prisma generate` requis apres chaque changement de schema
2. **Bundle Size** - ~2MB ajoutes (acceptable pour backend)
3. **Courbe d'apprentissage** - API Prisma differe du SQL pur
4. **Raw SQL limite** - Requetes complexes necessitent `$queryRaw`

### Risques et Mitigations

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Conflits de migration en equipe | Moyenne | Moyen | Review des fichiers migration/ en PR |
| Echec migration prod | Faible | Haut | Test sur staging, scripts rollback |
| N+1 queries | Moyenne | Moyen | `include` explicite, logging dev |
| Pool exhaustion | Faible | Haut | Config pool size, monitoring |

## Alternatives Rejetees

### TypeORM

**Avantages:**
- Decorators natifs, style NestJS
- Patterns Active Record et Data Mapper
- Maturite et historique

**Raisons du rejet:**
- Types peuvent diverger du schema reel
- Migrations moins intuitives
- Configuration plus complexe
- Bundle plus lourd

### MikroORM

**Avantages:**
- Unit of Work pattern propre
- Bon support TypeScript
- Integration NestJS disponible

**Raisons du rejet:**
- Communaute plus petite
- Moins de documentation
- Setup plus complexe

### Drizzle ORM

**Avantages:**
- Tres leger et rapide
- Syntaxe proche du SQL
- Excellent TypeScript

**Raisons du rejet:**
- Projet plus recent, moins mature
- Ecosysteme plus petit
- Tooling migrations moins developpe

### Raw SQL (pg)

**Avantages:**
- Controle total
- Pas d'overhead
- Footprint minimal

**Raisons du rejet:**
- Pas de type safety
- Migrations manuelles
- Boilerplate important
- Productivite reduite

## Implementation

### Phase 1 - Setup (Complete)
- [x] Installation Prisma 6.x
- [x] Schema User et File
- [x] PrismaModule et PrismaService
- [x] Scripts npm
- [x] Tests unitaires

### Phase 2 - Production Ready (A faire)
- [ ] Migration initiale appliquee
- [ ] Seed de donnees de test
- [ ] Monitoring connexions
- [ ] Documentation API

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Prisma Recipe](https://docs.nestjs.com/recipes/prisma)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## Changelog

| Date | Auteur | Modification |
|------|--------|--------------|
| 2025-12-31 | Claude Code | Creation initiale, status ACCEPTED |
