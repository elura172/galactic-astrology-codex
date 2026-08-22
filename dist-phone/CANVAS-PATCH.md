# Wiring the phone UI to the real engine

The phone app is a Claude Design canvas artifact, so it can't be regenerated
from this repo — its component is edited in the canvas. This file lists the
exact changes that connect the shipped interface to `dist-phone/codex-data.js`.

**First:** replace the canvas's `codex-data.js` resource with
`dist-phone/codex-data.js` (rebuild it with `npm run build:phone`). Every export
the interface calls keeps its name and shape, so the app keeps rendering
immediately after the swap.

It is not finished at that point, though. **Step 2's deletion of the hand-built
`reading.points` line is required, not optional** — the old line runs *after*
`computeReading` returns and overwrites the complete point list with a
names-only one, so the chord lattice draws nothing for any end the old list
doesn't know. Do step 2 in the same sitting as the swap. Steps 3 and 4 can
follow later; they surface layers that are computed either way.

---

## 1 · Hold the birthplace in state

The Birthplace input currently has no `value` and no handler, so what's typed
there never reaches the engine. In `state = { … }`:

```js
state = { tab: 'wheel', ringIndex: null, seat: null, lineage: null, begun: false, glyphs: [], lineages: [], birthPlace: '', threshold: !localStorage.getItem('glcx_threshold_crossed') };
```

In the `renderVals()` return object, beside `setBirthDate` / `setBirthTime`:

```js
      birthPlace: this.state.birthPlace || '',
      setBirthPlace: (e) => this.setState({ birthPlace: e.target.value }),
```

And bind the input (the one labelled *Birthplace*):

```html
<input value="{{ birthPlace }}" sc-camel-on-change="{{ setBirthPlace }}"
       placeholder="City — or 51.5, -0.12"
       style="background:transparent; border:0; border-bottom:1px solid rgba(10,14,21,0.22); font-family:'Spectral',serif; font-size:16px; color:#0A0E15; padding:10px 0; outline:none;">
```

## 2 · Pass the place and the instant into the reading

In `computeReadingPass()`, the `computeReading` call takes a fifth argument.
Replace:

```js
    const reading = this.mod.computeReading(glyphs, lonByName, natal, live);
```

with:

```js
    const reading = this.mod.computeReading(glyphs, lonByName, natal, live, {
      instant,
      birthplace: this.state.birthPlace,
    });
```

Delete the line just below it that rebuilds `reading.points` by hand:

```js
    reading.points = [...[...lonByName.entries()].map(([name, longitude]) => ({ name, longitude })), ...natal.map(p => ({ name: p.name, longitude: p.longitude, planet: true }))];
```

`computeReading` now returns `points` itself, covering seats, planets *and* the
four angles. The hand-built list held names only, so once the lattice can reach
an angle, an angle-ended chord would find no point to draw to and vanish
silently.

Then let the note report what the angles actually did — replace the trailing
`'. No house angles without the service.'` with:

```js
      + (reading.angles
        ? `. Angles: ${reading.angleConfidence} for ${reading.birthplace.label}.`
        : '. Angles: silent — no birthplace resolved.')
```

## 3 · Expose the new layers to the interface

In `demoVals()`, extend `empty` and the returned object:

```js
    const empty = { demoActivations: [], demoConjunctions: [], demoCourts: [], demoChords: [], demoGates: [], demoBraid: [], demoAngles: [], demoCluster: null, demoSilence: '', demoSynthesis: '', demoSentence: '', readingNote: '' };
```

```js
      demoGates: d.gates.loudest.slice(0, 5).map(g => ({
        gate: 'Gate ' + g.gate, name: g.name, phase: g.phase,
        count: g.contacts.length + (g.contacts.length === 1 ? ' contact' : ' contacts'),
        tightest: g.contacts[0].glyph ? g.contacts[0].glyph.name : g.contacts[0].point.name,
        orb: deg(g.contacts[0].orb),
      })),
      demoSilence: d.gates.silent.length
        ? d.gates.silent.map(g => g.name).join(' · ') + ' — silent, and recorded as part of the reading.'
        : 'No gate is silent in this sky.',
      demoCluster: d.cluster && d.cluster.members.length > 1 ? {
        span: d.cluster.span.toFixed(2) + '°',
        count: d.cluster.members.length + ' bodies',
        centre: d.cluster.center.toFixed(2) + '°',
        members: d.cluster.members.map(m => m.name).join('  —  '),
      } : null,
      demoAngles: d.angles ? d.angles.map(a => ({
        label: a.label,
        degree: a.longitude.toFixed(2) + '°',
        contacts: a.contacts.length
          ? a.contacts.map(c => c.glyph.name + ' · ' + deg(c.orb)).join('  —  ')
          : 'no seat within orb',
      })) : [],
```

The office braid is the layer most directly on the codex's telos — which
vocations this sky names *more than once*, across different gates:

```js
      demoBraid: d.gates.braid.slice(0, 4).map(b => ({
        ring: 'Ring ' + b.ring,
        office: b.office,
        lineage: b.lineage,
        reach: b.gates.length + ' gates · ' + b.seats.length + ' seats',
        home: b.atHomeGate ? 'speaking from its own gate' : 'spoken from elsewhere',
      })),
```

Replace the hand-rolled `demoSynthesis` line with the canon's own synthesis:

```js
      demoSynthesis: d.synthesis.passages.join('\n\n'),
      demoSentence: d.synthesis.sentence,
```

## 4 · Markup for the three layers that had none

Layers **iv**, **v** and **iii** are named in `readingLayers` but have no
sections. Add these beside the existing ones — same visual grammar, so they read
as part of the same instrument.

```html
<!-- v · The Ten Gates -->
<div style="margin-top:48px; display:flex; align-items:baseline; justify-content:space-between;">
  <div style="font-family:'Cormorant Garamond',serif; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#7A7466;">The Ten Gates</div>
  <div style="font-size:11px; color:#7A7466;">Occupied first</div>
</div>
<div style="margin-top:8px; border-top:1px solid rgba(10,14,21,0.10); display:flex; flex-direction:column;">
  <sc-for list="{{ demoGates }}" as="g" hint-placeholder-count="5">
    <div style="padding:15px 0; border-bottom:1px solid rgba(10,14,21,0.10);">
      <div style="display:flex; align-items:baseline; justify-content:space-between; gap:12px;">
        <div style="font-size:13px;"><span style="font-family:'Cormorant Garamond',serif; font-size:16px;">{{ g.name }}</span> · {{ g.gate }}</div>
        <div style="font-size:11px; color:#7A7466;">{{ g.orb }} · {{ g.count }}</div>
      </div>
      <div style="margin-top:4px; font-size:12px; font-style:italic; color:#7A7466;">{{ g.phase }} — tightest {{ g.tightest }}</div>
    </div>
  </sc-for>
</div>
<p style="margin:12px 0 0; font-size:12px; line-height:1.7; font-style:italic; color:#7A7466;">{{ demoSilence }}</p>

<!-- v(b) · The Office Braid -->
<div style="margin-top:40px; display:flex; align-items:baseline; justify-content:space-between;">
  <div style="font-family:'Cormorant Garamond',serif; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#7A7466;">The Office Braid</div>
  <div style="font-size:11px; color:#7A7466;">Stated more than once</div>
</div>
<div style="margin-top:8px; border-top:1px solid rgba(10,14,21,0.10); display:flex; flex-direction:column;">
  <sc-for list="{{ demoBraid }}" as="b" hint-placeholder-count="4">
    <div style="padding:15px 0; border-bottom:1px solid rgba(10,14,21,0.10);">
      <div style="display:flex; align-items:baseline; justify-content:space-between; gap:12px;">
        <div style="font-family:'Cormorant Garamond',serif; font-size:16px;">{{ b.office }}</div>
        <div style="font-size:11px; color:#7A7466;">{{ b.reach }}</div>
      </div>
      <div style="margin-top:4px; font-size:12px; font-style:italic; color:#7A7466;">{{ b.ring }} · {{ b.lineage }} — {{ b.home }}</div>
    </div>
  </sc-for>
</div>

<!-- iii · The Densest Cluster -->
<sc-if value="{{ demoCluster }}">
<div style="margin-top:48px; display:flex; align-items:baseline; justify-content:space-between;">
  <div style="font-family:'Cormorant Garamond',serif; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#7A7466;">The Densest Cluster</div>
  <div style="font-size:11px; color:#7A7466;">{{ demoCluster.span }} span</div>
</div>
<div style="margin-top:8px; border-top:1px solid rgba(10,14,21,0.10); padding:16px 0;">
  <div style="display:flex; align-items:baseline; justify-content:space-between;">
    <div style="font-family:'Cormorant Garamond',serif; font-size:17px;">{{ demoCluster.count }}</div>
    <div style="font-size:11px; color:#7A7466;">centred {{ demoCluster.centre }}</div>
  </div>
  <div style="margin-top:6px; font-size:12px; font-style:italic; color:#7A7466;">{{ demoCluster.members }}</div>
</div>
</sc-if>

<!-- iv · The Four Angles -->
<div style="margin-top:48px; display:flex; align-items:baseline; justify-content:space-between;">
  <div style="font-family:'Cormorant Garamond',serif; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#7A7466;">The Four Angles</div>
  <div style="font-size:11px; color:#7A7466;">Requires a birthplace</div>
</div>
<div style="margin-top:8px; border-top:1px solid rgba(10,14,21,0.10); display:flex; flex-direction:column;">
  <sc-for list="{{ demoAngles }}" as="an" hint-placeholder-count="4">
    <div style="padding:15px 0; border-bottom:1px solid rgba(10,14,21,0.10);">
      <div style="display:flex; align-items:baseline; justify-content:space-between; gap:12px;">
        <div style="font-family:'Cormorant Garamond',serif; font-size:16px;">{{ an.label }}</div>
        <div style="font-size:11px; color:#7A7466;">{{ an.degree }}</div>
      </div>
      <div style="margin-top:4px; font-size:12px; font-style:italic; color:#7A7466;">{{ an.contacts }}</div>
    </div>
  </sc-for>
</div>
```

For the existing **Synthesis** section, add the final sentence beneath the
passages:

```html
<div style="margin-top:14px; font-family:'Cormorant Garamond',serif; font-size:15px; line-height:1.6; color:#565047;">{{ demoSentence }}</div>
```

---

## What the layers do without a birthplace

Nothing breaks. `computeReading` returns `angles: null` and the Four Angles
section renders empty — the canon's rule is that angles are flagged, never
inferred, so an unresolved place stays silent rather than guessing coordinates.

`resolveBirthplace` (in `src-phone/places.js`) accepts a city from its built-in
table — which carries an IANA zone, giving `angleConfidence: 'exact'` — or a
bare `lat, lon` pair, which yields `'approximate'` because the entered clock
time can't be fixed to a zone. `src/synthesis.js` already discounts approximate
evidence by 12 points, so an approximate angle ranks below a measured cluster
on its own.

## On the birthplace table

`src-phone/places.js` carries 104 cities with hand-entered coordinates and IANA
zones. The resolver's *behaviour* is tested (a city resolves with an exact zone,
bare coordinates resolve as approximate, an unknown place stays silent), but the
coordinates themselves are unverified data. A wrong latitude yields a plausible
wrong ascendant with no error, so treat that table as the least trustworthy
input in the system — unlike the computed layers, nothing downstream can catch a
typo in it. Entering `lat, lon` directly bypasses it entirely.
