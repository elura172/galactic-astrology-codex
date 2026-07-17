import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSynthesisPacket } from '../src/synthesis-packet.js'

const glyphs = [{ number: 17, name: 'Archive', function: 'Keeping memory', craft: 'Witnessing', mirror: 'What remains?', groupIndex: 0 }]
const groups = [{ short: 'I', name: 'Memory Keepers', lineage: 'Vega', gate: 'Vow Crown' }]
const chords = [{ name: 'Gift', angle: '72°' }]

test('retrieves canonical sources only by measured seat and whitelists packet fields', () => {
  const packet = buildSynthesisPacket({
    chartKind: 'birth', angleConfidence: 'exact', glyphs, groups, chords,
    evidence: [{ id: 'court:301:17', kind: 'court', measurement: 'Archive conjunct Moon', tier: 'exact', orb: .2, canonicalSeats: [17] }],
  })
  assert.equal(packet.schema, 'celestial-glyphs/synthesis-packet/v1')
  assert.equal(packet.canonicalSources[0].seat, 17)
  assert.equal(packet.canonicalSources[0].lineageFace.lineage, 'Vega')
  assert.deepEqual(Object.keys(packet.evidence[0]), ['id', 'kind', 'measurement', 'tier', 'orb', 'confidence', 'canonicalSeats', 'chordFamily'])
})

test('omits raw natal and location data from the synthesis packet', () => {
  const packet = buildSynthesisPacket({ chartKind: 'live', evidence: [], glyphs, groups, chords })
  const serialized = JSON.stringify(packet).toLowerCase()
  ;['timestamp', 'birthplace', 'latitude', 'longitude', 'timezone', 'reader'].forEach(field => assert.ok(!serialized.includes(field)))
  assert.equal(packet.chart.angleConfidence, null)
})

test('rejects canonical seat references that are not in the codex', () => {
  assert.throws(() => buildSynthesisPacket({
    chartKind: 'birth', evidence: [{ id: 'x', kind: 'court', measurement: 'Unknown', canonicalSeats: [999] }], glyphs, groups, chords,
  }), /not present/)
})
