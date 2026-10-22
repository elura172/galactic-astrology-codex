import { normalizeLongitude } from './astrology.js'

export const MAJOR_BODIES = [
  { command: '10', name: 'Sun', symbol: '☉' },
  { command: '301', name: 'Moon', symbol: '☽' },
  { command: '199', name: 'Mercury', symbol: '☿' },
  { command: '299', name: 'Venus', symbol: '♀' },
  { command: '499', name: 'Mars', symbol: '♂' },
  { command: '599', name: 'Jupiter', symbol: '♃' },
  { command: '699', name: 'Saturn', symbol: '♄' },
  { command: '799', name: 'Uranus', symbol: '♅' },
  { command: '899', name: 'Neptune', symbol: '♆' },
  { command: '999', name: 'Pluto', symbol: '♇' },
]

export const HELIOCENTRIC_MAJOR_BODIES = [
  { command: '399', name: 'Earth', symbol: '⊕' },
  { command: '199', name: 'Mercury', symbol: '☿' },
  { command: '299', name: 'Venus', symbol: '♀' },
  { command: '499', name: 'Mars', symbol: '♂' },
  { command: '599', name: 'Jupiter', symbol: '♃' },
  { command: '699', name: 'Saturn', symbol: '♄' },
  { command: '799', name: 'Uranus', symbol: '♅' },
  { command: '899', name: 'Neptune', symbol: '♆' },
  { command: '999', name: 'Pluto', symbol: '♇' },
]

export const DECAGONAL_NODES = [
  { index: 1, angle: 0, sign: 'ARI', gate: 'Vow Crown', face: 'I', lineage: 'Vega', groupIndex: 0 },
  { index: 2, angle: 36, sign: 'TAU', gate: 'Signal Path', face: 'II', lineage: 'Lyra', groupIndex: 1 },
  { index: 3, angle: 72, sign: 'GEM', gate: 'Dream Circuit', face: 'III', lineage: 'Arcturus', groupIndex: 2 },
  { index: 4, angle: 108, sign: 'CAN', gate: 'Flame Gate', face: 'IV', lineage: 'Orion', groupIndex: 3 },
  { index: 5, angle: 144, sign: 'LEO', gate: 'Mirror-Bond', face: 'V', lineage: 'Aldebaran', groupIndex: 4 },
  { index: 6, angle: 180, sign: 'LIB', gate: 'Codex Mirror', face: 'VI', lineage: 'Sirius', groupIndex: 5 },
  { index: 7, angle: 216, sign: 'SCO', gate: 'Threshold Warden', face: 'VII', lineage: 'Antares', groupIndex: 6 },
  { index: 8, angle: 252, sign: 'SAG', gate: 'Bio-Architect', face: 'VIII', lineage: 'Andromeda', groupIndex: 7 },
  { index: 9, angle: 288, sign: 'CAP', gate: 'Heart Beacon', face: 'IX', lineage: 'Alpha Centauri', groupIndex: 8 },
  { index: 10, angle: 324, sign: 'AQU', gate: 'Earth Grid', face: 'X', lineage: 'Pleiades', groupIndex: 9 },
]

function partsAt(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]))
}

export function zonedDateTime(localDateTime, timeZone) {
  const match = localDateTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) throw new TypeError('Local date and time must include year, month, day, hour, and minute.')
  try { new Intl.DateTimeFormat('en', { timeZone }).format() } catch { throw new TypeError('Timezone must be a valid IANA name.') }
  const wanted = match.slice(1).map(Number)
  const wallClock = Date.UTC(wanted[0], wanted[1] - 1, wanted[2], wanted[3], wanted[4])
  let instant = wallClock
  for (let index = 0; index < 3; index += 1) {
    const parts = partsAt(new Date(instant), timeZone)
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
    instant += wallClock - represented
  }
  const resolved = partsAt(new Date(instant), timeZone)
  if ([resolved.year, resolved.month, resolved.day, resolved.hour, resolved.minute].some((value, index) => value !== wanted[index])) {
    throw new RangeError('That local time does not exist in the selected timezone.')
  }
  return new Date(instant)
}

export function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5
}

export function chartAngles(date, latitude, longitude) {
  if (![latitude, longitude].every(Number.isFinite) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new RangeError('Coordinates are out of range.')
  const jd = julianDate(date)
  const centuries = (jd - 2451545) / 36525
  const sidereal = normalizeLongitude(280.46061837 + 360.98564736629 * (jd - 2451545) + .000387933 * centuries ** 2 - centuries ** 3 / 38710000 + longitude)
  const obliquity = 23.43929111 - .013004167 * centuries
  const radians = value => value * Math.PI / 180
  const degrees = value => value * 180 / Math.PI
  const theta = radians(sidereal)
  const epsilon = radians(obliquity)
  const phi = radians(latitude)
  const midheaven = normalizeLongitude(degrees(Math.atan2(Math.sin(theta) * Math.cos(epsilon), Math.cos(theta))))
  // atan2 first yields the western horizon intersection; 180° selects the eastern, rising point.
  const ascendant = normalizeLongitude(degrees(Math.atan2(-Math.cos(theta), Math.sin(epsilon) * Math.tan(phi) + Math.cos(epsilon) * Math.sin(theta))) + 180)
  return {
    ascendant,
    midheaven,
    descendant: normalizeLongitude(ascendant + 180),
    imumCoeli: normalizeLongitude(midheaven + 180),
    siderealTime: sidereal,
  }
}

export function wholeSignHouses(ascendant) {
  const firstCusp = Math.floor(normalizeLongitude(ascendant) / 30) * 30
  return Array.from({ length: 12 }, (_, index) => ({
    house: index + 1,
    cusp: normalizeLongitude(firstCusp + index * 30),
  }))
}

export function houseForLongitude(longitude, houses) {
  if (!Array.isArray(houses) || houses.length !== 12) throw new TypeError('A complete twelve-house wheel is required.')
  const firstCusp = houses[0].cusp
  return Math.floor(normalizeLongitude(longitude - firstCusp) / 30) + 1
}

export function lineageHouseResonance(glyphs, placementsBySeat, houses) {
  const resonance = new Map()
  glyphs.forEach(glyph => {
    const placement = placementsBySeat.get(glyph.number)
    if (!placement) return
    const house = houseForLongitude(placement.longitude, houses)
    const key = `${house}:${glyph.groupIndex}`
    const existing = resonance.get(key) || { house, groupIndex: glyph.groupIndex, seats: [] }
    existing.seats.push(glyph.number)
    resonance.set(key, existing)
  })
  return [...resonance.values()].sort((first, second) => first.house - second.house || first.groupIndex - second.groupIndex)
}
