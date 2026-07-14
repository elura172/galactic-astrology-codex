const TIER_WEIGHT = { exact: 34, lattice: 34, working: 22, whisper: 10 }
const KIND_WEIGHT = { cluster: 46, angle: 42, court: 40, chord: 34, resonance: 24 }

export function evidenceScore(evidence) {
  const kind = KIND_WEIGHT[evidence.kind] || 0
  const tier = TIER_WEIGHT[evidence.tier] || 0
  const multiplicity = Math.min(evidence.count || 1, 8) * 3
  const precision = Number.isFinite(evidence.orb) ? Math.max(0, 6 - evidence.orb * 3) : 0
  const confidence = evidence.confidence === 'approximate' ? -12 : 0
  return kind + tier + multiplicity + precision + confidence
}

export function rankEvidence(records) {
  return records.map((record, index) => ({ ...record, score: evidenceScore(record), sourceIndex: index }))
    .sort((first, second) => second.score - first.score || first.sourceIndex - second.sourceIndex)
}

export function composeTransmission(records, limit = 4) {
  const ranked = rankEvidence(records).filter(record => record.transmission)
  const selected = []
  const representedKinds = new Set()
  ranked.forEach(record => {
    if (selected.length < limit && !representedKinds.has(record.kind)) {
      selected.push(record)
      representedKinds.add(record.kind)
    }
  })
  ranked.forEach(record => {
    if (selected.length < limit && !selected.includes(record)) selected.push(record)
  })
  selected.sort((first, second) => second.score - first.score || first.sourceIndex - second.sourceIndex)
  if (!selected.length) return {
    passages: ['The measured field is quiet. No synthesis should be made larger than that silence.'],
    evidence: [],
  }
  return {
    passages: selected.map(record => record.transmission),
    evidence: selected,
  }
}

export function chordTransmission(aspect, first, second) {
  const language = {
    Step: `A Step carries the work of ${first} toward ${second}. Receive it as an apprenticeship: something is being handed forward, and readiness matters.`,
    Gift: `A Gift opens naturally between ${first} and ${second}. What moves easily here still asks to be tended, practiced, and offered with care.`,
    Vow: `A Vow binds ${first} with ${second} across a passage of change. The bond may be old; its living purpose must still be chosen with open eyes.`,
    Spiral: `A Spiral weaves ${first} and ${second} across the long arc. Its pattern may disclose itself slowly, through work whose completion cannot be hurried.`,
    Mirror: `A Mirror places ${first} across from ${second}. Neither side is the whole; recognition waits at the center that can hold them both.`,
  }
  return language[aspect] || `${aspect} brings ${first} and ${second} into relationship.`
}

export function composeActivationTransmission(activations, limit = 3) {
  const tierRank = { exact: 0, lattice: 0, working: 1, whisper: 2 }
  const glyphRecords = activations.glyphContacts.map(contact => ({
    kind: 'glyph activation', tier: contact.tier, orb: contact.orb,
    measurement: `${contact.live.name} conjunct natal ${contact.natal.glyph.name} · orb ${contact.orb.toFixed(3)}°`,
    transmission: `${contact.live.name} now meets the natal seat of ${contact.natal.glyph.name}. Its office of ${contact.natal.glyph.function.toLowerCase()} comes into the present field: notice where recognition is already occurring, without requiring an outcome.`,
  }))
  const chordRecords = activations.planetaryChords.map(contact => ({
    kind: 'planetary chord', tier: contact.tier, orb: contact.orb,
    measurement: `${contact.live.name} ${contact.aspect} natal ${contact.natal.name} · orb ${contact.orb.toFixed(3)}°`,
    transmission: chordTransmission(contact.aspect, `live ${contact.live.name}`, `natal ${contact.natal.name}`),
  }))
  const ranked = [...glyphRecords, ...chordRecords].sort((first, second) => tierRank[first.tier] - tierRank[second.tier] || first.orb - second.orb)
  const selected = []
  ;[glyphRecords, chordRecords].forEach(group => {
    const strongest = group.sort((first, second) => tierRank[first.tier] - tierRank[second.tier] || first.orb - second.orb)[0]
    if (strongest && selected.length < limit) selected.push(strongest)
  })
  ranked.forEach(record => {
    if (selected.length < limit && !selected.includes(record)) selected.push(record)
  })
  selected.sort((first, second) => tierRank[first.tier] - tierRank[second.tier] || first.orb - second.orb)
  return selected.length ? {
    passages: selected.map(record => record.transmission), evidence: selected,
    closing: 'This is present weather around the natal field: a condition to meet, not a verdict about what follows.',
  } : {
    passages: ['The comparison field is quiet within the declared orbs. Nothing needs to be made louder than that silence.'], evidence: [],
    closing: 'A measured silence is also part of the weather.',
  }
}

function conciseTheme(theme) {
  return theme?.split(/[;,—]/)[0].trim().replace(/[.!?]+$/, '')
}

export function finalSentence(records) {
  const themes = rankEvidence(records).flatMap(record => record.themes || []).map(conciseTheme).filter(Boolean)
  const unique = [...new Set(themes.map(theme => theme.toLowerCase()))]
  if (!unique.length) return 'The chart remains quiet enough that no final sentence should be forced.'
  if (unique.length === 1) return `This chart returns to ${unique[0]}, asking that it be recognized before it is interpreted.`
  return `This chart gathers ${unique[0]} with ${unique[1]}, asking that neither be carried without the other.`
}
