import test from 'node:test'
import assert from 'node:assert/strict'
import { angleContacts, densestCluster, planetaryCourts, populatedCourts, strongestChords } from '../src/reading.js'

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
