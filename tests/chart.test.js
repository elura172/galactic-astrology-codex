import test from 'node:test'
import assert from 'node:assert/strict'
import { chartAngles, MAJOR_BODIES, zonedDateTime } from '../src/chart.js'

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
