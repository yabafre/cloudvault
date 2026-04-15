# CloudVault — Component Catalog

Every UI component in the prototype, organized by type. All components are custom, forwardRef-based, and use CSS variables for theming.

## Form Components

### `Button`
**File:** `src/components/ui/button.tsx`

**Props:**
- `variant`: `primary` | `secondary` | `ghost` | `destructive` | `outline` (default `primary`)
- `size`: `sm` (h-7) | `md` (h-8, default) | `lg` (h-9) | `icon` (h-8 w-8)
- `loading`: boolean — shows spinner, disables button
- All native `ButtonHTMLAttributes`

**Features:**
- `active:scale-[0.98]` press feedback on primary
- `focus-visible` ring
- `disabled:opacity-50 disabled:cursor-not-allowed`
- Spinner inline on `loading`

### `Input`
**File:** `src/components/ui/input.tsx`

**Props:**
- `label`: string (required — always visible, not placeholder-only)
- `error`: string — shows below field, sets `aria-invalid`
- `hint`: string — shows below field when no error
- `type`: any HTML input type; `password` auto-adds show/hide toggle
- All native `InputHTMLAttributes`

**Features:**
- Required asterisk indicator
- `aria-describedby` wiring for errors/hints
- `role="alert"` on errors
- Eye/EyeOff icons for password visibility

## Layout & Display

### `Card` (+ subcomponents)
**File:** `src/components/ui/card.tsx`

**Exports:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`

**Features:**
- Mouse-tracking radial glow effect (via `--mouse-x` / `--mouse-y` CSS vars)
- Emerald hover glow (`hover-glow-effect` class)
- Rounded 8px, border, `var(--card)` background

### `Skeleton`
**File:** `src/components/ui/skeleton.tsx`

Simple animated pulse placeholder. `animate-pulse rounded-[8px] bg-[var(--secondary)]`.

### `Badge`
**File:** `src/components/ui/badge.tsx`

**Variants:** `default` | `secondary` | `success` (emerald) | `warning` (amber) | `destructive` | `outline`

Inline pill, 10px text, 2px vertical padding.

### `Breadcrumb`
**File:** `src/components/ui/breadcrumb.tsx`

Auto-generates from `useLocation()`. Supports hardcoded labels map (dashboard/files/profile). Chevron separators, last item non-clickable and bold.

## Overlays

### `Dialog` (+ subcomponents)
**File:** `src/components/ui/dialog.tsx`

**Exports:** `Dialog`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`

**Props:**
- `open`: boolean
- `onClose`: `() => void`
- `className`: sizing override

**Features:**
- Backdrop click closes
- `role="dialog" aria-modal="true"`
- Framer motion fade + scale(0.97) enter/exit
- Close button top-right with X icon

### `Toast`
**File:** `src/components/ui/toast.tsx`

**Props:**
- `open`, `onClose`
- `title`, `description`
- `variant`: `success` | `error` | `info`
- `duration`: ms (default 4000)

**Features:**
- Auto-dismiss with timer
- Fixed bottom-right
- `role="status" aria-live="polite"`
- Framer motion slide-up enter/exit
- Variant-colored icon circle (emerald / red / blue)

### `SessionExpiredDialog`
**File:** `src/components/ui/session-expired-dialog.tsx`

Composition of `Dialog` with Clock icon, amber accent, "Sign in again" CTA that navigates to `/auth/login`.

## Navigation

### `ThemeToggle`
**File:** `src/components/ui/theme-toggle.tsx`

Custom pill switch with Sun/Moon icons. Toggles `.dark` class on `<html>`. Fully keyboard accessible.

## Decorative / Brand

### `FallingPattern`
**File:** `src/components/ui/falling-pattern.tsx`

Canvas-based dot matrix with isobar/contour wave patterns. Sine interference generates drifting topographic bands. 60fps, respects `prefers-reduced-motion`. Alpha range 0.12–0.55 (visible in both themes).

**Props:** `color`, `speed`, `dotSize`, `gap`

### `TextShimmer`
**File:** `src/components/ui/text-shimmer.tsx`

Gradient shimmer animation on text for loading/accent moments.

### `AnimatedBadge`
**File:** `src/components/ui/animated-badge.tsx`

Pill badge with animated radial gradient orbit path (SVG), pulsing dot. Used in Dashboard header and Landing roadmap.

### `CyberneticBentoGrid`
**File:** `src/components/ui/bento-grid.tsx`

Landing page bento layout with hover mouse-tracking glow.

### `FeaturesSection`
**File:** `src/components/ui/features-section.tsx`

Landing page: 4-step pipeline (Upload → Encrypt → Store → Share) + 4 feature cards (Lightning Fast, Encrypted, EU Compliant, Auto Thumbnails).

### `DatabaseWithRestApi`
**File:** `src/components/ui/database-rest-api.tsx`

Animated architecture diagram showing API → Database with traveling light particles along SVG paths.

### `AgentPlan`
**File:** `src/components/ui/agent-plan.tsx`

Task list UI (used on Landing roadmap section) with expandable tasks/subtasks, status icons, framer motion variants.

## Component Reuse Rules

1. **Never use native HTML interactive elements** directly (input, button, etc.) — always use the custom components above.
2. **Icons:** Lucide React only, no emoji as structural icons.
3. **Colors:** Always use CSS variables (`var(--foreground)`, `var(--border)`, etc.) or Tailwind emerald scale for accents. Never hardcode hex.
4. **Focus states:** All interactive elements must have visible focus rings.
5. **Touch targets:** Buttons default to `h-8` (32px) for dense UI; use `h-9` (`lg`) for mobile-primary actions.
