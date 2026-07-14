export const CONJUNCTION_TIERS = [
  { name: 'exact', maxOrb: 1 },
  { name: 'working', maxOrb: 2 },
  { name: 'whisper', maxOrb: 3 },
]

export const CHORD_ANGLES = [
  { name: 'Step', angle: 36 },
  { name: 'Gift', angle: 72 },
  { name: 'Vow', angle: 108 },
  { name: 'Spiral', angle: 144 },
  { name: 'Mirror', angle: 180 },
]

export const CHORD_TIERS = [
  { name: 'lattice', maxOrb: 0.25 },
  { name: 'working', maxOrb: 1 },
  { name: 'whisper', maxOrb: 2 },
]

export function normalizeLongitude(value) {
  if (!Number.isFinite(value)) throw new TypeError('Longitude must be a finite number.')
  return ((value % 360) + 360) % 360
}

export function angularSeparation(first, second) {
  const distance = Math.abs(normalizeLongitude(first) - normalizeLongitude(second))
  return Math.min(distance, 360 - distance)
}

function tierForOrb(orb, tiers) {
  return tiers.find(tier => orb <= tier.maxOrb + Number.EPSILON)?.name || null
}

export function conjunction(first, second) {
  const orb = angularSeparation(first, second)
  const tier = tierForOrb(orb, CONJUNCTION_TIERS)
  return tier ? { aspect: 'Conjunction', angle: 0, orb, tier } : null
}

export function decagonalChord(first, second) {
  const separation = angularSeparation(first, second)
  const match = CHORD_ANGLES
    .map(chord => ({ ...chord, orb: Math.abs(separation - chord.angle) }))
    .sort((a, b) => a.orb - b.orb)[0]
  const tier = tierForOrb(match.orb, CHORD_TIERS)
  return tier ? { aspect: match.name, angle: match.angle, separation, orb: match.orb, tier } : null
}

export function contactsBetween(points, aspect = decagonalChord) {
  const contacts = []
  for (let first = 0; first < points.length; first += 1) {
    for (let second = first + 1; second < points.length; second += 1) {
      const result = aspect(points[first].longitude, points[second].longitude)
      if (result) contacts.push({ first: points[first], second: points[second], ...result })
    }
  }
  return contacts
}
