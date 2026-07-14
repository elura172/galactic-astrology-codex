import test from 'node:test'
import assert from 'node:assert/strict'
import { angleContacts, planetaryCourts, populatedCourts } from '../src/reading.js'

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
