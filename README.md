# Galactic Astrology Codex

## Canonical files

- `codex_of_celestial_glyphs.md` — the primary 108-seat canon, including the Five
  Chords of the Wheel.
- `star_lineage_companion_codex.md` — the twelve ratified Star Lineages, their face
  braid, echo webs, practices, and Outer Court.
- `natal_resonance_template.md` — the sanitized structure and integrity checklist for
  future natal readings.

The `files/` directory preserves the pasted source manuscripts used for the July 2026
canonical merge. Those files are retained as provenance and are not the working canon.
Personal natal readings remain local and are excluded from version control.

## Canon census

- 108 numbered seats, continuous from 01 through 108
- 105 catalogue-backed seats and three invoked-presence seats
- 99 unique voices: 96 distinct catalogue bodies and three invoked presences
- Nine deliberately repeated voices forming the Nine Seams
- Twelve Star Lineages braided one-to-one with the twelve dodecahedral faces
- Thirteen historical phantom-seat repairs, all closed

## Editorial status

The census, face braid, lineage structure, and healing ledger are reconciled. The
canonical manuscripts and sanitized reading template are the baseline for subsequent
interface, editorial, export, and publication work.

## The instrument

The interface is the Claude Design canvas app: a phone-shaped reading instrument
over the canon. It is the only front-end — the earlier Vite explorer was retired
once the canvas version carried the full reading.

```
src/          the canon engine — aspects, gates, angles, clusters, synthesis
src-phone/    phone-only source — renderers, Keplerian planets, ephemeris client
dist-phone/   the generated engine, plus the patched canvas component
phone-shell/  the canvas export, an opaque input carrying fonts and runtime
api/          the ephemeris service as a Vercel function
public/       the assembled page (generated; not committed)
```

`src/` is canonical. The phone engine is assembled from it rather than copied,
because a hand-copy is what let the app drift into naming seven reading layers
while computing four.

```bash
npm run build:phone    # generate dist-phone/codex-data.js from src/ + src-phone/
npm run build:bundle   # assemble public/index.html for deployment
npm run check:phone    # fail if the generated engine is stale
npm test               # 64 tests across the canon and the phone engine
npm run sky            # the ephemeris service locally, on :8787
```

`dist-phone/CANVAS-PATCH.md` records the component edits the canvas needs, and
`DESIGN_SYSTEM.md` the visual direction.

## The ephemeris

Readings need measured positions, and a browser cannot fetch them itself: JPL
Horizons sends no `Access-Control-Allow-Origin` and answers `OPTIONS` with 405.
So the app talks to the Codex ephemeris service, which proxies Horizons —
`api/ephemeris.js` on Vercel, or `npm run sky` locally. Without it the app falls
back to fixtures and says so in the reading note.

Set `SKY_ORIGIN` to narrow the allowed origin, `SKY_HOST=0.0.0.0` to reach the
local service from a phone on a trusted network.
