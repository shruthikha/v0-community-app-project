---
name: nido-design-system
description: Nido's brand design system — colors, typography, spacing, and UI constraints. Use when building any UI component, reviewing designs, or writing user-facing content. Enforces Forest+Sunrise palette and prohibits generic purple/teal themes.
---

# Nido Design System

The Ecovilla Community Platform uses a nature-inspired brand identity. Every UI element must align with this system.

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Forest Canopy** | `#4A7C2C` | Primary actions, navigation, links |
| **Forest Growth** | `#6B9B47` | Success states, positive feedback |
| **Sunrise** | `#D97742` | Urgent CTAs, warnings, accent |
| **Soil** | `#1A1A1A` | Primary text |

### Supporting Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Stone** | `#F5F3F0` | Backgrounds, cards |
| **Mist** | `#E8E5E0` | Borders, dividers |
| **Bark** | `#8B7355` | Secondary text, metadata |

### BANNED Colors
- ❌ **Purple / Violet / Indigo** — NEVER as primary brand color
- ❌ **Fintech blue** (#3B82F6 and similar) — not our brand
- ❌ **Teal / Cyan** — not our palette

If you catch yourself reaching for purple or blue, use Forest Canopy (#4A7C2C) instead.

## Typography

- **Headings**: Clean, modern sans-serif (check `docs/dev/design-principles.md` for exact font)
- **Body**: Readable, generous line-height (1.5-1.6)
- **Code**: Monospace for technical content

## Spacing

- **Base unit**: 8px
- **Component padding**: 16px (2 units)
- **Section spacing**: 32px (4 units)
- **Mobile dock clearance**: `pb-[80px]` (bottom navigation)

## Layout Principles

### Mobile-First
- Design for smallest screen first
- Single column below 640px
- Progressive enhancement for larger screens

### Breakpoints
| Name | Width | Layout |
|------|-------|--------|
| Mobile | < 640px | Single column |
| Tablet | 640-1023px | 2 columns |
| Desktop | 1024-1279px | 3 columns |
| Large | 1280px+ | 4 columns |

## Deep Design Thinking (Before Any UI Work)

Before writing UI code, commit to a direction:

```markdown
🎨 DESIGN COMMITMENT:
- **Geometry:** Sharp (0-2px) for Tech/Luxury, Rounded (16-32px) for Friendly
- **Palette:** Forest + Sunrise (from this design system)
- **Effect:** Subtle shadows + ease-out animations
- **Layout uniqueness:** How does this differ from a generic template?
```

## The Maestro Auditor (Self-Check)

Before delivering UI work, verify:

| Trigger | Action |
|---------|--------|
| Using 50/50 split or `grid-cols-2`? | Change to asymmetric (90/10, overlapping) |
| Using `backdrop-blur`? | Use solid colors instead |
| Using blue as primary? | Replace with Forest Canopy (#4A7C2C) |
| Looks like a Vercel template? | Make it distinctive |

## Accessibility (WCAG AA)

- **4.5:1** contrast ratio for normal text
- **3:1** for large text (18px+ or bold 14px+)
- **44px minimum** touch targets
- **Keyboard navigation** for all interactive elements
- **ARIA labels** where visual context insufficient
- **`prefers-reduced-motion`** respected

## Component Defaults

- Use **shadcn/ui** as base, but customize to match brand
- Default to server components (Next.js App Router)
- Empty states must have helpful messaging and clear next action
- Loading states: skeleton UI, not spinners
