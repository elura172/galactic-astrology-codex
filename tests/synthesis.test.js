import test from 'node:test'
import assert from 'node:assert/strict'
import { composeTransmission, evidenceScore, rankEvidence } from '../src/synthesis.js'

test('ranks measured precision and repeated support above weaker suggestions', () => {
  const exact = { kind: 'court', tier: 'exact', orb: .2, count: 1 }
  const whisper = { kind: 'court', tier: 'whisper', orb: 2.8, count: 1 }
  assert.ok(evidenceScore(exact) > evidenceScore(whisper))
  const ranked = rankEvidence([whisper, exact])
  assert.equal(ranked[0].tier, 'exact')
  assert.ok(ranked[0].score > ranked[1].score)
})

test('penalizes approximate angles without discarding their evidence', () => {
  assert.ok(evidenceScore({ kind: 'angle', tier: 'exact' }) > evidenceScore({ kind: 'angle', tier: 'exact', confidence: 'approximate' }))
})

test('composes only from supplied evidence and preserves traceability', () => {
  const records = [
    { id: 'a', kind: 'cluster', count: 5, transmission: 'The gathering speaks.' },
    { id: 'b', kind: 'chord', tier: 'lattice', orb: .1, transmission: 'The chord answers.' },
    { id: 'c', kind: 'resonance', transmission: '' },
  ]
  const result = composeTransmission(records, 2)
  assert.deepEqual(result.passages, result.evidence.map(item => item.transmission))
  assert.ok(result.evidence.every(item => records.some(record => record.id === item.id)))
})
