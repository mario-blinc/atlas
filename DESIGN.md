# ATLAS design

A personal AI command centre in dark brushed steel: cinematic, moody, ultra modern. Think a Stark workshop HUD, built with standard controls so it stays a working tool. Dark only, by design.

## Layout

- **Top bar** (60px): reactor mark and ATLAS wordmark, Personal / Blinc switch in the centre, clock, voice settings, avatar. A light seam runs along its lower edge.
- **Rail** (252px, left): Protocols (quick prompts) and Agents (Blinc only).
- **Stage** (centre, max 720px, vertically centred): the reactor core, greeting, live status, reply console, composer, prompt chips.
- **Today** (360px, right): schedule timeline, then Systems (each source with an online/offline LED).
- Under 1180px the Today panel drops below the stage in two columns. Under 860px the rail becomes a drawer and the mode switch moves into it.

## Material

- **Plate:** brushed steel. Fine horizontal grain over a cold vertical falloff, 1px steel border, bevel (light top edge, dark bottom edge), deep soft drop shadow.
- **Brackets:** machined corner brackets in ion, on the reply console and the dialog only.
- **Ground:** near-black with a cold light pool behind the core, plus fixed film grain.
- **Radius:** 4px everywhere (2px inside segmented controls).

## Tokens

Defined in `client/src/index.css`.

| Role | Value |
|---|---|
| Void | `#07080a` |
| Steel | `950 #0b0d10`, `900 #101318`, `850 #14181e`, `800 #1a1f26`, `700 #232931`, `600 #2f363f` |
| Lines | steel at 8% / 13% / 22% |
| Text | `#e4e9ef`, secondary `#9aa3ae`, tertiary `#7a838e` |
| Ion (sole accent) | `#9fd6ff`, hover `#c6e7ff`, ink `#04121e` |
| Alert | `#ff6b5e` |

Ion is only for live state (now, listening, online), the primary action, the selected mode or agent, and the core.

## Type

- **Michroma** (wide, Eurostile-like): wordmark, greeting, panel titles, mode switch. Uppercase, tracked 0.06 to 0.36em.
- **Geist Sans**: all interface and reading text.
- **Geist Mono**: times, temperatures, values, status.

All three are self-hosted via `@fontsource`.

## Signature: the reactor core

`ReactorCore.js` is a canvas with a tick ring and scanner sweep, a segmented arc ring, dashed and hairline rings, a waveform ring and a white-hot plasma core. State sets speed and intensity: idle, listening, thinking (fast spin, fast sweep) and speaking. While ATLAS speaks, the waveform reads the real ElevenLabs audio through a Web Audio analyser. It stays static under reduced motion.

## Motion

- **Boot sequence (GSAP):** the top seam draws, panels power on with a clip reveal, the core spins up, the greeting decodes, then content rises in. It replays on Daddy's Home. Skipped under reduced motion.
- **Everything else:** 150 to 300ms CSS transitions for state changes only. Replies power on with a clip reveal.

## Rules

- No emoji, no cyan neon, no gradient text.
- Sources that aren't wired up say "Not connected", with the LED off. Sample data is labelled as sample.
- Every control has hover, focus-visible, active and disabled states.
