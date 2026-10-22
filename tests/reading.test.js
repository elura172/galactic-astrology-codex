import test from 'node:test'
import assert from 'node:assert/strict'
import { angleContacts, crossChartActivations, decagonalNodeContacts, densestCluster, planetaryCourts, populatedCourts, strongestChords } from '../src/reading.js'

const glyphs = [
  { number: 1, name: 'Near Sun' },
  { number: 2, name: 'Near Ascendant' },
  { number: 3, name: 'Silent' },
]
const placements = new Map([
  [1, { longitude: 10.4 }],
  [2, { longitude: 359 }],
  [3, { longitude: 100 }],
])
const bodies = [{ command: '10', name: 'Sun' }, { command: '301', name: 'Moon' }]

test('builds planetary courts from measured conjunctions and preserves empty courts', () => {
  const courts = planetaryCourts(glyphs, placements, [{ command: '10', longitude: 10 }], bodies)
  assert.equal(courts.length, 2)
  assert.equal(courts[0].contacts[0].glyph.number, 1)
  assert.ok(Math.abs(courts[0].contacts[0].orb - .4) < 1e-9)
  assert.equal(courts[1].contacts.length, 0)
  assert.deepEqual(populatedCourts(courts).map(court => court.body.name), ['Sun'])
})

test('builds all four angle records and carries approximation status', () => {
  const records = angleContacts(glyphs, placements, {
    ascendant: 0, midheaven: 90, descendant: 180, imumCoeli: 270,
  }, 'approximate')
  assert.equal(records.length, 4)
  assert.equal(records[0].contacts[0].glyph.number, 2)
  assert.equal(records[0].contacts[0].orb, 1)
  assert.ok(records.every(record => record.confidence === 'approximate'))
  assert.deepEqual(angleContacts(glyphs, placements, null), [])
})

test('finds a circular cluster across the Pisces-Aries boundary and counts unique bodies', () => {
  const clusterGlyphs = [
    { number: 1, catalogueId: { horizonsCommand: '1;' } },
    { number: 2, catalogueId: { horizonsCommand: '1;' } },
    { number: 3, catalogueId: { horizonsCommand: '2;' } },
    { number: 4, catalogueId: { horizonsCommand: '3;' } },
  ]
  const clusterPlacements = new Map([
    [1, { command: '1;', longitude: 358 }], [2, { command: '1;', longitude: 358 }],
    [3, { command: '2;', longitude: 1 }], [4, { command: '3;', longitude: 80 }],
  ])
  const cluster = densestCluster(clusterGlyphs, clusterPlacements)
  assert.equal(cluster.members.length, 2)
  assert.deepEqual(cluster.seats, [1, 2, 3])
  assert.equal(cluster.span, 3)
  assert.equal(cluster.center, 359.5)
})

test('ranks chord families by tier and orb with a per-family limit', () => {
  const lattice = strongestChords([
    { id: 'a', longitude: 0 }, { id: 'b', longitude: 36.1 },
    { id: 'c', longitude: 72.8 }, { id: 'd', longitude: 180 },
  ], 1)
  assert.equal(lattice.get('Step').length, 1)
  assert.equal(lattice.get('Step')[0].tier, 'lattice')
  assert.equal(lattice.get('Mirror')[0].orb, 0)
})

test('excludes inevitable angle-axis chords from interpretive ranking', () => {
  const lattice = strongestChords([
    { id: 'asc', kind: 'angle', longitude: 0 },
    { id: 'dsc', kind: 'angle', longitude: 180 },
    { id: 'glyph', kind: 'glyph', longitude: 36 },
  ])
  assert.ok(!(lattice.get('Mirror') || []).some(contact => contact.first.kind === 'angle' && contact.second.kind === 'angle'))
  assert.equal(lattice.get('Step')[0].second.kind, 'glyph')
})

test('derives explicit live-to-natal glyph contacts and planetary chords', () => {
  const glyphs = [{ number: 1, name: 'First' }, { number: 2, name: 'Second' }]
  const natalPlacements = new Map([[1, { longitude: 10 }], [2, { longitude: 90 }]])
  const natalPlanets = [{ command: '10', name: 'Natal Sun', longitude: 82 }]
  const livePlanets = [{ command: '499', name: 'Live Mars', longitude: 10.5 }]
  const result = crossChartActivations(glyphs, natalPlacements, natalPlanets, livePlanets)
  assert.equal(result.glyphContacts.length, 1)
  assert.equal(result.glyphContacts[0].natal.glyph.number, 1)
  assert.equal(result.glyphContacts[0].tier, 'exact')
  assert.equal(result.planetaryChords.length, 1)
  assert.equal(result.planetaryChords[0].aspect, 'Gift')
  assert.ok(Math.abs(result.planetaryChords[0].orb - .5) < .001)
})

test('decagonalNodeContacts maps planetary and glyph conjunctions to the 10 Golden Node gates', () => {
  const testNodes = [
    { index: 1, angle: 0, gate: 'Vow Crown', face: 'I', lineage: 'Vega' },
    { index: 2, angle: 36, gate: 'Signal Path', face: 'II', lineage: 'Lyra' },
  ]
  const testGlyphs = [
    { number: 1, name: 'Near Node 1' },
    { number: 2, name: 'Far Away' },
  ]
  const testPlacements = new Map([
    [1, { longitude: 0.4 }],
    [2, { longitude: 180 }],
  ])
  const testPlanets = [
    { command: '399', name: 'Earth', symbol: '⊕', longitude: 35.8 },
  ]

  const records = decagonalNodeContacts(testGlyphs, testPlacements, testPlanets, testNodes)
  assert.equal(records.length, 2)
  // Node 1 (0°) has glyph 1 at 0.4° (orb 0.4, exact)
  assert.equal(records[0].node.gate, 'Vow Crown')
  assert.equal(records[0].contacts.length, 1)
  assert.equal(records[0].contacts[0].kind, 'glyph')
  assert.equal(records[0].contacts[0].glyph.number, 1)
  assert.equal(records[0].contacts[0].tier, 'exact')
  assert.ok(Math.abs(records[0].contacts[0].orb - 0.4) < 1e-9)

  // Node 2 (36°) has Earth at 35.8° (orb 0.2, exact)
  assert.equal(records[1].node.gate, 'Signal Path')
  assert.equal(records[1].contacts.length, 1)
  assert.equal(records[1].contacts[0].kind, 'planet')
  assert.equal(records[1].contacts[0].name, 'Earth')
  assert.equal(records[1].contacts[0].tier, 'exact')
  assert.ok(Math.abs(records[1].contacts[0].orb - 0.2) < 1e-9)
})

