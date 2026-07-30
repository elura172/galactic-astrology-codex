import test from 'node:test'
import assert from 'node:assert/strict'
import { GATES, GALACTIC_CENTER, gateByName, gateOccupancy, initiatoryWalk, loudestGates, officeBraid, silentGates } from '../src/gates.js'
import { angularSeparation } from '../src/astrology.js'

test('the decagon holds ten gates a Step apart and closes on the Galactic Center', () => {
  assert.equal(GATES.length, 10)
  assert.equal(GATES[0].longitude, GALACTIC_CENTER)
  GATES.forEach((gate, index) => {
    const next = GATES[(index + 1) % 10]
    assert.equal(angularSeparation(gate.longitude, next.longitude), 36)
  })
})

test('derived degrees reproduce the anchors canon recorded independently', () => {
  // Salvage records 27° Sagittarius, 3° Aquarius, and 21° Taurus. The latter two are
  // marked provisional; both land exactly on the decagon step, which licenses the rest.
  assert.equal(gateByName('Vow Crown').longitude, 267)
  assert.equal(gateByName('Signal Path').longitude, 303)
  assert.equal(gateByName('Earth Grid').longitude, 51)
  assert.deepEqual(GATES.filter(gate => gate.anchor === 'derived').map(gate => gate.gate), [3, 4, 6, 7, 8, 9, 10])
})

test('the Gate-Braid walks the rings in the order canon records', () => {
  assert.deepEqual(GATES.map(gate => gate.ring), ['I', 'II', 'III', 'IV', 'X', 'VI', 'IX', 'VIII', 'V', 'VII'])
  assert.equal(gateByName('Codex Mirror').ringName, 'Teachers & Patterners')
  assert.equal(gateByName('Vow Crown').lineage, 'Vega')
  assert.equal(gateByName('Threshold Warden').course, 'lower')
  assert.equal(gateByName('Codex Mirror').course, 'upper')
})

test('the five mirror axes face each other across the diameter', () => {
  GATES.forEach(gate => {
    const partner = GATES.find(candidate => candidate.gate === gate.mirror)
    assert.equal(gate.mirror - gate.gate === 5 || gate.gate - gate.mirror === 5, true)
    assert.equal(angularSeparation(gate.longitude, partner.longitude), 180)
  })
})

// Positions as recorded in the applied natal pass, converted to ecliptic longitude.
// groupIndex is the ring, as parseCodex derives it: Math.floor((number - 1) / 9).
const glyphs = [
  { number: 28, groupIndex: 3, name: 'Eris', function: 'Sacred disruption' },
  { number: 82, groupIndex: 9, name: 'Psyche', function: 'The soul tried by love' },
  { number: 29, groupIndex: 3, name: 'Mentor', function: 'The elder who walks beside' },
  { number: 46, groupIndex: 5, name: 'Varuna', function: 'Cosmic law' },
  { number: 47, groupIndex: 5, name: 'Chariklo', function: 'The sacred space-holder' },
  { number: 73, groupIndex: 8, name: 'Ceres', function: 'Nourishment made seasonal' },
  { number: 19, groupIndex: 2, name: 'Hylonome', function: 'The devoted mourner' },
  { number: 55, groupIndex: 6, name: 'Kalypso', function: 'Beauty not yet ready to be seen' },
  { number: 56, groupIndex: 6, name: 'Ixion', function: 'The cycle that ends with me' },
]
const placements = new Map([
  [28, { longitude: 17.6 }], [82, { longitude: 52.1 }], [29, { longitude: 49.9 }],
  [46, { longitude: 87 }], [47, { longitude: 87.7 }], [73, { longitude: 123.1 }],
  [19, { longitude: 160 }], [55, { longitude: 232.4 }], [56, { longitude: 232.9 }],
])
const mercury = { name: 'Mercury', kind: 'planet', longitude: 88.3 }

test('reproduces the applied natal pass gate table', () => {
  const occupancy = gateOccupancy(glyphs, placements, [mercury])
  const byName = name => occupancy.find(gate => gate.name === name)
  const orbs = name => byName(name).contacts.map(contact => Number(contact.orb.toFixed(1)))

  assert.deepEqual(orbs('Flame Gate'), [2.6])
  assert.deepEqual(orbs('Earth Grid'), [1.1, 1.1])
  assert.deepEqual(orbs('Codex Mirror'), [0, 0.7, 1.3])
  assert.deepEqual(orbs('Heart Beacon'), [0.1])
  assert.deepEqual(orbs('Bio-Architect'), [1])
  assert.deepEqual(orbs('Threshold Warden'), [1.4, 1.9])
  assert.equal(byName('Codex Mirror').contacts[0].glyph.name, 'Varuna')
  assert.equal(byName('Codex Mirror').contacts.at(-1).kind, 'planet')
})

test('records silence as a finding, including the one the pass passed over', () => {
  const occupancy = gateOccupancy(glyphs, placements, [mercury])
  const silent = silentGates(occupancy).map(gate => gate.name)
  assert.deepEqual(silent, ['Vow Crown', 'Signal Path', 'Dream Circuit', 'Mirror-Bond'])
  assert.equal(loudestGates(occupancy)[0].name, 'Codex Mirror')
})

test('the Initiatory Walk opens where the sky first speaks and counts its crossings', () => {
  const walk = initiatoryWalk(gateOccupancy(glyphs, placements, [mercury]))
  assert.deepEqual(walk.ringOrder, ['I', 'II', 'III', 'IV', 'X', 'VI', 'IX', 'VIII', 'V', 'VII'])
  assert.equal(walk.opensAt.name, 'Flame Gate')
  assert.equal(walk.steps.filter(step => step.crossesCourse).map(step => step.ring).length, walk.courseCrossings)
})

test('braids rings across populated gates, not the per-seat Function prose', () => {
  const braid = officeBraid(gateOccupancy(glyphs, placements, [mercury]))

  // Ring IV is named at two different gates — the strongest vocational recurrence here.
  assert.equal(braid[0].ring, 'IV')
  assert.equal(braid[0].office, 'Chaos Catalysts')
  assert.deepEqual(braid[0].gates, ['Flame Gate', 'Earth Grid'])
  assert.deepEqual(braid[0].seats, [28, 29])
  assert.deepEqual(braid[0].functions, ['Sacred disruption', 'The elder who walks beside'])
  assert.equal(braid[0].atHomeGate, true)

  // Ring VI speaks twice at one gate, and that gate is its own.
  assert.equal(braid[1].ring, 'VI')
  assert.equal(braid[1].homeGate, 'Codex Mirror')
  assert.equal(braid[1].atHomeGate, true)

  // A ring can be named at a gate that is not its own.
  const dreamers = braid.find(entry => entry.ring === 'III')
  assert.deepEqual(dreamers.gates, ['Bio-Architect'])
  assert.equal(dreamers.atHomeGate, false)

  assert.equal(braid.length, 6)
  assert.ok(braid.every(entry => entry.tightestOrb <= 3))
})

test('every seat Function is unique across the canon, so rings carry the braid', async () => {
  const { parseCodex } = await import('../src/codex.js')
  const { readFile } = await import('node:fs/promises')
  const canon = parseCodex(await readFile(new URL('../codex_of_celestial_glyphs.md', import.meta.url), 'utf8'))
  const functions = canon.map(glyph => glyph.function).filter(Boolean)
  assert.equal(functions.length, 108)
  assert.equal(new Set(functions).size, 108)
})
