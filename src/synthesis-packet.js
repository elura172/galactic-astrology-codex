export function buildSynthesisPacket({ chartKind, angleConfidence, evidence, glyphs, groups, chords }) {
  if (!['birth', 'live'].includes(chartKind)) throw new TypeError('Synthesis packet requires a birth or live chart kind.')
  const seats = [...new Set(evidence.flatMap(item => item.canonicalSeats || []).filter(Number.isInteger))]
  const canonicalSources = seats.map(seat => {
    const glyph = glyphs.find(candidate => candidate.number === seat)
    if (!glyph) throw new RangeError(`Canonical seat ${seat} is not present in the codex.`)
    const face = groups[glyph.groupIndex]
    return {
      seat: glyph.number,
      name: glyph.name,
      function: glyph.function,
      craftThread: glyph.craft,
      mirrorPhrase: glyph.mirror,
      lineageFace: { short: face.short, name: face.name, lineage: face.lineage, gate: face.gate },
    }
  })
  const chordNames = new Set(evidence.map(item => item.chordFamily).filter(Boolean))
  return {
    schema: 'celestial-glyphs/synthesis-packet/v1',
    chart: { kind: chartKind, angleConfidence: chartKind === 'birth' ? angleConfidence || 'unknown' : null },
    evidence: evidence.map(item => ({
      id: item.id,
      kind: item.kind,
      measurement: item.measurement,
      tier: item.tier || null,
      orb: Number.isFinite(item.orb) ? item.orb : null,
      confidence: item.confidence || null,
      canonicalSeats: [...new Set(item.canonicalSeats || [])],
      chordFamily: item.chordFamily || null,
    })),
    canonicalSources,
    chordSources: chords.filter(chord => chordNames.has(chord.name)).map(chord => ({ name: chord.name, angle: chord.angle })),
    generationContract: {
      evidenceOnly: true,
      noPrediction: true,
      noDiagnosis: true,
      preserveMeasuredSilence: true,
      requireTraceableParagraphs: true,
    },
  }
}
