# CloudVault — Screen Inventory

Mapping of every screen in the prototype to its route, layout, classification, and covered functional requirements.

## Public Screens

### Landing `/`
- **File:** `src/pages/Landing.tsx`
- **Layout:** standalone (no wrapper layout)
- **Type:** Marketing long-form
- **Sections:**
  - Sticky header (logo + theme toggle + Sign in + Get Started)
  - Hero with FallingPattern background, TextShimmer subtitle, dual CTA
  - Features section (4-step pipeline + feature cards)
  - Architecture section (DatabaseWithRestApi diagram)
  - Cybernetic Bento Grid (core features)
  - Roadmap section (AgentPlan component)
  - CTA + Footer with FallingPattern
- **FRs covered:** none directly — entry point to auth
- **Interactions:** scroll-driven, theme toggle, nav CTAs

### NotFound `*`
- **File:** `src/pages/NotFound.tsx`
- **Layout:** standalone
- **Type:** Utility — error page
- **Content:** 404 number, ShieldAlert icon, message, Home + Go back buttons
- **Background:** FallingPattern with radial mask
- **FRs covered:** P4 (error page), P9 (predictable back behavior)

## Auth Screens

### Login `/auth/login`
- **File:** `src/pages/Login.tsx`
- **Layout:** `AuthLayout` (split-screen)
- **Type:** Form — authentication
- **Fields:** Email (validated), Password (validated + show/hide toggle), forgot password link
- **Actions:** Sign in button, Google OAuth button, "Create one" link
- **States:** loading, validation errors, general error banner
- **FRs covered:** FR5, FR6, FR10

### Register `/auth/register`
- **File:** `src/pages/Register.tsx`
- **Layout:** `AuthLayout`
- **Type:** Form — account creation
- **Fields:** Full name, Email, Password (8-char hint)
- **Actions:** Create account button, Google OAuth, "Sign in" link
- **States:** loading, field validation errors
- **FRs covered:** FR1, FR2, FR3, FR4

### AuthCallback `/auth/callback`
- **File:** `src/pages/AuthCallback.tsx`
- **Layout:** standalone (no layout wrapper)
- **Type:** Utility — OAuth handshake
- **States:** `loading` (spinner), `success` (checkmark, auto-redirect), `error` (back-to-login)
- **Background:** FallingPattern radial mask
- **FRs covered:** FR2, FR6, FR7

## Authenticated App Screens

### Dashboard `/dashboard`
- **File:** `src/pages/Dashboard.tsx`
- **Layout:** `AppLayout`
- **Type:** Dashboard — overview + action
- **Sections:**
  - Page header (title + AnimatedBadge)
  - Demo mode switcher (dev tool — `normal` / `empty` / `quota-warning` / trigger session expired)
  - Quota warning banner (conditional: ≥80% amber, ≥95% destructive)
  - Stats grid (4 cards: Total Files, Storage Used, Last Upload, Quota %)
  - Storage progress bar (color changes by threshold)
  - Upload zone (drag+drop, file browser, validation, progress, error, toast)
  - Recent files list (top 5, with "View all" link)
- **Loading state:** skeletons for all 4 stats, storage bar, recent files list (1s)
- **Empty state:** first-use CTA when 0 files
- **FRs covered:** FR13, FR14, FR15, FR16, FR19, FR37, FR38, FR39, FR40, FR42

### Files `/files`
- **File:** `src/pages/Files.tsx`
- **Layout:** `AppLayout`
- **Type:** List — data browsing
- **Toolbar:** Page title + count, search input, Upload button, grid/list view toggle
- **Grid view:** 2/3/4/5 columns responsive cards with thumbnail, name, size, date, hover delete
- **List view:** sortable table with name + thumbnail, type, size, date, actions
- **Pagination:** 20 files/page, chevron + numbered buttons
- **Loading state:** skeleton grid (10 cards) or skeleton rows (8)
- **Empty state:** FolderOpen icon + "No files found" + upload CTA (or "Clear search")
- **Modals:** file detail Dialog (preview + metadata + download/delete), delete confirmation Dialog
- **FRs covered:** FR27, FR28, FR29, FR30, FR31, FR32, FR33

### Profile `/profile`
- **File:** `src/pages/Profile.tsx`
- **Layout:** `AppLayout`
- **Type:** Form + summary
- **Sections:**
  - Avatar + info card (name, email, "Free tier" Badge, member since)
  - Personal Information form (display name editable, email disabled)
  - Storage card (used/available/total files/plan)
  - Danger Zone (delete account button)
- **Feedback:** Toast on save success
- **FRs covered:** FR11, FR12

## Screen Priority for Epic Generation

| Priority | Screens | Reason |
|----------|---------|--------|
| **P0 (MVP core)** | Login, Register, AuthCallback, Dashboard, Files, Profile | Cover all MVP FRs |
| **P1 (polish)** | Landing, NotFound | User acquisition + error handling |

## Screen Count

**Total implemented:** 9 screens + session-expired dialog

## Not Yet Implemented (deferred)

- **Forgot password** (linked from Login — points to `#`)
- **File share modal** (v2 feature)
- **Folder hierarchy** (v2)
- **Team workspaces** (v2)
