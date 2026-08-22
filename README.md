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

## The frame

The Codex is read **from the Sun**. Bodies are fetched heliocentrically
(`CENTER '500@10'`, the Sun's body centre rather than the barycentre), and the
frame is part of every cache key — a placement's centre is part of its identity,
and without that a geocentric longitude answers a heliocentric request with
nothing to show for it.

Two frames do not hold the same bodies at different angles; they hold different
bodies. From the Sun there is no Sun to plot, the Moon has no longitude distinct
from Earth's, and Earth is where the reader stands rather than a body in the
field. So the chart carries eight planets, Mercury through Pluto, plus the 96
catalogue bodies of the canon.

**The four angles do not exist here.** Ascendant and Midheaven are where the
ecliptic meets a horizon and a meridian at a place on a turning planet; from the
Sun's centre there is no horizon for them to stand on. The layer is absent
rather than silent, and birth *place* is not asked for. Birth time matters much
less than it does in an Earth-centred chart — heliocentric longitudes move
slowly enough that an unknown hour is a small uncertainty rather than a ruinous
one.

The geocentric frame remains implemented and tested (`frame: 'geocentric'`),
along with the angles, the house wheel and the 260-place birthplace resolver.
None of it is reachable from the app; it is dormant, not deleted.

The ten gates are the decagon: the dodecahedron seen down its Zenith–Nadir axis,
its ten band faces projecting to a ring anchored at the Galactic Centre, 36°
apart. The five chords — 36°, 72°, 108°, 144°, 180° — are the complete set of
distances between that decagon's vertices, edge through diameter.

## The ephemeris

Readings need measured positions, and a browser cannot fetch them itself: JPL
Horizons sends no `Access-Control-Allow-Origin` and answers `OPTIONS` with 405.
So the app talks to the Codex ephemeris service, which proxies Horizons —
`api/ephemeris.js` on Vercel, or `npm run sky` locally. Without it the app falls
back to fixtures and says so in the reading note.

Set `SKY_ORIGIN` to narrow the allowed origin, `SKY_HOST=0.0.0.0` to reach the
local service from a phone on a trusted network.
