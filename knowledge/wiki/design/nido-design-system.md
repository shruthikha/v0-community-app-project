---
source: nido_design_system
imported_date: 2026-04-08
---

# Nido Design System

## Brand Colors

### Primary Brand (Forest)
| Name | Hex | HSL | Usage |
|------|-----|-----|-------|
| **Forest Deep** | #2D50016 | hsl(100 54% 16%) | Primary Text, Strong Backgrounds |
| **Forest Canopy** | #4A7C2C | hsl(100 48% 33%) | Primary Actions, Focus Rings |
| **Forest Growth** | #6B9B47 | hsl(96 38% 45%) | Success, Interactive Elements |

### Accent (Sunrise)
| Name | Hex | Usage |
|------|-----|-------|
| **Sunrise** | #D97742 | Event Invites, Urgent CTAs |
| **Sunrise Soft** | | Background tints |

### Neutrals (Earth & Clay)
| Name | Hex | Usage |
|------|-----|-------|
| **Soil** | #1A1A1A | Primary Text (Dark) |
| **Stone** | #4A4A4A | Secondary Text |
| **Mist** | #8C8C8C | Disabled Text |
| **Sand** | #E8E5E0 | Borders, Inputs |
| **Cloud** | #F8F6F3 | App Background |
| **Sunlight** | #FFFFFF | Card Background |

### Semantic Status
| Status | Color | Meaning |
|--------|-------|---------|
| Success | Forest Growth | Available, Confirmed, Safe |
| Warning | Honey (#D4A574) | Needs Attention, Low Capacity |
| Error | Clay (#C25B4F) | Critical, Damaged, Blocked |
| Info | River (#5B8FA3) | Neutral Info |

## Typography

### Font Families
- **UI**: Inter (Sans) - Approachable, legible
- **Data**: JetBrains Mono (Mono) - Timestamps, coordinates, IDs

### Scale
| Token | Size | Line Height | Usage |
|-------|------|------------|-------|
| `text-xs` | 12px | 16px | Captions |
| `text-sm` | 14px | 20px | Labels, Body Small |
| `text-base` | 16px | 24px | Body Default |
| `text-lg` | 18px | 28px | Intros |
| `text-xl` | 20px | 28px | H3 |
| `text-2xl` | 24px | 32px | H2 |
| `text-3xl` | 28px | 36px | H1 |

## Spacing

### Base Unit: 8px
| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight groupings |
| `space-4` | 16px | Base Unit (Comfortable standard) |
| `space-6` | 24px | Section spacing (Relaxed) |
| `space-20` | 80px | **Critical** Mobile Dock clearance |

## Responsive

| Breakpoint | Width | Pattern |
|-----------|-------|---------|
| Mobile | < 640px | Single column, full width cards, `px-4` |
| Tablet | 640-1023px | 2-column grid, `px-6` |

## Purple Ban

**NEVER use purple/violet/indigo as primary brand color unless explicitly requested.**

Our brand uses Forest (greens) + Sunrise (orange). Purple is forbidden.