import test from 'node:test'
import assert from 'node:assert/strict'
import { angularSeparation, conjunction, contactsBetween, decagonalChord, normalizeLongitude } from '../src/astrology.js'

test('normalizes longitudes and measures across the Aries boundary', () => {
  assert.equal(normalizeLongitude(-1), 359)
  assert.equal(normalizeLongitude(721), 1)
  assert.equal(angularSeparation(359, 1), 2)
  assert.equal(angularSeparation(10, 350), 20)
})

test('applies the natal conjunction tiers from the reading template', () => {
  assert.deepEqual(conjunction(359.5, 0), { aspect: 'Conjunction', angle: 0, orb: 0.5, tier: 'exact' })
  assert.equal(conjunction(10, 12).tier, 'working')
  assert.equal(conjunction(10, 13).tier, 'whisper')
  assert.equal(conjunction(10, 13.01), null)
})

test('classifies every canonical decagonal chord and its stricter orbs', () => {
  assert.equal(decagonalChord(0, 36.2).tier, 'lattice')
  assert.equal(decagonalChord(0, 71.4).aspect, 'Gift')
  assert.equal(decagonalChord(300, 48).aspect, 'Vow')
  assert.equal(decagonalChord(0, 145.5).aspect, 'Spiral')
  assert.equal(decagonalChord(359, 177).aspect, 'Mirror')
  assert.equal(decagonalChord(0, 33.9), null)
})

test('builds pairwise contacts without self-pairs or duplicates', () => {
  const points = [
    { id: 'a', longitude: 0 },
    { id: 'b', longitude: 36 },
    { id: 'c', longitude: 72 },
  ]
  const contacts = contactsBetween(points)
  assert.equal(contacts.length, 3)
  assert.deepEqual(contacts.map(contact => [contact.first.id, contact.second.id]), [['a', 'b'], ['a', 'c'], ['b', 'c']])
})
