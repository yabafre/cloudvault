# Frontend Auth System: Restructuration Complete

## Metadonnees
- **Status**: READY_FOR_IMPL
- **Priorite**: P0
- **Estimation**: M (3-5 jours)
- **Cree**: 2026-01-05
- **Auteur**: pm-spec agent
- **ADR**: ADR-003-frontend-auth-restructuring.md

---

## Contexte Business

### Probleme

Le systeme d'authentification frontend actuel de CloudVault presente plusieurs problemes structurels majeurs qui impactent la maintenabilite, la scalabilite et la coherence du code:

1. **Dispersion de la logique metier**: Le code auth est reparti entre 7+ fichiers sans organisation claire
2. **Non-respect de l'ADR-002**: L'architecture reelle ne correspond pas a l'architecture decidee
3. **Duplication des providers**: `AuthProvider` et `Providers` coexistent avec des responsabilites floues
4. **Hooks globaux vs locaux**: Tous les hooks sont globaux alors que certains devraient etre locaux aux pages
5. **Structure de dossiers incoherente**: Melange de patterns sans convention claire

### Solution proposee

Restructurer le systeme d'authentification selon l'ADR-002 en:
- Centralisant le code core dans `apps/web/core/`
- Localisant les composants et hooks specifiques aux pages dans `app/(route)/_components/`, `_hooks/`, `_actions/`
- Simplifiant la chaine de providers
- Clarifiant les responsabilites de chaque module

### Valeur ajoutee

- **Maintenabilite**: Code organise, facile a naviguer
- **Onboarding**: Nouveaux developpeurs comprennent rapidement la structure
- **Scalabilite**: Ajout de nouvelles fonctionnalites sans pollution globale
- **Coherence**: Respect des patterns etablis dans les ADR

### Metriques de succes (OKR)
- [ ] 100% des fichiers auth suivent la convention de nommage
- [ ] 0 duplication de code entre les modules auth
- [ ] Temps de comprehension < 15 min pour un nouveau developpeur
- [ ] Tous les tests existants passent apres refactoring

---

## Analyse de l'Existant

### Structure Actuelle (Problematique)

```
apps/web/
|-- app/
|   |-- auth/
|   |   |-- _actions/           # VIDE
|   |   |-- _components/        # VIDE
|   |   |-- _hooks/             # VIDE
|   |   |-- callback/
|   |   |   |-- _actions/       # VIDE
|   |   |   |-- _components/
|   |   |   |   +-- callback-content.tsx  # OK - local
|   |   |   |-- _hooks/         # VIDE
|   |   |   |-- layout.tsx
|   |   |   +-- page.tsx
|   |   |-- login/
|   |   |   |-- _actions/       # VIDE
|   |   |   |-- _components/    # VIDE (form dans components/auth)
|   |   |   |-- _hooks/         # VIDE
|   |   |   +-- page.tsx        # Importe depuis components/auth
|   |   |-- register/
|   |   |   |-- _actions/       # VIDE
|   |   |   |-- _components/    # VIDE (form dans components/auth)
|   |   |   |-- _hooks/         # VIDE
|   |   |   +-- page.tsx        # Importe depuis components/auth
|   |   +-- layout.tsx
|   |-- dashboard/
|   |   |-- _actions/           # VIDE
|   |   |-- _components/        # VIDE
|   |   |-- _hooks/             # VIDE
|   |   |-- layout.tsx          # Utilise AuthGuard
|   |   +-- page.tsx
|   +-- layout.tsx              # Root layout avec providers dupliques
|
|-- components/
|   |-- auth/                   # PROBLEME: Composants globaux pour pages specifiques
|   |   |-- auth-card.tsx       # OK - reutilisable
|   |   |-- auth-guard.tsx      # OK - guard global
|   |   |-- divider-with-text.tsx  # OK - reutilisable
|   |   |-- google-button.tsx   # OK - reutilisable
|   |   |-- index.ts
|   |   |-- login-form.tsx      # PROBLEME: Devrait etre local a login/
|   |   +-- register-form.tsx   # PROBLEME: Devrait etre local a register/
|   |-- providers/
|   |   |-- auth-provider.tsx   # OK mais mal place
|   |   +-- index.tsx           # Providers wrapper (duplique avec layout)
|   +-- dashboard/
|       +-- nav.tsx
|
|-- core/
|   +-- providers/
|       |-- reactQuery.tsx      # OK
|       +-- theme-provider.tsx  # Duplique avec components/common
|
|-- hooks/
|   |-- use-auth.ts             # PROBLEME: Hook global trop gros (147 lignes)
|   +-- use-mobile.ts           # OK
|
|-- lib/
|   |-- api/
|   |   |-- auth.ts             # OK - fonctions API auth
|   |   +-- client.ts           # OK - client ky configure
|   |-- stores/
|   |   +-- auth.ts             # OK - Zustand store
|   +-- utils.ts
|
+-- proxy.ts                    # OK - middleware Next.js
```

### Problemes Identifies

| # | Probleme | Localisation | Impact | Priorite |
|---|----------|--------------|--------|----------|
| 1 | LoginForm dans components/auth au lieu de login/_components | `components/auth/login-form.tsx` | Confusion, non-scalable | High |
| 2 | RegisterForm dans components/auth au lieu de register/_components | `components/auth/register-form.tsx` | Confusion, non-scalable | High |
| 3 | Hook use-auth.ts trop gros (6 hooks en 1) | `hooks/use-auth.ts` | Difficile a maintenir | High |
| 4 | Providers dupliques (layout.tsx vs providers/index.tsx) | `app/layout.tsx`, `providers/index.tsx` | Code mort, confusion | Medium |
| 5 | theme-provider duplique | `core/providers/`, `components/common/` | Duplication | Medium |
| 6 | Dossiers _actions, _hooks, _components vides | Toutes les routes auth | Structure fantome | Low |
| 7 | API et stores dans lib/ au lieu de core/ | `lib/api/`, `lib/stores/` | Non-conforme ADR | Medium |

### Dependances Actuelles

```
                    +------------------+
                    |   app/layout.tsx |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
    +----------------+ +-------------+ +----------------+
    |ReactQueryProvider| |ThemeProvider| |AuthProvider   |
    +----------------+ +-------------+ +----------------+
                                              |
                                              v
                                    +------------------+
                                    | useAuthStore     |
                                    | (Zustand)        |
                                    +--------+---------+
                                             |
                    +------------------------+------------------------+
                    |                        |                        |
                    v                        v                        v
           +---------------+        +---------------+        +---------------+
           | AuthGuard     |        | use-auth.ts   |        | api/client.ts |
           | (components)  |        | (hooks/)      |        | (lib/)        |
           +-------+-------+        +-------+-------+        +-------+-------+
                   |                        |                        |
                   |                        v                        |
                   |               +---------------+                 |
                   +-------------->| LoginForm     |<----------------+
                                   | RegisterForm  |
                                   +---------------+
```

---

## User Stories

### Story 1: Restructurer les composants de formulaires

**En tant que** developpeur CloudVault
**Je veux** que les formulaires login et register soient localises dans leurs routes respectives
**Afin de** respecter le pattern Next.js App Router et faciliter la maintenance

**Criteres d'acceptation**:
- [ ] `login-form.tsx` deplace vers `app/auth/login/_components/login-form.tsx`
- [ ] `register-form.tsx` deplace vers `app/auth/register/_components/register-form.tsx`
- [ ] Les imports dans les pages sont mis a jour
- [ ] L'ancien fichier dans `components/auth/` est supprime
- [ ] Le barrel export `components/auth/index.ts` est mis a jour

### Story 2: Decomposer le hook use-auth

**En tant que** developpeur CloudVault
**Je veux** que les hooks d'authentification soient separes par responsabilite
**Afin de** pouvoir les importer individuellement et reduire le bundle

**Criteres d'acceptation**:
- [ ] `useLogin` dans `app/auth/login/_hooks/use-login.ts`
- [ ] `useRegister` dans `app/auth/register/_hooks/use-register.ts`
- [ ] `useLogout` dans `core/auth/hooks/use-logout.ts` (global car utilise partout)
- [ ] `useProfile` dans `core/auth/hooks/use-profile.ts` (global)
- [ ] `useAuth` facade conservee dans `hooks/` pour compatibilite
- [ ] Chaque hook < 50 lignes

### Story 3: Centraliser le core auth

**En tant que** developpeur CloudVault
**Je veux** que le code core d'authentification soit dans `core/auth/`
**Afin de** avoir une separation claire entre core et features

**Criteres d'acceptation**:
- [ ] `core/auth/api/client.ts` - client ky configure
- [ ] `core/auth/api/auth.ts` - fonctions API
- [ ] `core/auth/stores/auth.ts` - Zustand store
- [ ] `core/auth/hooks/` - hooks globaux (useAuth, useLogout, useProfile)
- [ ] `core/auth/components/auth-guard.tsx` - composant guard
- [ ] Anciens fichiers dans `lib/` supprimes

### Story 4: Nettoyer les providers

**En tant que** developpeur CloudVault
**Je veux** une seule source de verite pour les providers
**Afin de** eviter la duplication et la confusion

**Criteres d'acceptation**:
- [ ] `core/providers/index.tsx` comme unique point d'entree
- [ ] `components/providers/` supprime
- [ ] `components/common/theme-provider.tsx` supprime (utiliser next-themes directement)
- [ ] `app/layout.tsx` importe depuis `core/providers`

### Story 5: Nettoyer les dossiers vides

**En tant que** developpeur CloudVault
**Je veux** que les dossiers vides soient supprimes ou utilises
**Afin de** avoir une structure propre

**Criteres d'acceptation**:
- [ ] Supprimer tous les dossiers `_actions/`, `_hooks/`, `_components/` vides
- [ ] Ou les utiliser si du code local doit y etre place

---

## Edge Cases Identifies

| # | Cas | Comportement attendu | Priorite |
|---|-----|---------------------|----------|
| 1 | Import circulaire entre core/auth et hooks/ | Utiliser des imports dynamiques ou reorganiser | Must |
| 2 | SSR: Zustand hydration avant React Query | AuthProvider gere la sequence correctement | Must |
| 3 | Code splitting: bundle auth charge pour guest | Lazy load des formulaires | Should |
| 4 | Migration: anciens imports cassent | Conserver alias temporaires avec deprecation | Should |
| 5 | Tests: chemins hardcodes | Mettre a jour les paths dans les tests | Must |

---

## Considerations Securite / RGPD

- [ ] Donnees personnelles impliquees: Non (restructuration seulement)
- [ ] Audit logging requis: Non
- [ ] Permissions RBAC: Non applicable

**Note securite**: La restructuration ne modifie pas la logique de securite. Le stockage des tokens (access token en memoire, refresh token en httpOnly cookie) reste inchange.

---

## Impact Technique (estimation)

### Modules impactes

- `apps/web/app/auth/`: Pages login, register, callback
- `apps/web/app/dashboard/`: Layout avec AuthGuard
- `apps/web/components/auth/`: A decomposer
- `apps/web/lib/api/`: A deplacer vers core/
- `apps/web/lib/stores/`: A deplacer vers core/
- `apps/web/hooks/`: A refactorer
- `apps/web/core/`: A enrichir

### Breaking changes

- [ ] Oui
- Si oui: Imports depuis `components/auth/login-form` et `register-form` casseront
- Mitigation: Phase de deprecation avec re-exports

### Migration donnees

- [ ] Non requise (pas de changement backend/BDD)

---

## Structure Cible

```
apps/web/
|-- app/
|   |-- auth/
|   |   |-- layout.tsx                    # Layout auth (centre, pas de nav)
|   |   |-- callback/
|   |   |   |-- _components/
|   |   |   |   +-- callback-content.tsx  # INCHANGE
|   |   |   +-- page.tsx
|   |   |-- login/
|   |   |   |-- _components/
|   |   |   |   +-- login-form.tsx        # DEPLACE de components/auth
|   |   |   |-- _hooks/
|   |   |   |   +-- use-login.ts          # EXTRAIT de hooks/use-auth
|   |   |   +-- page.tsx
|   |   +-- register/
|   |       |-- _components/
|   |       |   +-- register-form.tsx     # DEPLACE de components/auth
|   |       |-- _hooks/
|   |       |   +-- use-register.ts       # EXTRAIT de hooks/use-auth
|   |       +-- page.tsx
|   |-- dashboard/
|   |   |-- layout.tsx                    # AuthGuard depuis core/
|   |   +-- page.tsx
|   +-- layout.tsx                        # Providers depuis core/
|
|-- components/
|   |-- auth/                             # Composants REUTILISABLES seulement
|   |   |-- auth-card.tsx                 # OK
|   |   |-- divider-with-text.tsx         # OK
|   |   |-- google-button.tsx             # OK
|   |   +-- index.ts                      # Mis a jour
|   +-- ui/                               # shadcn/ui INCHANGE
|
|-- core/
|   |-- auth/
|   |   |-- api/
|   |   |   |-- client.ts                 # DEPLACE de lib/api
|   |   |   +-- auth.ts                   # DEPLACE de lib/api
|   |   |-- stores/
|   |   |   +-- auth.ts                   # DEPLACE de lib/stores
|   |   |-- hooks/
|   |   |   |-- use-auth.ts               # Facade simplifiee
|   |   |   |-- use-logout.ts             # EXTRAIT
|   |   |   +-- use-profile.ts            # EXTRAIT
|   |   +-- components/
|   |       +-- auth-guard.tsx            # DEPLACE de components/auth
|   +-- providers/
|       |-- index.tsx                     # Unique point d'entree
|       |-- react-query.tsx               # INCHANGE
|       +-- auth-provider.tsx             # DEPLACE de components/providers
|
|-- hooks/
|   |-- use-auth.ts                       # Re-export de core/auth/hooks (compat)
|   +-- use-mobile.ts                     # INCHANGE
|
+-- proxy.ts                              # INCHANGE
```

### Dependances entre composants (apres restructuration)

```
                    +------------------+
                    |   app/layout.tsx |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    | core/providers/  |
                    | index.tsx        |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
    +----------------+ +-------------+ +----------------+
    | ReactQuery     | | ThemeProvider| | AuthProvider  |
    +----------------+ +-------------+ +----------------+
                                              |
                                              v
                                    +------------------+
                                    | core/auth/stores/|
                                    | auth.ts          |
                                    +--------+---------+
                                             |
                    +------------------------+
                    |                        |
                    v                        v
           +---------------+        +---------------+
           | core/auth/    |        | core/auth/api/|
           | components/   |        | client.ts     |
           | auth-guard.tsx|        +-------+-------+
           +---------------+                |
                                            v
                               +------------------------+
                               | app/auth/login/        |
                               | _hooks/use-login.ts    |
                               | _components/login-form |
                               +------------------------+
```

---

## Plan d'Implementation

### Phase 1: Preparation (0.5 jour)
1. Creer la structure de dossiers dans `core/auth/`
2. Ajouter les dossiers `_components/` et `_hooks/` dans login/ et register/

### Phase 2: Migration Core (1 jour)
1. Deplacer `lib/api/client.ts` vers `core/auth/api/client.ts`
2. Deplacer `lib/api/auth.ts` vers `core/auth/api/auth.ts`
3. Deplacer `lib/stores/auth.ts` vers `core/auth/stores/auth.ts`
4. Mettre a jour tous les imports

### Phase 3: Decomposition Hooks (1 jour)
1. Extraire `useLogin` vers `app/auth/login/_hooks/use-login.ts`
2. Extraire `useRegister` vers `app/auth/register/_hooks/use-register.ts`
3. Extraire `useLogout` vers `core/auth/hooks/use-logout.ts`
4. Extraire `useProfile` vers `core/auth/hooks/use-profile.ts`
5. Simplifier `hooks/use-auth.ts` en facade

### Phase 4: Migration Composants (1 jour)
1. Deplacer `login-form.tsx` vers `app/auth/login/_components/`
2. Deplacer `register-form.tsx` vers `app/auth/register/_components/`
3. Deplacer `auth-guard.tsx` vers `core/auth/components/`
4. Mettre a jour les imports dans les pages

### Phase 5: Nettoyage (0.5 jour)
1. Supprimer les anciens fichiers
2. Nettoyer `components/auth/index.ts`
3. Supprimer `components/providers/`
4. Supprimer dossiers vides inutilises
5. Mettre a jour `app/layout.tsx`

### Phase 6: Validation (1 jour)
1. Verifier que l'application demarre
2. Tester le flow login complet
3. Tester le flow register complet
4. Tester le flow OAuth
5. Tester la protection des routes
6. Verifier le build production

---

## Questions Bloquantes

Aucune question bloquante identifiee. La restructuration peut commencer.

---

## References

- ADR-002: `/docs/claude/decisions/ADR-002-frontend-auth-architecture.md` (Token storage, state management)
- ADR-003: `/docs/claude/decisions/ADR-003-frontend-auth-restructuring.md` (Code restructuring)
- Architecture: `/docs/claude/context/architecture.md`
- Types partages: `/packages/types/src/index.ts`

---

**Prochaine etape**:
> Use the implementer agent on "frontend-auth-restructure"

**Questions bloquantes**: 0
