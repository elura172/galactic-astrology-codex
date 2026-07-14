import test from 'node:test'
import assert from 'node:assert/strict'
import { chartAngles, houseForLongitude, lineageHouseResonance, MAJOR_BODIES, wholeSignHouses, zonedDateTime } from '../src/chart.js'

test('resolves a confirmed IANA timezone at the historical instant', () => {
  assert.equal(zonedDateTime('2000-01-01T07:00', 'America/Toronto').toISOString(), '2000-01-01T12:00:00.000Z')
  assert.equal(zonedDateTime('2000-07-01T08:00', 'America/Toronto').toISOString(), '2000-07-01T12:00:00.000Z')
  assert.throws(() => zonedDateTime('2024-03-10T02:30', 'America/Toronto'), /does not exist/)
})

test('derives four internally consistent chart angles', () => {
  const angles = chartAngles(new Date('2000-01-01T12:00:00.000Z'), 0, 0)
  assert.ok(Math.abs(angles.ascendant - 11.37) < .05)
  assert.ok(Math.abs(angles.midheaven - 281.38) < .05)
  assert.equal(angles.descendant, (angles.ascendant + 180) % 360)
  assert.equal(angles.imumCoeli, (angles.midheaven + 180) % 360)
})

test('declares the ten major-body ephemeris targets', () => {
  assert.equal(MAJOR_BODIES.length, 10)
  assert.deepEqual(MAJOR_BODIES.map(body => body.name), ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'])
})

test('constructs a transparent whole-sign wheel from the Ascendant sign', () => {
  const houses = wholeSignHouses(47.2)
  assert.deepEqual(houses.map(house => house.cusp), [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 0])
  assert.equal(houseForLongitude(31, houses), 1)
  assert.equal(houseForLongitude(359, houses), 11)
  assert.equal(houseForLongitude(5, houses), 12)
})

test('keeps lineage face and natal house as separate resonance dimensions', () => {
  const glyphs = [{ number: 1, groupIndex: 0 }, { number: 2, groupIndex: 0 }, { number: 10, groupIndex: 1 }]
  const placements = new Map([[1, { longitude: 31 }], [2, { longitude: 61 }], [10, { longitude: 62 }]])
  assert.deepEqual(lineageHouseResonance(glyphs, placements, wholeSignHouses(47)), [
    { house: 1, groupIndex: 0, seats: [1] },
    { house: 2, groupIndex: 0, seats: [2] },
    { house: 2, groupIndex: 1, seats: [10] },
  ])
})
