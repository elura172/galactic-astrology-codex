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
