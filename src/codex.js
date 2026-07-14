export const GROUPS = [
  { short: 'I', name: 'Memory Keepers', lineage: 'Vega', gate: 'Vow Crown' },
  { short: 'II', name: 'Sound & Word Weavers', lineage: 'Lyra', gate: 'Signal Path' },
  { short: 'III', name: 'Sacred Devotionals', lineage: 'Arcturus', gate: 'Dream Circuit' },
  { short: 'IV', name: 'Chaos Catalysts', lineage: 'Orion', gate: 'Flame Gate' },
  { short: 'V', name: 'Beauty Makers', lineage: 'Aldebaran', gate: 'Mirror-Bond' },
  { short: 'VI', name: 'Teachers & Patterners', lineage: 'Sirius', gate: 'Codex Mirror' },
  { short: 'VII', name: 'Deathwalkers', lineage: 'Antares', gate: 'Threshold Warden' },
  { short: 'VIII', name: 'Innovators & Futurists', lineage: 'Andromeda', gate: 'Bio-Architect' },
  { short: 'IX', name: 'Lovers & Relationals', lineage: 'Alpha Centauri', gate: 'Heart Beacon' },
  { short: 'X', name: 'Earth Stewards', lineage: 'Pleiades', gate: 'Earth Grid' },
  { short: 'N', name: 'Deep Court', lineage: 'Galactic Core', gate: 'Nadir' },
  { short: 'Z', name: 'Crown Court', lineage: 'Polaris', gate: 'Zenith' },
]

export const CHORDS = [
  { offset: 1, name: 'Step', angle: '36°', className: 'step' },
  { offset: 2, name: 'Gift', angle: '72°', className: 'gift' },
  { offset: 3, name: 'Vow', angle: '108°', className: 'vow' },
  { offset: 4, name: 'Spiral', angle: '144°', className: 'spiral' },
  { offset: 5, name: 'Mirror', angle: '180°', className: 'mirror' },
]

const clean = value => value
  ?.replace(/\*+/g, '')
  .replace(/\s+/g, ' ')
  .trim() || ''

export function parseCodex(markdown) {
  const entries = []
  const pattern = /^\*\*(\d{2,3})\. ([^*]+)\*\* — ([^\n]+)\n([\s\S]*?)(?=^\*\*\d{2,3}\. |^## |^# |(?![\s\S]))/gm
  let match
  while ((match = pattern.exec(markdown))) {
    const body = match[4]
    const field = (name, next) => clean(body.match(new RegExp(`${name}:\\s*([\\s\\S]*?)(?=\\n${next}:)`))?.[1])
    entries.push({
      number: Number(match[1]),
      name: clean(match[2]),
      catalogue: clean(match[3]),
      function: field('Function', 'Craft Thread'),
      craft: field('Craft Thread', 'Mirror Phrase'),
      mirror: clean(body.match(/Mirror Phrase:\s*([^\n]+)/)?.[1]),
    })
  }

  const nameCounts = entries.reduce((counts, entry) => {
    counts.set(entry.name, (counts.get(entry.name) || 0) + 1)
    return counts
  }, new Map())

  return entries.map(entry => ({
    ...entry,
    groupIndex: Math.floor((entry.number - 1) / 9),
    seam: nameCounts.get(entry.name) > 1,
    invoked: ['Venus', 'Uranus', 'Mirai'].includes(entry.name),
  }))
}

export function seamCounterpart(glyph, glyphs) {
  if (!glyph.seam) return null
  return glyphs.find(candidate => candidate.name === glyph.name && candidate.number !== glyph.number) || null
}

export function chordDestinations(glyph, glyphByNumber) {
  if (glyph.groupIndex > 9) return []
  const within = (glyph.number - 1) % 9
  return CHORDS.map(chord => ({
    chord,
    target: glyphByNumber.get(((glyph.groupIndex + chord.offset) % 10) * 9 + within + 1),
  }))
}

export function adjacentFaces(glyph) {
  const within = (glyph.number - 1) % 9
  const faceIndexes = glyph.groupIndex < 10
    ? [(glyph.groupIndex + 9) % 10, (glyph.groupIndex + 1) % 10]
    : glyph.groupIndex === 10 ? [0, 2, 3, 6, 9] : [1, 4, 5, 7, 8]
  return faceIndexes.map((groupIndex, index) => ({
    groupIndex,
    number: groupIndex * 9 + within + 1,
    relation: glyph.groupIndex < 10 ? (index === 0 ? 'Previous face' : 'Next face') : 'Adjoining course',
  }))
}

export function relatedGlyphNumbers(glyph, glyphs) {
  const glyphByNumber = new Map(glyphs.map(candidate => [candidate.number, candidate]))
  const counterpart = seamCounterpart(glyph, glyphs)
  const candidates = [
    counterpart?.number,
    ...adjacentFaces(glyph).map(face => face.number),
    ...chordDestinations(glyph, glyphByNumber).map(destination => destination.target.number),
  ]
  return [...new Set(candidates.filter(number => number && number !== glyph.number))]
}

export function classifiedRelationships(glyph, glyphs) {
  const glyphByNumber = new Map(glyphs.map(candidate => [candidate.number, candidate]))
  const counterpart = seamCounterpart(glyph, glyphs)
  const relationships = [
    ...(counterpart ? [{ type: 'seam', label: 'Nine Seam', target: counterpart }] : []),
    ...adjacentFaces(glyph).map(face => ({
      type: glyph.groupIndex > 9 ? 'course' : 'face',
      label: face.relation,
      target: glyphByNumber.get(face.number),
    })),
    ...chordDestinations(glyph, glyphByNumber).map(({ chord, target }) => ({
      type: `chord-${chord.className}`,
      label: `${chord.name} ${chord.angle}`,
      target,
    })),
  ]

  return relationships.filter(relationship => relationship.target)
}
