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
