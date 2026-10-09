# ATLAS design

Soft steel glass. Dark and moody, but fluid and calm rather than techy: rounded glass shells, pill controls, a liquid core, and spring motion that settles instead of stopping. The aim is always the best experience for daily use. Dark only, by design.

## Layout

- **Islands** (top, floating): ATLAS mark and wordmark on the left, the Personal / Blinc switch in a centred pill, and clock, voice settings and avatar in a right pill.
- **Rail** (252px shell, left): Protocols (quick prompts) and Agents (Blinc only).
- **Stage** (centre, max 680px, vertically centred): the liquid core, greeting, status pill, summary, reply, composer, prompt chips.
- **Today** (360px shell, right): schedule timeline, then Connections.
- Everything floats with a 14px gutter. Under 1180px, Today drops below the stage in two columns. Under 860px, the rail becomes a floating drawer and the mode switch moves into it.

## Material

- **Shell (double bezel):** a hairline tray (`rgba(255,255,255,.022)`, 1px hairline, 26px radius, 6px padding) holding a glass core (translucent steel, top sheen, deep soft shadow, 20px radius). Pills use the same structure at full radius.
- **Ground:** near-black with three slow-drifting light pools (ion and steel), plus fixed film grain.
- **Radii:** shell 26, core 20, list items 12, controls fully round.

## Tokens

Defined in `client/src/index.css`.

| Role | Value |
|---|---|
| Void | `#06070a` |
| Glass | `rgba(20,24,31,.62)`, raised `rgba(28,33,42,.72)`, hover `rgba(38,45,56,.6)` |
| Hairlines | 7% and 12% steel |
| Text | `#eaeef3`, secondary `#a2abb6`, tertiary `#7d8691` |
| Ion (sole accent) | `#9fd6ff` to `#c6e7ff`, ink `#051321` |
| Alert | `#ff7a6e` |
| Easing | fluid `cubic-bezier(.32,.72,0,1)`, out `cubic-bezier(.16,1,.3,1)` |

Ion is only for live state, the primary action, the selected mode or agent, and the core.

## Type

Geist Sans for everything, sentence case. The greeting is 30 to 42px, weight 500, tracked -0.035em. Tabular figures throughout. Phosphor icons in the Light weight.

## Signature: the liquid core

`LiquidCore.js` is a canvas glass sphere. A smooth blob surface sits over a drifting inner current, with a specular highlight, a soft halo and two orbits with a gliding light. While ATLAS speaks, the rim ripples with the real ElevenLabs audio through a Web Audio analyser. Listening swells it and thinking speeds the inner swirl. It stays still under reduced motion.

## Motion (Framer Motion)

- **Entrance:** islands, rail, stage and panels lift in from a blur with a staggered spring. It replays on Daddy's Home.
- **Shared layout:** the mode indicator glides between options, a hover highlight glides between rail items, and the active-agent highlight slides.
- **Replies:** settle in from a blur, and the composer glides down to make room.
- **Micro-interactions:** pressing scales controls to 0.94 to 0.97, and the send arrow lifts on hover.
- **Not used here:** GSAP, because the Taste rules say not to mix it with Motion in one tree.

## Rules

- No uppercase-tracked labels, monospace, ticks, brackets or HUD chrome.
- Sources that aren't wired up say "Not connected", with the status dot off. Sample data is labelled as sample.
- Every control has hover, focus-visible, active and disabled states.
