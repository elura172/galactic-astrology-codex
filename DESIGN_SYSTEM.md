# Celestial Archival Instrument — Visual System

## Design thesis

The interface is a working celestial instrument housed inside an archival object. It
alternates between two scales:

1. **The desk instrument** — compact, labeled, tactile, and operational.
2. **The Astral chamber** — sparse, monumental, and entered through selection.

The visual language combines Hilma af Klint's symbolic geometry, Teenage
Engineering's legible instrument controls, the severe negative space of *Control's*
Astral Plane, and the physical history of letterpress occult ephemera. These are
references, not templates to imitate.

## Principles

- Geometry explains the canon. Ornament never obscures position, number, or relation.
- The manuscript remains the source of truth; the interface is a lens over it.
- Gold behaves like printed pigment, not generic neon.
- Motion reveals state changes and relationships. Nothing rotates merely to look alive.
- Every glyph remains reachable by pointer, keyboard, search, and textual index.
- Scientific metadata and symbolic interpretation remain visually distinguishable.

## Palette

| Token | Value | Use |
|---|---|---|
| Astral black | `#090a0a` | Chamber ground and deepest field |
| Archive paper | `#e7dfca` | Instrument surface and reading panels |
| Carbon ink | `#20201d` | Primary text and plotted geometry |
| Quiet ink | `#6f6b60` | Metadata and secondary rules |
| Vow gold | `#b68b3a` | 108° chord, active vow, canonical selection |
| Signal blue | `#7696a8` | Catalogue bodies and technical state |
| Invoked rose | `#a46370` | Venus, Uranus, and Mirai seats |
| Deep violet | `#665778` | Axial courts and Astral thresholds |
| Oxide red | `#9c503d` | Warnings, rupture, and Flame Gate |

The twelve faces use muted mineral variations derived from these pigments. Color is
always paired with a number, label, or line style.

## Typography

- **Display:** high-contrast editorial serif, uppercase used sparingly.
- **Interface:** neutral grotesk with compact proportions.
- **Data:** monospaced numerals for seats, catalogue IDs, angles, and orbs.
- Letterpress character comes from slight ink spread, offset shadows, and rule weight;
  never from making body text difficult to read.

## Geometry

- Twelve face sectors hold nine seats each.
- Ten band faces form the decagonal working wheel.
- Nadir and Zenith occupy the axis rather than pretending to be ordinary band rings.
- Nine Seams use doubled or dashed connectors.
- Five chord families have fixed signatures:
  - Step 36° — fine single rule
  - Gift 72° — paired rule
  - Vow 108° — gold rule with terminal points
  - Spiral 144° — curved rule
  - Mirror 180° — full diameter

## Surface and texture

- Paper grain is subtle and stationary.
- Registration drift appears only on large headings and seals.
- Rules vary slightly in density, as if printed, while interactive targets remain exact.
- No photographic parchment, fake torn edges, or theatrical grunge.

## Motion

- Idle breath: 8–12 seconds, limited to one selected field.
- Selection: 180–260 ms for instrument response.
- Chord drawing: 420–700 ms, ordered from nearest to farthest relation.
- Chamber transition: 700–900 ms using scale and negative space, not a 3D camera fly.
- `prefers-reduced-motion` removes all nonessential interpolation.

## Primary interface states

1. **Threshold** — title, census, one deliberate entry action.
2. **Mandala / Rings** — operational 108-seat instrument.
3. **Faces** — twelve lineage-to-face pairings.
4. **Chords** — five relationship grammars around a selected seat.
5. **Glyph chamber** — one voice, its office, seam, lineage, and mirror phrase.
6. **Reading workspace** — private chart calculation using the sanitized template.
7. **Library** — searchable canonical prose with stable anchors.

## Accessibility and integrity

- Minimum 44px interactive controls outside the dense plot; SVG nodes receive larger
  invisible hit targets.
- Visible focus states use a double-rule rather than color alone.
- Selection is announced through a live text region.
- Private natal data never enters source control or browser persistence by default.
- Astronomical measurements display their source and orb; poetic readings are labeled
  as interpretation.
