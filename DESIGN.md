# ATLAS design

A polished dark assistant, held to the craft level of Raycast and Linear. Working tool first: standard controls, calm surfaces, one accent. Used mostly on a laptop at the desk.

## Layout

- **Rail** (248px, left): wordmark, Personal / Blinc switch, quick prompts, agents (Blinc only), clock.
- **Assistant** (centre, max 640px): greeting with the orb, reply, composer, prompt chips.
- **Today** (340px, right): schedule, then the overview list of sources.
- Under 1120px the Today panel drops below the assistant in two columns; under 860px the rail becomes a drawer.

## Tokens

Defined in `client/src/index.css`.

| Role | Value |
|---|---|
| Ground | `--bg #0f1013`, rail `--bg-rail #0b0c0e` |
| Surfaces | `--surface #16171b`, `--surface-2 #1c1d22`, hover `#22232a` |
| Lines | `rgba(255,255,255,.07)`, strong `.12` |
| Text | `#ededef`, secondary `#a1a1aa`, tertiary `#80808a` |
| Accent | `--accent #f09456` (warm ember), soft fill at 12% |
| States | danger `#f07171`, success `#5cc08a` |
| Radius | 6 / 10 / 14px |

The accent is only for primary actions, current selection, live state (now, listening) and the orb. Never decoration.

## Type

Geist (400/500/600) for everything. Fixed scale: 12.5, 13.5, 14, 15, 26px. Tabular figures for times and numbers. No display or mono faces.

## Icons

Phosphor (`@phosphor-icons/react`), regular weight, 15–18px. No emoji or unicode glyphs as icons.

## Motion

150–250ms, ease-out `cubic-bezier(.16,1,.3,1)`, state changes only. The orb is the one signature element: its colour and movement show idle, listening, thinking and speaking. It goes still under reduced motion.

## Rules

- No hero-number cards, eyebrow labels, gradient text or glow halos.
- Sources that aren't wired up say "Not connected". Sample data is labelled as sample.
- Every control has hover, focus-visible, active and disabled states.
