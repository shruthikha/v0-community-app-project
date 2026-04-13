---
name: tone-of-voice-compliance
description: Enforces Nido's bilingual brand voice for user-facing content. References tone-of-voice.md for personality, language requirements (Spanish/English), and content guidelines. Use when writing user guides, release notes, UI copy, or UserJot posts.
---

# Tone of Voice Compliance

All user-facing content must match Nido's brand personality and bilingual requirements.

## When to Use

- Writing user-facing release notes (Output 2 of `release-notes-draft`)
- Writing UserJot post drafts
- Writing UI copy, error messages, empty states
- Writing user guides in `docs/user/`
- Reviewing content-writer output

## Brand Voice Reference

Source: `docs/dev/tone-of-voice.md`

### Personality Traits
- **Warm** — welcoming, community-oriented, never corporate
- **Clear** — explain simply, no jargon for residents
- **Empowering** — help people do things, don't lecture
- **Nature-connected** — eco-village context, sustainability mindset

### Tone Spectrum
| Context | Tone |
|---------|------|
| Feature announcement | Excited but grounded |
| Error message | Helpful, never blaming |
| Admin guide | Professional but approachable |
| Onboarding | Encouraging, step-by-step |

## Bilingual Requirements

Nido serves eco-village communities in Costa Rica. User-facing content must be available in both:

- **Spanish** (primary for most residents)
- **English** (for international community members)

### Process
1. Write content in English first (for review)
2. Translate to Spanish (maintaining tone, not literal translation)
3. Both versions in the same file or parallel files depending on context

### Translation Notes
- Use Latin American Spanish, not Peninsular
- Eco-village terminology should feel natural, not translated
- When in doubt about terminology, check with MJ

## Content Patterns

### Error Messages
```
❌ "Error 422: Unprocessable entity"
✅ "We couldn't save your changes. Please check the highlighted fields and try again."
✅ "No pudimos guardar tus cambios. Por favor revisa los campos marcados e intenta de nuevo."
```

### Empty States
```
❌ "No data found."
✅ "No events yet! Create one to bring the community together."
✅ "¡Aún no hay eventos! Crea uno para reunir a la comunidad."
```

### Success Messages
```
❌ "Operation successful."
✅ "Your event has been created! Community members will be notified."
✅ "¡Tu evento ha sido creado! Los miembros de la comunidad serán notificados."
```

## Checklist

Before publishing any user-facing content:
- [ ] Matches brand voice (warm, clear, empowering)
- [ ] Available in both English and Spanish
- [ ] No technical jargon visible to end users
- [ ] Error messages are helpful, not blaming
- [ ] Empty states suggest a next action
