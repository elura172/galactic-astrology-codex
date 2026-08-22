import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const engine = await import('../dist-phone/codex-data.js')

const glyphs = engine.parseCodex(readFileSync(join(root, 'codex_of_celestial_glyphs.md'), 'utf8'))
const INSTANT = '1988-03-12T04:32:00Z'

function pass(options = {}) {
  const longitudes = engine.fixtureLongitudes(glyphs)
  const natal = [...engine.planetLongitudes(INSTANT), { name: 'Moon', longitude: engine.moonLongitude(INSTANT) }]
  const live = engine.planetLongitudes(INSTANT).filter(planet => ['Sun', 'Venus', 'Mars'].includes(planet.name))
  return engine.computeReading(glyphs, longitudes, natal, live, { instant: INSTANT, ...options })
}

// The interface calls these by name. Losing one breaks the phone build at
// runtime, in a canvas artifact that cannot be rebuilt from source.
const INTERFACE_EXPORTS = [
  'GROUPS', 'chordDestinations', 'chordSigilDataUri', 'computeReading',
  'dodecaFaceDataUri', 'dodecaFaces', 'fetchGlyphLongitudes',
  'fetchGlyphLongitudesDirect', 'fixtureLongitudes', 'latticeDataUri',
  'lineageSigilDataUri', 'moonLongitude', 'parseCodex', 'parseLineages',
  'planetLongitudes', 'seamCounterpart', 'sigilDataUri',
]

test('the generated module keeps every export the interface calls', () => {
  for (const name of INTERFACE_EXPORTS) {
    assert.ok(name in engine, `the phone interface calls mod.${name}, which the build no longer exports`)
  }
})

test('the committed build matches its sources', () => {
  // Guards the failure this whole script exists to prevent: src/ moving on
  // while the phone keeps running a stale hand-copied engine.
  execFileSync('node', [join(root, 'scripts/build-phone-engine.js'), '--check'], { cwd: root })
})

test('seam seats survive placement, where a name-keyed map loses one of each pair', () => {
  const longitudes = engine.fixtureLongitudes(glyphs)
  const seated = engine.placementsBySeat(longitudes.placements, glyphs)
  const seamPairs = new Map()
  glyphs.filter(glyph => glyph.seam).forEach(glyph => {
    seamPairs.set(glyph.name, [...(seamPairs.get(glyph.name) || []), glyph.number])
  })

  assert.ok(seamPairs.size > 0, 'the codex should contain seam names')
  for (const [name, seats] of seamPairs) {
    for (const seat of seats) {
      assert.ok(seated.has(seat), `seam seat ${seat} (${name}) was dropped from the placement map`)
    }
  }

  const distinctNames = new Set([...seated.values()].map(placement => placement.name)).size
  assert.ok(seated.size > distinctNames, 'keying by seat must recover seats that name-keying collapses')
})

test('every named reading layer computes rather than being described', () => {
  const reading = pass()

  assert.ok(reading.conjunctions.length > 0, 'i · exact conjunctions')
  assert.ok(reading.courts.length > 0, 'ii · planetary courts')
  assert.ok(reading.cluster && reading.cluster.members.length > 1, 'iii · densest cluster')
  assert.equal(reading.gates.occupancy.length, 10, 'v · all ten gates reported')
  assert.equal(
    reading.gates.loudest.length + reading.gates.silent.length, 10,
    'v · every gate is either occupied or recorded as silent',
  )
  assert.ok(reading.lattice.chords.length > 0, 'vi · chord lattice')
  assert.ok(reading.synthesis.passages.length > 0, 'vii · synthesis')
  assert.equal(typeof reading.synthesis.sentence, 'string')
  assert.ok(reading.synthesis.sentence.length > 0, 'vii · a final sentence')
})

test('silence in the gates is reported, never omitted', () => {
  const reading = pass()
  for (const gate of reading.gates.occupancy) {
    assert.equal(typeof gate.silent, 'boolean')
    assert.equal(gate.silent, gate.contacts.length === 0)
  }
  assert.equal(reading.gates.walk.steps.length, 10, 'the initiatory walk covers all ten gates')
})

test('the four angles stay silent without a birthplace, and are flagged with one', () => {
  assert.equal(pass().angles, null, 'no place means no angles — never inferred')
  assert.equal(pass().angleConfidence, null)

  const located = pass({ birthplace: 'Kyoto, Japan' })
  assert.ok(Array.isArray(located.angles), 'a known city yields angles')
  assert.equal(located.angles.length, 4)
  assert.deepEqual(located.angles.map(angle => angle.label), ['Ascendant', 'Midheaven', 'Descendant', 'Imum Coeli'])
  assert.equal(located.angleConfidence, 'exact', 'a city carries an IANA zone')

  const coordinates = pass({ birthplace: '35.0116, 135.7681' })
  assert.equal(coordinates.angleConfidence, 'approximate', 'bare coordinates cannot fix the instant to a zone')

  assert.equal(pass({ birthplace: 'Rivendell' }).angles, null, 'an unresolved place stays silent')
})

test('chords keep the field names the lattice renderer joins on', () => {
  const reading = pass()
  for (const chord of reading.chords) {
    assert.equal(typeof chord.name, 'string', 'the interface prints chord.name')
    assert.equal(typeof chord.first, 'string', 'latticeDataUri matches chord.first against point names')
    assert.equal(typeof chord.second, 'string')
    assert.ok(Number.isFinite(chord.angle))
    assert.ok(Number.isFinite(chord.orb))
  }
  // The renderer joins chord ends to `points` by name; an end with no matching
  // point silently draws nothing, so the two sides must agree.
  const names = new Set(reading.lattice.chords.flatMap(chord => [chord.first, chord.second]))
  assert.ok(names.size > 0, 'chord ends are named')
})

test('the synthesis packet carries traceable evidence under the generation contract', () => {
  const packet = pass({ birthplace: 'Kyoto, Japan' }).packet
  assert.ok(packet, 'a packet is produced')
  assert.equal(packet.schema, 'celestial-glyphs/synthesis-packet/v1')
  assert.equal(packet.generationContract.evidenceOnly, true)
  assert.equal(packet.generationContract.preserveMeasuredSilence, true)
  assert.ok(packet.evidence.length > 0)
  for (const item of packet.evidence) {
    assert.equal(typeof item.measurement, 'string')
    assert.ok(item.measurement.length > 0, 'every evidence row states its measurement')
  }
})

test('the phone display overlay covers the canon exactly', () => {
  assert.equal(engine.GROUPS.length, 12)
  for (const group of engine.GROUPS) {
    assert.ok(group.name.startsWith('The '), `phone display name expected for ${group.gate}`)
    assert.ok(['upper', 'lower', 'axial'].includes(group.course))
    assert.ok(group.lineage, 'the canonical lineage survives the overlay')
  }
  for (const chord of engine.CHORDS) {
    assert.ok(chord.className, 'chord class names survive for the interface')
  }
})

test('seam seats do not duplicate the chords they form', () => {
  // A seam body occupies two seats at one longitude, so both seats form the
  // same geometric chord to any third point. The seats are real; the second row
  // is not \u2014 it renders as the same chord written backwards.
  const reading = pass({ birthplace: 'Kyoto, Japan' })
  const keys = reading.lattice.chords.map(chord => [chord.first, chord.second].sort().join(' ') + chord.name)
  assert.equal(new Set(keys).size, keys.length, 'the lattice lists each chord once')

  for (const chord of reading.lattice.chords) {
    assert.notEqual(chord.first, chord.second, 'a seam body cannot chord with itself')
  }
})

test('synthesis prose names a seam body once, not twice', () => {
  // Seat counts keep both seats (the measurement is about seats); the prose is
  // about bodies, and "Anubis, Anubis" reads as a fault rather than as a seam.
  const reading = pass({ birthplace: 'Kyoto, Japan' })
  for (const passage of reading.synthesis.passages) {
    const listed = passage.match(/court of \\d+: ([^.]+)\\./)
    if (!listed) continue
    const names = listed[1].split(',').map(part => part.replace(/\\(at both its seats\\)/, '').trim())
    assert.equal(new Set(names).size, names.length, `a name repeats in: ${passage}`)
  }
})

test('functions handed an ISO timestamp survive the canonical julianDate signature', () => {
  // The canon's julianDate takes a Date; several phone functions hold an ISO
  // string. The export-surface guard cannot see this — the export still exists,
  // only its signature moved — and the failure is silent: horizonsUrl threw,
  // the direct-Horizons fetch was caught, and the app fell through to fixtures
  // while reporting a sandbox problem it did not have.
  const instant = '1988-03-12T04:32:00Z'

  const url = engine.horizonsUrl('1;', instant)
  const julian = Number(decodeURIComponent(url.match(/TLIST=([^&]+)/)[1]).replace(/'/g, ''))
  assert.ok(Number.isFinite(julian), 'TLIST must carry a finite Julian date')
  assert.equal(julian.toFixed(5), engine.julianDate(new Date(instant)).toFixed(5))
  assert.ok(julian > 2447000 && julian < 2447500, `Julian date ${julian} is not near 1988`)

  // The same trap, in the two Keplerian entry points.
  assert.ok(engine.planetLongitudes(instant).every(p => Number.isFinite(p.longitude)))
  assert.ok(Number.isFinite(engine.moonLongitude(instant)))
})

test('a flaky batch is retried rather than costing the whole reading', async () => {
  // The failure this guards: one batch of twelve failing threw out every real
  // placement and fell back to fixtures, so the app rendered a complete-looking
  // reading of illustrative numbers with only a sentence in the note to say so.
  const realFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async (url, options) => {
    calls += 1
    const { bodies, timestamp } = JSON.parse(options.body)
    if (calls === 2) return { ok: false, status: 503, json: async () => ({ error: 'busy' }) }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        timestamp,
        placements: bodies.map((b, i) => ({ command: b.command, name: b.name, longitude: (i * 7) % 360, latitude: 0 })),
      }),
    }
  }
  try {
    const longitudes = await engine.fetchGlyphLongitudes(glyphs, INSTANT, '/api/ephemeris')
    const expected = engine.uniqueBodies(glyphs).length
    assert.equal(longitudes.placements.length, expected, 'every body survives a transient failure')
    assert.ok(calls > Math.ceil(expected / 8), 'the failed batch was retried')
  } finally {
    globalThis.fetch = realFetch
  }
})

test('a refused request is not retried forever', async () => {
  const realFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls += 1
    return { ok: false, status: 400, json: async () => ({ error: 'Every body requires a numeric Horizons command.' }) }
  }
  try {
    await assert.rejects(
      engine.fetchGlyphLongitudes(glyphs, INSTANT, '/api/ephemeris'),
      /numeric Horizons command/,
    )
    assert.equal(calls, 1, 'a 400 is final — retrying it only delays the fallback')
  } finally {
    globalThis.fetch = realFetch
  }
})

test('the service path reports progress while it works', async () => {
  // A reading is 96 bodies in twelve round trips — 10-20s on a cold service.
  // The direct-Horizons path reported progress; the path actually used did not,
  // so the interface sat silent and re-pressable for the whole fetch.
  const realFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    const { bodies, timestamp } = JSON.parse(options.body)
    return {
      ok: true,
      status: 200,
      json: async () => ({ timestamp, placements: bodies.map((b, i) => ({ command: b.command, name: b.name, longitude: i, latitude: 0 })) }),
    }
  }
  try {
    const seen = []
    const longitudes = await engine.fetchGlyphLongitudes(glyphs, INSTANT, '/api/ephemeris', p => seen.push(p))
    const total = engine.uniqueBodies(glyphs).length

    assert.ok(seen.length > 2, 'progress is reported per batch, not only at the end')
    assert.deepEqual(seen[0], { completed: 0, total }, 'the first report lands before any waiting')
    assert.deepEqual(seen.at(-1), { completed: total, total }, 'the last report accounts for every body')
    assert.ok(seen.every(p => p.total === total), 'the total never moves')
    for (let i = 1; i < seen.length; i += 1) {
      assert.ok(seen[i].completed >= seen[i - 1].completed, 'progress never goes backwards')
    }
    assert.equal(longitudes.placements.length, total)
  } finally {
    globalThis.fetch = realFetch
  }
})

test('a city name shared by two countries is a question, not a guess', () => {
  // "Portland, Maine" used to resolve to Oregon: the table keyed on the bare
  // city name and took the first match, so the reading carried an ascendant
  // computed 4,000 km and three hours from the actual birth, with nothing said.
  const bare = engine.resolveBirthplace('Portland')
  assert.ok(bare.ambiguous, 'a shared name resolves to nothing on its own')
  assert.equal(bare.ambiguous.length, 2)
  assert.ok(bare.ambiguous.every(place => place.country && place.label.includes(place.country)))

  const maine = engine.resolveBirthplace('Portland, Maine')
  assert.equal(maine.admin, 'Maine')
  assert.equal(maine.timeZone, 'America/New_York')

  const oregon = engine.resolveBirthplace('Portland, Oregon')
  assert.equal(oregon.timeZone, 'America/Los_Angeles')
  assert.notEqual(maine.longitude, oregon.longitude)

  for (const name of ['Athens', 'Tripoli', 'Santiago', 'Cambridge']) {
    assert.ok(engine.resolveBirthplace(name).ambiguous, `${name} names more than one place`)
  }
})

test('a birthplace resolves across spelling, accents and country order', () => {
  assert.equal(engine.resolveBirthplace('Bogotá').label, 'Bogota, Colombia')
  assert.equal(engine.resolveBirthplace('bogota, colombia').label, 'Bogota, Colombia')
  assert.equal(engine.resolveBirthplace('  KYOTO  ').label, 'Kyoto, Japan')
  assert.equal(engine.resolveBirthplace('Athens, Georgia, United States').country, 'United States')
  assert.equal(engine.resolveBirthplace('Rivendell'), null)

  const coords = engine.resolveBirthplace('35.01, 135.77')
  assert.equal(coords.source, 'coordinates')
  assert.equal(coords.timeZone, null, 'coordinates carry no zone, so angles stay approximate')
  assert.equal(engine.resolveBirthplace('91, 0'), null, 'an impossible latitude is not a place')
})

test('an ambiguous birthplace leaves the angles silent and says why', () => {
  const reading = pass({ birthplace: 'Portland' })
  assert.equal(reading.angles, null, 'no angles are computed from a question')
  assert.equal(reading.birthplace, null)
  assert.ok(Array.isArray(reading.ambiguousPlaces), 'the candidates are carried for the interface to ask with')
  assert.equal(reading.ambiguousPlaces.length, 2)

  const settled = pass({ birthplace: 'Portland, Oregon' })
  assert.ok(settled.angles, 'naming the state settles it')
  assert.equal(settled.angleConfidence, 'exact')
})

test('every place in the table is well formed', () => {
  const labels = engine.placeLabels()
  assert.equal(labels.length, engine.knownPlaceCount())
  assert.equal(new Set(labels).size, labels.length, 'no two places share a label')
  for (const label of labels) {
    const place = engine.resolveBirthplace(label)
    assert.ok(place && !place.ambiguous, `a full label must resolve on its own: ${label}`)
    assert.ok(Math.abs(place.latitude) <= 90 && Math.abs(place.longitude) <= 180, `coordinates out of range: ${label}`)
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en', { timeZone: place.timeZone }), `invalid zone: ${label}`)
  }
})
