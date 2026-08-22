// The full reading pass for the phone app.
//
// The shipped phone build computed four things — conjunctions, courts, chords,
// activations — while its interface named seven layers. Layers iv-vii were
// prose. This module runs the canon's real analysis (src/gates.js,
// src/reading.js, src/synthesis.js) behind those names, and keeps the exact
// output shapes the interface already binds to.
//
// Seats, not names: glyph names repeat across the nine seam (`glyph.seam`), so
// a name-keyed map silently drops one of every seam pair. Everything here joins
// through `placementsBySeat`, keyed by seat number.

const CONJUNCTION_RANK = { exact: 0, working: 1, whisper: 2 }
const CHORD_RANK = { lattice: 0, working: 1, whisper: 2 }

// Placements carry the catalogue command; a Map keyed by name cannot express a
// seam. Fetchers attach `.placements` to the Map they return, so prefer it and
// reconstruct only when a caller hands us a bare legacy map.
function placementsFrom(glyphs, source) {
  if (Array.isArray(source)) return source
  if (source && Array.isArray(source.placements)) return source.placements
  const byName = source instanceof Map ? source : new Map()
  const seen = new Map()
  glyphs.forEach(glyph => {
    if (!glyph.catalogueId || !byName.has(glyph.name)) return
    const command = glyph.catalogueId.horizonsCommand
    if (!seen.has(command)) seen.set(command, { command, name: glyph.name, longitude: byName.get(glyph.name) })
  })
  return [...seen.values()]
}

function longitudeView(placementsMap) {
  const view = new Map()
  placementsMap.forEach(placement => {
    if (!view.has(placement.name)) view.set(placement.name, placement.longitude)
  })
  return view
}

function withCommands(planets) {
  return planets.map(planet => {
    const body = MAJOR_BODIES.find(candidate => candidate.name === planet.name)
    return body ? { ...planet, command: body.command } : { ...planet }
  })
}

function themeOf(glyph) {
  return glyph?.function || null
}

// A seam body holds two seats, so a list built from seats names it twice. The
// two seats are a real feature of the canon, but prose that says "Anubis,
// Anubis" reads as a fault rather than as a seam. Name it once, and say so.
function distinctNames(glyphList) {
  const seen = new Set()
  return glyphList.filter(glyph => {
    if (!glyph || seen.has(glyph.name)) return false
    seen.add(glyph.name)
    return true
  }).map(glyph => glyph.name + (glyph.seam ? ' (at both its seats)' : ''))
}

// --- Evidence records feeding src/synthesis.js -------------------------------

function clusterEvidence(cluster, glyphs) {
  if (!cluster || cluster.members.length < 2) return null
  const seats = cluster.seats
  const named = seats.map(seat => glyphs.find(glyph => glyph.number === seat)).filter(Boolean)
  const names = distinctNames(named)
  return {
    id: 'cluster',
    kind: 'cluster',
    count: cluster.members.length,
    orb: cluster.span,
    measurement: `${cluster.members.length} unique bodies within ${cluster.span.toFixed(2)}°, centred ${cluster.center.toFixed(2)}°`,
    canonicalSeats: seats,
    themes: named.map(themeOf).filter(Boolean),
    transmission: names.length
      ? `The densest gathering in this sky holds ${names.slice(0, 4).join(', ')}${names.length > 4 ? ` and ${names.length - 4} more` : ''} inside ${cluster.span.toFixed(2)}°. Read them as one crowded office rather than separate voices: they share a task, and they share its tension.`
      : `A gathering of ${cluster.members.length} bodies closes to ${cluster.span.toFixed(2)}° — concentration without a named seat, which is recorded and not interpreted further.`,
  }
}

function courtEvidence(courts) {
  return courts.filter(court => court.contacts.length).slice(0, 3).map((court, index) => {
    const tightest = court.contacts[0]
    const names = distinctNames(court.contacts.map(contact => contact.glyph))
    return {
      id: `court-${court.body.name.toLowerCase()}`,
      kind: 'court',
      tier: tightest.tier,
      orb: tightest.orb,
      count: court.contacts.length,
      measurement: `${court.body.name} holds ${court.contacts.length} seat${court.contacts.length === 1 ? '' : 's'}; tightest ${tightest.glyph.name} at ${tightest.orb.toFixed(3)}°`,
      canonicalSeats: court.contacts.map(contact => contact.glyph.number),
      themes: court.contacts.map(contact => themeOf(contact.glyph)).filter(Boolean),
      sourceIndex: index,
      transmission: `${court.body.name} keeps a court of ${names.length}: ${names.slice(0, 3).join(', ')}${names.length > 3 ? `, and ${names.length - 3} more` : ''}. These offices are not separate appointments — they answer to one another through the planet that holds them.`,
    }
  })
}

function gateEvidence(loudest) {
  return loudest.slice(0, 3).map(gate => {
    const tightest = gate.contacts[0]
    const label = tightest.glyph?.name ?? tightest.point?.name ?? 'a measured point'
    return {
      id: `gate-${gate.gate}`,
      kind: 'gate',
      tier: tightest.tier,
      orb: tightest.orb,
      count: gate.contacts.length,
      measurement: `Gate ${gate.gate} ${gate.name} occupied by ${label} at ${tightest.orb.toFixed(3)}°`,
      canonicalSeats: gate.contacts.filter(contact => contact.glyph).map(contact => contact.glyph.number),
      themes: [gate.phase].filter(Boolean),
      transmission: `The ${gate.name} is occupied — ${label} stands at ${tightest.orb.toFixed(2)}° from its degree. This is the phase of the walk named "${gate.phase}", and this sky speaks from it rather than passing through.`,
    }
  })
}

function angleEvidence(angles, confidence) {
  if (!angles) return []
  return angles.filter(angle => angle.contacts.length).slice(0, 2).map(angle => {
    const tightest = angle.contacts[0]
    return {
      id: `angle-${angle.key}`,
      kind: 'angle',
      tier: tightest.tier,
      orb: tightest.orb,
      count: angle.contacts.length,
      confidence,
      measurement: `${angle.label} conjunct ${tightest.glyph.name} at ${tightest.orb.toFixed(3)}°${confidence === 'approximate' ? ' (approximate angle)' : ''}`,
      canonicalSeats: angle.contacts.map(contact => contact.glyph.number),
      themes: angle.contacts.map(contact => themeOf(contact.glyph)).filter(Boolean),
      transmission: `${tightest.glyph.name} sits on the ${angle.label}${confidence === 'approximate' ? ', at an angle computed from an approximate instant' : ''}. An angle is where a seat becomes visible to others rather than held privately.`,
    }
  })
}

function chordEvidence(chords) {
  return chords.slice(0, 3).map(chord => ({
    id: `chord-${chord.name}-${chord.first}-${chord.second}`.replace(/\s+/g, '-').toLowerCase(),
    kind: 'chord',
    tier: chord.tier,
    orb: chord.orb,
    chordFamily: chord.name,
    measurement: `${chord.first} ${chord.name} ${chord.second} · ${chord.angle}° · orb ${chord.orb.toFixed(3)}°`,
    canonicalSeats: [chord.firstSeat, chord.secondSeat].filter(Number.isInteger),
    themes: [],
    transmission: chordTransmission(chord.name, chord.first, chord.second),
  }))
}

// --- The pass ----------------------------------------------------------------

/**
 * @param glyphs    parsed codex seats
 * @param source    Map of name→longitude (legacy) carrying `.placements`, or a placements array
 * @param natal     [{ name, longitude }] natal planets, Moon included
 * @param live      [{ name, longitude }] present-sky planets
 * @param options   { instant, birthplace } — birthplace unlocks the Four Angles
 */
export function computeReading(glyphs, source, natal, live, options = {}) {
  const placementList = placementsFrom(glyphs, source)
  const seated = placementsBySeat(placementList, glyphs)
  const lonByName = source instanceof Map ? source : longitudeView(seated)

  const natalWithCommands = withCommands(natal)

  // i. Exact conjunctions — every seat against every natal planet, tightest first.
  const conjunctions = []
  natalWithCommands.forEach(planet => {
    seated.forEach((placement, seat) => {
      const glyph = glyphs.find(candidate => candidate.number === seat)
      if (!glyph) return
      const contact = conjunction(placement.longitude, planet.longitude)
      if (contact) conjunctions.push({ glyph, placement, planet: planet.name, ...contact })
    })
  })
  conjunctions.sort((first, second) =>
    CONJUNCTION_RANK[first.tier] - CONJUNCTION_RANK[second.tier]
    || first.orb - second.orb
    || first.glyph.number - second.glyph.number)

  // ii. The Planetary Courts — one court per natal planet, canon implementation.
  const courts = populatedCourts(planetaryCourts(glyphs, seated, natalWithCommands, MAJOR_BODIES))

  // iii. The Densest Cluster — counted over unique catalogue bodies.
  const cluster = densestCluster(glyphs, seated)

  // iv. The Four Angles — only when a birthplace resolved. Never inferred.
  const place = options.birthplace ? resolveBirthplace(options.birthplace) : null
  let angles = null
  let angleGeometry = null
  let angleConfidence = null
  if (place && options.instant) {
    // Without an IANA zone the entered clock time is read as UTC, which the
    // canon requires be flagged rather than silently trusted.
    angleConfidence = place.timeZone ? 'exact' : 'approximate'
    try {
      angleGeometry = chartAngles(new Date(options.instant), place.latitude, place.longitude)
      angles = angleContacts(glyphs, seated, angleGeometry, angleConfidence)
    } catch {
      angles = null
      angleGeometry = null
      angleConfidence = null
    }
  }

  const anglePoints = angleGeometry ? [
    { name: 'Ascendant', longitude: angleGeometry.ascendant, kind: 'angle' },
    { name: 'Midheaven', longitude: angleGeometry.midheaven, kind: 'angle' },
    { name: 'Descendant', longitude: angleGeometry.descendant, kind: 'angle' },
    { name: 'Imum Coeli', longitude: angleGeometry.imumCoeli, kind: 'angle' },
  ] : []

  // v. The Ten Gates — occupancy, and silence recorded as a finding.
  const gatePoints = [...natalWithCommands.map(planet => ({ name: planet.name, longitude: planet.longitude, kind: 'planet' })), ...anglePoints]
  const occupancy = gateOccupancy(glyphs, seated, gatePoints)
  const loudest = loudestGates(occupancy)
  const silent = silentGates(occupancy)
  const walk = initiatoryWalk(occupancy)
  const braid = officeBraid(occupancy)

  // vi. The Chord Lattice — every separation within orb, tiered.
  const seatPoints = [...seated.entries()].map(([seat, placement]) => ({
    name: placement.name, longitude: placement.longitude, seat, kind: 'seat',
  }))
  const latticePoints = [
    ...seatPoints,
    ...natalWithCommands.map(planet => ({ name: planet.name, longitude: planet.longitude, kind: 'planet' })),
    ...anglePoints,
  ]
  const families = strongestChords(latticePoints)
  // Flattened for the interface: `first`/`second` stay name strings, because the
  // lattice renderer joins them back to `points` by name.
  // A seam body sits at two seats, so both form the same geometric chord to any
  // third point — correct as structure, duplicated as a row. Collapse on the
  // unordered pair plus the chord family, keeping the tightest orb.
  const seenChords = new Map()
  const chords = [...families.entries()]
    .flatMap(([, contacts]) => contacts)
    .filter(contact => {
      const key = [contact.first.name, contact.second.name].sort().join('\u0000') + '\u0000' + contact.aspect
      const previous = seenChords.get(key)
      if (previous !== undefined && previous <= contact.orb) return false
      seenChords.set(key, contact.orb)
      return true
    })
    .map(contact => ({
      name: contact.aspect,
      aspect: contact.aspect,
      angle: contact.angle,
      first: contact.first.name,
      second: contact.second.name,
      firstSeat: contact.first.seat,
      secondSeat: contact.second.seat,
      orb: contact.orb,
      tier: contact.tier,
      separation: contact.separation,
    }))
    .sort((first, second) => CHORD_RANK[first.tier] - CHORD_RANK[second.tier] || first.orb - second.orb)

  // Today's activations — live sky against the natal field.
  const activationSet = crossChartActivations(glyphs, seated, natalWithCommands, live)
  const activations = activationSet.glyphContacts.map(contact => ({
    glyph: contact.natal.glyph,
    planet: contact.live.name,
    orb: contact.orb,
    tier: contact.tier,
  }))
  const activationTransmission = composeActivationTransmission(activationSet)

  // vii. Synthesis — ranked evidence, never exceeding what the chart supports.
  const evidence = [
    clusterEvidence(cluster, glyphs),
    ...angleEvidence(angles, angleConfidence),
    ...courtEvidence(courts),
    ...gateEvidence(loudest),
    ...chordEvidence(chords),
  ].filter(Boolean)

  const transmission = composeTransmission(evidence)
  const sentence = finalSentence(evidence)

  let packet = null
  try {
    packet = buildSynthesisPacket({
      chartKind: 'birth',
      angleConfidence: angleConfidence || 'unknown',
      evidence,
      glyphs,
      groups: GROUPS,
      chords: CHORDS.map(chord => ({ name: chord.name, angle: chord.angle })),
    })
  } catch {
    packet = null
  }

  // The lattice renderer joins chord ends to `points` by name, so every point a
  // chord can reach has to be here — seats, planets and angles alike. The shipped
  // interface built this list itself from seat names plus planets; angles were
  // not in it, so an angle-ended chord would have drawn nothing.
  const points = [
    ...seatPoints.map(point => ({ name: point.name, longitude: point.longitude, seat: point.seat })),
    ...natalWithCommands.map(planet => ({ name: planet.name, longitude: planet.longitude, planet: true })),
    ...anglePoints.map(point => ({ name: point.name, longitude: point.longitude, angle: true })),
  ]

  return {
    // Shapes the shipped interface already binds to.
    points,
    conjunctions: conjunctions.slice(0, 6),
    courts: courts.slice(0, 3).map(court => ({ planet: court.body.name, contacts: court.contacts })),
    chords: chords.slice(0, 5),
    activations: activations.slice(0, 3),

    // Layers iv-vii, now computed rather than described.
    angles,
    angleConfidence,
    angleGeometry,
    birthplace: place,
    gates: { occupancy, loudest, silent, walk, braid },
    cluster,
    lattice: { chords, families: [...families.entries()].map(([family, contacts]) => ({ family, contacts })) },
    synthesis: { ...transmission, sentence, activation: activationTransmission },
    packet,
  }
}
