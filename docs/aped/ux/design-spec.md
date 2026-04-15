# CloudVault — UX Design Specification

**Version:** 1.0
**Date:** 2026-04-12
**Status:** Approved prototype — ready for `/aped-epics`

## Design Philosophy

Vercel-inspired minimalism: black/white as primary palette, emerald green as accent-only for CTAs, badges, and brand moments. Dense typography, restrained color, high information density. Dark mode is the default; light mode fully supported.

## Design Tokens

### Colors

All colors exposed via CSS custom properties for light/dark theming.

**Neutral palette:**

| Token | Light | Dark |
|-------|-------|------|
| `--background` | `#ffffff` | `#000000` |
| `--foreground` | `#0a0a0a` | `#ededed` |
| `--card` | `#ffffff` | `#0a0a0a` |
| `--primary` | `#0a0a0a` | `#ededed` |
| `--primary-foreground` | `#ffffff` | `#0a0a0a` |
| `--secondary` | `#f5f5f5` | `#1a1a1a` |
| `--muted-foreground` | `#737373` | `#a3a3a3` |
| `--border` | `#e5e5e5` | `#262626` |
| `--ring` | `#0a0a0a` | `#ededed` |

**Accent / semantic:**

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` (emerald) | `#059669` / `#10b981` | Primary CTAs, active states, brand accents |
| `--destructive` | `#dc2626` / `#ef4444` | Delete actions, error states |
| Amber (warning) | `#f59e0b` | Quota warning states |

**Emerald scale** (via Tailwind): `emerald-50` to `emerald-950` — used sparingly for accent glows, badges, icons.

### Typography

- **Font family (sans):** `Inter, system-ui, -apple-system, sans-serif`
- **Font family (mono):** `JetBrains Mono, Fira Code, monospace`
- **Weight scale:** 400 (normal) / 500 (medium) / 600 (semibold) / 700 (bold)
- **Size scale:** 10px / 12px / 14px / 16px / 18px / 20px / 24px / 32px / 40px
- **Line height:** 1.25 (tight) / 1.5 (normal) / 1.75 (relaxed)
- **Default body size:** 12–14px (dense dashboard UI); 16px on mobile per P5 rule

### Spacing

- **Base unit:** 4px
- **Scale:** 4/8/12/16/20/24/32/40/48/64/80 px
- **Container max-width:** `max-w-7xl` (1280px) for app pages, `max-w-6xl` for landing

### Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 4px | Inline badges |
| `md` | 6px | Icon tiles |
| `lg` | 8px | Inputs, buttons, cards, dialogs |
| `xl` | 12px | Feature sections |
| `full` | 9999px | Avatars, pills |

### Shadows

Used sparingly. Emerald-tinted glow (`shadow-[0_0_15px_rgba(16,185,129,0.15)]`) on stat card icons. Standard drop shadow on dialogs (`shadow-xl`).

## UI Library

**shadcn/ui-style custom components** built on top of Tailwind CSS 4. All components live in `src/components/ui/` and follow the forwardRef + clsx pattern.

**Native HTML elements are never used directly** — every input, button, modal goes through a custom component.

**Stack:**
- React 19.2
- Tailwind CSS 4.2 (new `@theme` directive)
- Framer Motion 12.38 for micro-interactions
- Lucide React for icons
- react-router-dom 7 for routing

## Layout Specifications

### AppLayout (authenticated)

**Structure:** `h-dvh flex flex-col lg:flex-row overflow-hidden`

- **Sidebar (desktop ≥1024px):** `w-56` (224px), fixed position, three zones:
  - Logo header (`h-12`, border-bottom)
  - Nav middle (`flex-1 overflow-y-auto`)
  - User footer (border-top)
- **Sidebar (mobile <1024px):** drawer overlay, slides in from left, triggered by Menu button
- **Main content:** `flex-1 min-h-0 overflow-y-auto` — **only scrollable zone**
  - Sticky breadcrumb bar (`h-12`, aligned with sidebar logo)
  - Page content with `p-6 max-w-7xl mx-auto`
- **Mobile header:** `h-12` top bar with logo + theme toggle + menu button

### AuthLayout

**Structure:** split-screen `min-h-dvh flex`

- Left: centered form card (`max-w-sm`) with CloudVault logo header
- Right (desktop only): decorative FallingPattern canvas

### Landing (public)

Full-width marketing layout with sticky header, no sidebar. Sections stack vertically with `py-20` spacing.

## Responsive Breakpoints

| Breakpoint | Target | Notes |
|------------|--------|-------|
| `< 640px` (sm) | Mobile phones | Single-column layouts, hamburger nav, stacked forms |
| `640–1024px` (md/lg) | Tablets | Adapted 2-column grids, sidebar collapses to drawer |
| `≥ 1024px` (lg) | Desktop | Full sidebar, 4-column stat grids, max-width containers |
| `≥ 1280px` (xl) | Wide desktop | 5-column file grids |

All layouts use mobile-first Tailwind utilities.

## Motion & Interaction

- **Duration:** 150–300ms for micro-interactions, ≤400ms for complex transitions
- **Easing:** `ease-out` entering, `ease-in` exiting
- **Press feedback:** `active:scale-[0.98]` on primary buttons
- **Transform/opacity only** — no layout-shifting animations
- **Stagger:** 30–50ms between list items (framer-motion `staggerChildren`)
- **Skeleton shimmer:** `animate-pulse` at 1s loop for loading states

**FallingPattern** canvas animation: topographic contour bands drifting organically, 60fps, respects `prefers-reduced-motion`. Alpha range 0.12–0.55 for visibility in both light and dark modes.

## Accessibility (WCAG 2.1 AA target)

- **Contrast:** ≥4.5:1 for body text, ≥3:1 for large text, verified in both themes
- **Focus rings:** 2px offset emerald ring on all interactive elements (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]`)
- **Skip-to-main link** present in AppLayout
- **ARIA labels** on all icon-only buttons
- **Form labels** always visible (never placeholder-only)
- **Role attributes** on dialogs (`role="dialog"`, `aria-modal="true"`), alerts (`role="alert"`), status (`role="status" aria-live="polite"`)
- **Keyboard navigation** full support; tab order matches visual order
- **Prefers-reduced-motion** respected in FallingPattern and framer-motion variants

## Preview App

**Location:** `docs/aped/ux-preview/`
**Run:** `npm run dev` → `http://localhost:5173`
**Stack:** Vite 8 + React 19 + Tailwind 4 + TypeScript 5.9
**Dev tool:** react-grab enabled in dev mode for direct element→agent context sharing

See [screen-inventory.md](./screen-inventory.md), [components.md](./components.md), and [flows.md](./flows.md) for detailed breakdowns.
