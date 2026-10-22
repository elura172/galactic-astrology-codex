// Deterministic sample chart (golden-angle spread). Illustrative only — never a real sky.
export function computeSampleReading(glyphs) {
  const lonByName = new Map()
  glyphs.forEach(g => { if (!lonByName.has(g.name)) lonByName.set(g.name, (g.number * 137.50776405) % 360) })
  const unique = [...lonByName.entries()].map(([name, longitude]) => {
    const g = glyphs.find(x => x.name === name)
    return { name, longitude, glyph: g }
  })
  const L = name => lonByName.get(name) || 0
  const natal = [
    { name: 'Sun', longitude: L('Pallas Athene') + 0.31 },
    { name: 'Moon', longitude: L('Psyche') + 0.87 },
    { name: 'Mercury', longitude: L('Hermes') + 1.62 },
    { name: 'Venus', longitude: L('Aphrodite') + 0.12 },
    { name: 'Mars', longitude: L('Eris') + 2.41 },
    { name: 'Jupiter', longitude: L('Logos') + 0.55 },
    { name: 'Saturn', longitude: L('Orcus') + 1.08 },
    { name: 'Uranus', longitude: L('Prometheus') + 0.05 },
    { name: 'Neptune', longitude: L('Salacia') + 2.9 },
    { name: 'Pluto', longitude: L('Persephone') + 0.72 },
  ]
  const conjunctions = []
  natal.forEach(p => unique.forEach(u => {
    const c = conjunction(u.longitude, p.longitude)
    if (c) conjunctions.push({ glyph: u.glyph, planet: p.name, ...c })
  }))
  conjunctions.sort((a, b) => a.orb - b.orb)
  const courts = natal.map(p => ({
    planet: p.name,
    contacts: conjunctions.filter(c => c.planet === p.name)
  })).filter(c => c.contacts.length).sort((a, b) => b.contacts.length - a.contacts.length)
  const points = [...unique.map(u => ({ name: u.name, longitude: u.longitude, glyph: u.glyph })), ...natal.map(p => ({ name: p.name, longitude: p.longitude }))]
  const tierRank = { lattice: 0, working: 1, whisper: 2 }
  const chords = []
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    const c = decagonalChord(points[i].longitude, points[j].longitude)
    // Repo `decagonalChord` names the family `aspect`; the interface binds `name`.
    if (c) chords.push({ first: points[i].name, second: points[j].name, ...c, name: c.aspect })
  }
  chords.sort((a, b) => tierRank[a.tier] - tierRank[b.tier] || a.orb - b.orb)
  const live = [
    { name: 'Sun', longitude: L('Polyhymnia') + 0.22 },
    { name: 'Venus', longitude: L('Juno') + 0.64 },
    { name: 'Mars', longitude: L('Hekate') + 1.35 },
  ]
  const activations = []
  live.forEach(p => unique.forEach(u => {
    const c = conjunction(u.longitude, p.longitude)
    if (c) activations.push({ glyph: u.glyph, planet: p.name, ...c })
  }))
  activations.sort((a, b) => a.orb - b.orb)
  return { conjunctions: conjunctions.slice(0, 6), courts: courts.slice(0, 3), chords: chords.slice(0, 5), activations: activations.slice(0, 3) }
}
