# {SLUG}: {TITLE}

## 📋 Métadonnées

| Champ | Valeur |
|-------|--------|
| Status | `DRAFT` / `READY_FOR_ARCH` / `IN_PROGRESS` / `DONE` |
| Priorité | `P0` / `P1` / `P2` |
| Estimation | `S` / `M` / `L` / `XL` |
| Créé | {DATE} |
| Auteur | pm-spec agent |

---

## 🎯 Contexte Business

### Problème
{Description du problème utilisateur à résoudre}

### Solution proposée
{Description de la solution envisagée}

### Valeur ajoutée
{Bénéfices mesurables pour l'utilisateur/business}

### Métriques de succès (OKR)
- [ ] Métrique 1: {target}
- [ ] Métrique 2: {target}

---

## 👤 User Stories

### US-1: {Title}
**En tant que** {role}  
**Je veux** {action}  
**Afin de** {bénéfice}

**Critères d'acceptation**:
- [ ] {critère 1}
- [ ] {critère 2}
- [ ] {critère 3}

### US-2: {Title}
**En tant que** {role}  
**Je veux** {action}  
**Afin de** {bénéfice}

**Critères d'acceptation**:
- [ ] {critère 1}
- [ ] {critère 2}

---

## ⚠️ Edge Cases Identifiés

| # | Cas | Comportement attendu | Priorité |
|---|-----|---------------------|----------|
| 1 | {cas limite 1} | {comportement} | Must |
| 2 | {cas limite 2} | {comportement} | Should |
| 3 | {cas limite 3} | {comportement} | Could |

---

## 🔒 Sécurité / RGPD

- **Données personnelles impliquées**: Oui / Non
- **Consentement requis**: Oui / Non
- **Audit logging requis**: Oui / Non
- **Permissions RBAC**: {liste des rôles autorisés}
- **Encryption at rest**: Oui / Non

---

## 🏗️ Impact Technique

### Modules impactés

| App/Package | Fichiers/Dossiers | Type de changement |
|-------------|-------------------|-------------------|
| `apps/api` | `src/{module}/` | Création module |
| `apps/web` | `app/(dashboard)/[orgId]/{feature}/` | Nouvelles routes |
| `packages/database` | `prisma/schema.prisma` | Nouveau modèle |

### Breaking changes
- [ ] **Oui** - Description: {impact}
- [x] **Non**

### Migration de données
- [ ] **Requise** - Stratégie: {description}
- [x] **Non requise**

### Dépendances à ajouter
| Package | Version | Raison |
|---------|---------|--------|
| {package} | ^x.y.z | {raison} |

---

## 🎨 UI/UX

### Wireframes / Maquettes
- Figma: {lien}
- Screens: {liste}

### Responsive
- [ ] Mobile (< 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)

---

## ❓ Questions Bloquantes

- [ ] **Q1**: {question nécessitant clarification}
- [ ] **Q2**: {question technique à valider}

---

## 📎 Références

- **Design**: {lien Figma}
- **Ticket**: {lien Jira/Linear}
- **Documentation externe**: {liens}
- **ADR lié**: {lien si existant}

---

## ✅ Checklist Pre-Architecture

- [ ] User stories définies avec critères d'acceptation
- [ ] Edge cases identifiés (minimum 3)
- [ ] Impact sécurité/RGPD évalué
- [ ] Modules impactés listés
- [ ] Questions bloquantes résolues ou escaladées
- [ ] Maquettes/wireframes disponibles (si UI)

---

## 📝 Notes de révision

| Date | Auteur | Changement |
|------|--------|------------|
| {date} | pm-spec | Création initiale |
