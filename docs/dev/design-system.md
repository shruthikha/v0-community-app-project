# Nido Design System (Ecovilla)

> **Source of Truth**: 
> - **Tokens/Values**: Derived from `app/globals.css` and `tailwind.config.ts` (Live Code).
> - **Principles/Logic**: Derived from `design/design_specification.md`.
> **Version**: 1.1 (Consolidated)

---

## 🧠 Design Philosophy

**"Technology should serve human connection and ecological regeneration."**

### Core Personas & Needs
1. **Sofia (Newcomer)**: Needs **Safety & Clarity**. Use calming Sky Blue and generous spacing.
2. **Marcus (Coordinator)**: Needs **Efficiency**. Use Sunrise Orange for urgent coordination.
3. **Elena (Balanced)**: Needs **Low Noise**. Use Muted Neutrals and Morning Mist for optional content.
4. **Carmen (Resource Mgr)**: Needs **Status Clarity**. Use distinct status colors (Available/Borrowed).

---

## 🎨 Color Palette

### Primary Brand (Forest)
- **Forest Deep**: `hsl(100 54% 16%)` (#2D5016) - *Primary Text, Strong Backgrounds*
- **Forest Canopy**: `hsl(100 48% 33%)` (#4A7C2C) - *Primary Actions, Focus Rings*
- **Forest Growth**: `hsl(96 38% 45%)` (#6B9B47) - *Success, Interactive Elements*

### Accent & Energy (Sunrise)
> **Usage Rule**: Reserve for moments of community connection or urgency.
- **Sunrise**: `hsl(20 61% 55%)` (#D97742) - *Event Invites, Urgent CTAs*
- **Sunrise Soft**: `hsl(20 61% 95%)` - *Background tints*

### Neutrals (Earth & Clay)
- **Soil**: `hsl(0 0% 10%)` (#1A1A1A) - *Primary Text (Dark)*
- **Stone**: `hsl(0 0% 29%)` (#4A4A4A) - *Secondary Text*
- **Mist**: `hsl(0 0% 55%)` (#8C8C8C) - *Disabled Text*
- **Sand**: `hsl(36 9% 89%)` (#E8E5E0) - *Borders, Inputs*
- **Cloud**: `hsl(40 17% 97%)` (#F8F6F3) - *App Background*
- **Sunlight**: `hsl(0 0% 100%)` (#FFFFFF) - *Card Background*

### Semantic Status
| Status | Color | Meaning |
|--------|-------|---------|
| **Success** | Forest Growth | Available, Confirmed, Safe |
| **Warning** | Honey (`#D4A574`) | Needs Attention, Low Capacity |
| **Error** | Clay (`#C25B4F`) | Critical, Damaged, Blocked |
| **Info** | River (`#5B8FA3`) | Neutral Info, "Borrowed" status |

---

## 📐 Typography

**Font Families**: 
- UI: `Inter` (Sans) - Approchable, legible.
- Data: `JetBrains Mono` (Mono) - Timestamps, coordinates, IDs.

| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| `text-xs` | 12px | 16px | Captions |
| `text-sm` | 14px | 20px | Labels, Body Small |
| `text-base` | 16px | 24px | Body Default |
| `text-lg` | 18px | 28px | Intros |
| `text-xl` | 20px | 28px | H3 |
| `text-2xl` | 24px | 32px | H2 |
| `text-3xl` | 28px | 36px | H1 |

---

## 🧱 Spacing & Layout

**Grid System**: 8px base unit.
- `space-1` (4px): Tight groupings
- `space-4` (16px): **Base Unit** (Comfortable standard)
- `space-6` (24px): Section spacing (Relaxed)
- `space-20` (80px): **Critical** bottom padding for Mobile Dock clearance.

**Responsive Strategy**:
- **Mobile**: Single column, full width cards, `px-4`.
- **Tablet**: 2-column grid, `px-6`.
- **Desktop**: Max-width 1200px, 3-4 columns, `px-8`.

---

## 🧩 Component Patterns (Code)

### Mobile Dock
Fixed bottom navigation for mobile/PWA.
- Path: `components/ecovilla/navigation/mobile-dock.tsx`
- **Rule**: Main content container MUST have `pb-20`.

### Cards
Use `shadcn/ui` Card with `rounded-xl` and `shadow-sm`.
Background: `bg-card` (Sunlight).

### Buttons
- **Primary**: `bg-primary text-primary-foreground` (Forest Growth)
- **Sunrise (Urgent/Social)**: `bg-secondary text-secondary-foreground` (Sunrise) - *Use sparingly!*
- **Ghost**: For quiet actions.

### Touch Targets
- **Minimum**: 44x44px (iOS Standard).
- **Recommended**: 48x48px.
