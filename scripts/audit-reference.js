import { readFile } from 'node:fs/promises'
import { parseCodex } from '../src/codex.js'
import { MAJOR_BODIES, chartAngles, wholeSignHouses } from '../src/chart.js'
import { fetchEphemerisInBatches, placementsBySeat, uniqueMeasuredBodies } from '../src/sky.js'
import { angleContacts, densestCluster, planetaryCourts, strongestChords } from '../src/reading.js'

const timestamp = '2000-01-01T12:00:00.000Z'
const glyphs = parseCodex(await readFile(new URL('../codex_of_celestial_glyphs.md', import.meta.url), 'utf8'))
const bodies = [...uniqueMeasuredBodies(glyphs), ...MAJOR_BODIES]
const result = await fetchEphemerisInBatches({
  timestamp, bodies, endpoint: 'http://127.0.0.1:8787/api/ephemeris',
  onProgress: ({ completed, total }) => console.log(`Reference audit: ${completed}/${total}`),
})
const placements = placementsBySeat(result.placements, glyphs)
const planets = result.placements.filter(placement => MAJOR_BODIES.some(body => body.command === placement.command))
const angles = chartAngles(new Date(timestamp), 0, 0)
const houses = wholeSignHouses(angles.ascendant)
const cluster = densestCluster(glyphs, placements)
const courts = planetaryCourts(glyphs, placements, planets, MAJOR_BODIES)
const angleRecords = angleContacts(glyphs, placements, angles)
const uniqueGlyphPoints = [...new Map([...placements.values()].map(placement => [placement.command, placement])).values()]
const chordFamilies = strongestChords([...uniqueGlyphPoints, ...planets])

const checks = {
  requestedBodies: bodies.length,
  returnedBodies: result.placements.length,
  canonicalMeasuredSeats: placements.size,
  planets: planets.length,
  angles: Object.keys(angles).length - 1,
  houses: houses.length,
  populatedCourts: courts.filter(court => court.contacts.length).length,
  angleContacts: angleRecords.reduce((total, angle) => total + angle.contacts.length, 0),
  clusterBodies: cluster.members.length,
  chordFamilies: chordFamilies.size,
}
console.log(JSON.stringify(checks, null, 2))
if (checks.returnedBodies !== 106 || checks.canonicalMeasuredSeats !== 105 || checks.planets !== 10 || checks.houses !== 12 || checks.chordFamilies !== 5) {
  throw new Error('Reference chart audit failed an integrity check.')
}
