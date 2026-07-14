import test from 'node:test'
import assert from 'node:assert/strict'
import { placementsBySeat, uniqueMeasuredBodies, zodiacLabel } from '../src/sky.js'

const glyphs = [
  { number: 1, name: 'First face', catalogueId: { horizonsCommand: '57;' } },
  { number: 2, name: 'Seam face', catalogueId: { horizonsCommand: '57;' } },
  { number: 3, name: 'Invoked', catalogueId: null },
]

test('deduplicates ephemeris work while restoring every canonical seat', () => {
  assert.deepEqual(uniqueMeasuredBodies(glyphs), [{ command: '57;', name: 'First face' }])
  const placements = placementsBySeat([{ command: '57;', longitude: 359.5 }], glyphs)
  assert.equal(placements.size, 2)
  assert.equal(placements.get(1).name, 'First face')
  assert.equal(placements.get(2).name, 'Seam face')
})

test('formats measured longitude as degree within zodiac sign', () => {
  assert.equal(zodiacLabel(0), '0.00° Aries')
  assert.equal(zodiacLabel(359.5), '29.50° Pisces')
  assert.equal(zodiacLabel(-1), '29.00° Pisces')
})
