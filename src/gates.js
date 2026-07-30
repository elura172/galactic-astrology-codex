import { conjunction, normalizeLongitude } from './astrology.js'
import { GROUPS } from './codex.js'

// 27° Sagittarius — the Galactic Center, canonical zodiacal anchor of Gate 1 / Ring I.
export const GALACTIC_CENTER = 267
export const GATE_STEP = 36

// The Gate-Braid: ten gate-functions braided to the ten band rings by function rather
// than sequence. Gate order 1→10 is the Initiatory Walk; ring order is the wheel.
const GATE_BRAID = [
  { gate: 1, name: 'Vow Crown', ring: 'I', phase: 'Conception: galactic seed' },
  { gate: 2, name: 'Signal Path', ring: 'II', phase: 'Activation: soul calling begins' },
  { gate: 3, name: 'Dream Circuit', ring: 'III', phase: 'Gestation: held in mythic stillness' },
  { gate: 4, name: 'Flame Gate', ring: 'IV', phase: 'Quickening: will ignites' },
  { gate: 5, name: 'Earth Grid', ring: 'X', phase: 'Embodiment: anchoring into form' },
  { gate: 6, name: 'Codex Mirror', ring: 'VI', phase: 'Language: symbolic translation' },
  { gate: 7, name: 'Heart Beacon', ring: 'IX', phase: 'Emotional coherence' },
  { gate: 8, name: 'Bio-Architect', ring: 'VIII', phase: 'Patterning the offering' },
  { gate: 9, name: 'Mirror-Bond', ring: 'V', phase: 'Relational refinement: harmony of opposites' },
  { gate: 10, name: 'Threshold Warden', ring: 'VII', phase: 'Death / rebirth / initiation' },
]

// The five rings adjoining the zenith. The remaining five form the lower course.
const UPPER_COURSE = new Set(['II', 'V', 'VI', 'VIII', 'IX'])

// Canon records only three anchors by degree; Gates 2 and 5 are marked provisional and
// the rest derive from the decagon. Both provisional anchors land exactly on the
// derived step, which is what licenses the derivation.
const RECORDED_ANCHORS = { 1: 'canonical', 2: 'provisional', 5: 'provisional' }

export const GATES = GATE_BRAID.map(entry => {
  const group = GROUPS.find(candidate => candidate.gate === entry.name)
  return {
    ...entry,
    longitude: normalizeLongitude(GALACTIC_CENTER + GATE_STEP * (entry.gate - 1)),
    course: UPPER_COURSE.has(entry.ring) ? 'upper' : 'lower',
    mirror: ((entry.gate + 4) % 10) + 1,
    ringName: group?.name ?? null,
    lineage: group?.lineage ?? null,
    anchor: RECORDED_ANCHORS[entry.gate] ?? 'derived',
  }
})

export function gateByName(name) {
  return GATES.find(gate => gate.name === name) ?? null
}

function contactLabel(contact) {
  return contact.glyph?.name ?? contact.point?.name ?? ''
}

/**
 * Occupancy of the ten gates. Glyph seats come from the codex placements; `points`
 * carries natal planets, angles, or any other measured longitude with a `name`.
 * Silence is a finding, not missing data: an unoccupied gate is a phase of the walk
 * that this sky does not speak from.
 */
export function gateOccupancy(glyphs, placementsBySeat, points = []) {
  return GATES.map(gate => {
    const glyphContacts = glyphs.flatMap(glyph => {
      const placement = placementsBySeat.get(glyph.number)
      if (!placement) return []
      const contact = conjunction(placement.longitude, gate.longitude)
      return contact ? [{ kind: 'glyph', glyph, placement, ...contact }] : []
    })
    const pointContacts = points.flatMap(point => {
      const contact = conjunction(point.longitude, gate.longitude)
      return contact ? [{ kind: point.kind ?? 'point', point, ...contact }] : []
    })
    const contacts = [...glyphContacts, ...pointContacts]
      .sort((first, second) => first.orb - second.orb || contactLabel(first).localeCompare(contactLabel(second)))
    return { ...gate, contacts, silent: contacts.length === 0 }
  })
}

export function silentGates(occupancy) {
  return occupancy.filter(gate => gate.silent)
}

export function loudestGates(occupancy) {
  return occupancy
    .filter(gate => !gate.silent)
    .sort((first, second) => first.contacts[0].orb - second.contacts[0].orb || second.contacts.length - first.contacts.length)
}

/**
 * The Initiatory Walk in gate order, marking each place the path crosses between the
 * lower and upper courses — the spiral breathing between root and crown.
 */
export function initiatoryWalk(occupancy) {
  const ordered = [...occupancy].sort((first, second) => first.gate - second.gate)
  const steps = ordered.map((gate, index) => ({
    ...gate,
    crossesCourse: index > 0 && gate.course !== ordered[index - 1].course,
  }))
  return {
    steps,
    ringOrder: steps.map(step => step.ring),
    courseCrossings: steps.filter(step => step.crossesCourse).length,
    opensAt: steps.find(step => !step.silent) ?? null,
  }
}

/**
 * Which offices recur across the populated gates. The braid, not the position report:
 * a ring named at several gates is a vocation the sky states more than once.
 *
 * Braided by ring rather than by the Function prose — every seat's Function is unique
 * across all 108, so string matching would never merge anything. The ring is the
 * structural office, and each seat's Function rides along as its evidence.
 */
export function officeBraid(occupancy) {
  const tally = new Map()
  occupancy.filter(gate => !gate.silent).forEach(gate => {
    gate.contacts.filter(contact => contact.kind === 'glyph').forEach(contact => {
      const group = GROUPS[contact.glyph.groupIndex]
      if (!group) return
      const entry = tally.get(group.short) ?? {
        ring: group.short,
        office: group.name,
        lineage: group.lineage,
        homeGate: group.gate,
        seats: [],
        gates: new Set(),
        functions: [],
        tightestOrb: Infinity,
      }
      entry.seats.push(contact.glyph.number)
      entry.gates.add(gate.name)
      if (contact.glyph.function) entry.functions.push(contact.glyph.function)
      entry.tightestOrb = Math.min(entry.tightestOrb, contact.orb)
      tally.set(group.short, entry)
    })
  })
  return [...tally.values()]
    .map(entry => ({ ...entry, gates: [...entry.gates], atHomeGate: entry.gates.has(entry.homeGate) }))
    .sort((first, second) =>
      second.gates.length - first.gates.length
      || second.seats.length - first.seats.length
      || first.tightestOrb - second.tightestOrb)
}
