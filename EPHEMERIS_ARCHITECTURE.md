# Ephemeris Architecture

## Canonical rule

Seat numbers are not zodiac bins. Each catalogue-backed seat names a real minor
planet or other body. A reading therefore computes that body's actual geocentric
ecliptic longitude for the requested instant, then compares it with planets, chart
angles, gates, and other glyph bodies. The 108-seat order remains an interpretive
index and never substitutes for measured sky position.

## Calculation layers

1. **Ephemeris adapter** returns timestamped longitudes with body identifiers,
   reference frame, observer center, and source metadata.
2. **Chart engine** derives planets and, when exact time and place are available, the
   Ascendant, Midheaven, Descendant, Imum Coeli, and houses.
3. **Codex engine** joins catalogue identifiers to canonical seats and offices.
4. **Reading engine** measures conjunctions, clusters, gates, and the five chords.
5. **Interpretation layer** applies the sanitized natal reading template while
   keeping astronomical claims distinct from symbolic interpretation.

## Provider boundary

JPL Horizons is the preferred verification source for catalogue-backed minor planets:
numbered asteroids are addressed by their IAU number followed by a semicolon. Because
a complete reading involves roughly 96 unique catalogue bodies, requests should run
through a local service with bounded concurrency and a durable cache keyed by body,
instant, center, and reference frame. The browser should receive one normalized chart
payload rather than making scores of direct third-party calls.

The adapter must expose its source and calculation assumptions. A future offline
Swiss Ephemeris adapter may implement the same normalized payload when its asteroid
files and licensing choice are settled.

## Privacy boundary

- Birth date, time, coordinates, and name remain transient by default.
- No browser persistence, analytics payload, repository file, or remote log may
  contain birth data without explicit consent.
- Place search is separate from the ephemeris calculation and should discard the
  original place string after coordinates and timezone are confirmed.
- Export is explicit and local. The canonical repository stores templates and code,
  never a person's completed reading.

## Normalized placement shape

```js
{
  id: '1;',
  seat: 83,
  name: 'Ceres',
  longitude: 123.456789,
  latitude: -2.14,
  timestamp: '2000-01-01T12:00:00.000Z',
  center: 'geocentric',
  frame: 'ecliptic-of-date',
  source: 'NASA/JPL Horizons'
}
```

Numeric precision is preserved for calculation; the interface rounds only for
display. Missing or approximate angles must be labeled rather than silently inferred.
