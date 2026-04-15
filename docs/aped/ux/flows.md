# CloudVault — Navigation Flows

## Authentication Flow

```
                  ┌──────────┐
                  │  Landing │
                  │    /     │
                  └────┬─────┘
                       │ "Get Started" / "Sign in"
              ┌────────┴────────┐
              ▼                 ▼
       ┌──────────┐      ┌──────────┐
       │ Register │      │  Login   │
       │ /auth/   │◄────►│ /auth/   │
       │ register │      │  login   │
       └────┬─────┘      └────┬─────┘
            │                 │
            │ Email/password  │
            │    submit       │
            │                 │
            │ Google OAuth    │
            │        ┌────────┘
            ▼        ▼
       ┌──────────────────┐
       │   AuthCallback   │
       │ /auth/callback   │
       │ (OAuth only)     │
       │ loading→success  │
       └────────┬─────────┘
                │ success
                ▼
          ┌──────────┐
          │Dashboard │
          │/dashboard│
          └──────────┘
```

**Error branch:** AuthCallback `error` state → button back to `/auth/login`.

**Session expired:** Any authenticated screen → SessionExpiredDialog → `/auth/login`.

## Main App Flow

```
           ┌──────────────────────────────────┐
           │         AppLayout                │
           │  ┌──────────┐ ┌───────────────┐  │
           │  │ Sidebar  │ │  Main + BC    │  │
           │  └──────────┘ └───────────────┘  │
           └──────────────────────────────────┘
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
       ┌─────────┐ ┌────────┐ ┌─────────┐
       │Dashboard│ │ Files  │ │ Profile │
       └────┬────┘ └────┬───┘ └─────────┘
            │           │
            │ "Upload"  │
            ▼           │
       ┌─────────┐      │
       │ Upload  │      │
       │ zone    │      │
       │ valid?  │      │
       └──┬───┬──┘      │
          │   │         │
      OK  │   │ Error   │
          │   │         │
          ▼   ▼         │
      Toast  Banner     │
      success + Retry   │
          │             │
          ▼             │
      Recent Files ◄────┘
          │
          │ Click row
          ▼
    ┌──────────────┐
    │  File Detail │
    │    Dialog    │
    └──┬────────┬──┘
       │        │
   Download   Delete
              │
              ▼
       ┌─────────────┐
       │   Confirm   │
       │   Dialog    │
       └──┬────────┬─┘
      Cancel    Confirm
          │        │
          │        ▼
          │   File removed
          │   + list updates
          ▼
      Back to list
```

## Theme Toggle Flow

Available in:
- Landing page header (desktop + mobile)
- AppLayout sidebar (desktop) + mobile header
- Persists via `.dark` class on `<html>`; reloads preserve user choice

## Quota Warning Flow

```
Storage usage calculated on each Dashboard render
            │
            ▼
     ┌─────────────┐
     │ quota % ?   │
     └──┬───┬───┬──┘
        │   │   │
      < 80 80-94 ≥ 95
        │   │   │
        │   │   └──► Critical banner (red)
        │   │        + red progress bar
        │   │        + red badge
        │   │
        │   └──────► Warning banner (amber)
        │            + amber progress bar
        │            + amber badge
        │
        └──────────► No banner
                     Emerald progress bar
```

## Delete Confirmation Flow

Same pattern used in: Files grid delete button, Files list delete button, File Detail Dialog delete button.

```
Click delete
    │
    ▼
setDeleteTarget(file)
    │
    ▼
Confirm Dialog opens
    │
    ├─ Click backdrop or X or Cancel → dialog closes, file preserved
    └─ Click Delete → handleDelete() removes from state, closes dialog
                      (no toast feedback currently — potential improvement)
```

## Route Map

| Route | Layout | Component | Protected |
|-------|--------|-----------|-----------|
| `/` | none | Landing | No |
| `/auth/login` | AuthLayout | Login | No |
| `/auth/register` | AuthLayout | Register | No |
| `/auth/callback` | none | AuthCallback | No |
| `/dashboard` | AppLayout | Dashboard | Yes* |
| `/files` | AppLayout | Files | Yes* |
| `/profile` | AppLayout | Profile | Yes* |
| `*` (404) | none | NotFound | No |

*In the prototype, auth is not enforced — every route is reachable. The real app will wire up proxy.ts + AuthGuard for protection.

## Back Navigation

- Breadcrumb bar provides `Home > Page` path
- Browser back button preserves scroll (default React Router behavior)
- NotFound page has "Go back" button calling `window.history.back()`
- Modals close with backdrop click, X button, or Cancel button
