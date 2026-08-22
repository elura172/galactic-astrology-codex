// Fixture glyph longitudes (golden-angle spread) — used when the ephemeris service is unreachable.
// Keyed by catalogue command, not name, so seam seats stay distinct downstream.
export function fixtureLongitudes(glyphs) {
  const lonByName = new Map()
  const placements = []
  const seen = new Set()
  glyphs.forEach(g => {
    const longitude = (g.number * 137.50776405) % 360
    if (!lonByName.has(g.name)) lonByName.set(g.name, longitude)
    const command = g.catalogueId?.horizonsCommand
    if (command && !seen.has(command)) {
      seen.add(command)
      placements.push({ command, name: g.name, longitude })
    }
  })
  return withPlacements(lonByName, placements)
}

// The interface reads the returned Map directly (name → longitude), while the
// reading pass needs catalogue commands to reach seat-level joins. Carry both
// rather than making the caller choose.
function withPlacements(lonByName, placements) {
  Object.defineProperty(lonByName, 'placements', { value: placements, enumerable: false })
  return lonByName
}

// The repo's own service protocol (server/server.js): POST { timestamp, bodies:[{command,name,seat}] }
export function uniqueBodies(glyphs) {
  const byCommand = new Map()
  glyphs.forEach(g => {
    const num = g.catalogue.match(/\((\d+)\)/)?.[1]
    if (num && !byCommand.has(num)) byCommand.set(num, { command: num + ';', name: g.name })
  })
  return [...byCommand.values()]
}
export async function fetchGlyphLongitudes(glyphs, timestamp, endpoint) {
  const bodies = uniqueBodies(glyphs)
  const lonByName = new Map()
  const placements = []
  for (let i = 0; i < bodies.length; i += 8) {
    const res = await fetch(endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ timestamp, bodies: bodies.slice(i, i + 8) }),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'ephemeris failed')
    data.placements.forEach(p => {
      if (!lonByName.has(p.name)) lonByName.set(p.name, p.longitude)
      placements.push({ command: p.command, name: p.name, longitude: p.longitude, latitude: p.latitude })
    })
  }
  return withPlacements(lonByName, placements)
}

// --- Direct NASA/JPL Horizons access (browser; CORS-enabled endpoint) ---
// Query + parser ported verbatim from server/horizons.js
export const HORIZONS_ENDPOINT = 'https://ssd.jpl.nasa.gov/api/horizons.api'
export function horizonsUrl(command, timestamp) {
  if (!/^\d+;?$/.test(command)) throw new TypeError('Horizons command must be numeric.')
  const parameters = new URLSearchParams({
    format: 'json', COMMAND: `'${command}'`, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER', CENTER: "'500@399'", TLIST: `'${julianDate(timestamp).toFixed(8)}'`,
    TLIST_TYPE: 'JD', TIME_TYPE: 'UT', TIME_DIGITS: 'FRACSEC', QUANTITIES: "'31'", CSV_FORMAT: 'YES',
  })
  return `${HORIZONS_ENDPOINT}?${parameters}`
}
export function parseHorizonsPlacement(payload) {
  if (payload.error) throw new Error(`Horizons: ${payload.error}`)
  const table = payload.result?.match(/\$\$SOE\s*\n([^\n]+)\n\$\$EOE/)?.[1]
  if (!table) throw new Error('Horizons returned no ephemeris row.')
  const fields = table.split(',').map(f => f.trim()).filter(Boolean)
  const longitude = Number(fields.at(-2))
  const latitude = Number(fields.at(-1))
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) throw new Error('Invalid ecliptic position.')
  return { longitude, latitude }
}
async function mapConcurrent(items, limit, operation) {
  const output = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) { const i = cursor++; output[i] = await operation(items[i], i) }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return output
}
// Direct fetch of all unique glyph bodies, cached per body+instant in localStorage
export async function fetchGlyphLongitudesDirect(glyphs, timestamp, onProgress = () => {}) {
  const bodies = uniqueBodies(glyphs)
  const iso = new Date(timestamp).toISOString()
  const lonByName = new Map()
  const placements = []
  let done = 0
  await mapConcurrent(bodies, 3, async body => {
    const key = 'glcx_eph_' + body.command + '|' + iso
    let placement
    try { placement = JSON.parse(localStorage.getItem(key)) } catch (e) { placement = null }
    if (!placement) {
      const res = await fetch(horizonsUrl(body.command, iso), { signal: AbortSignal.timeout(30000) })
      if (!res.ok) throw new Error('Horizons HTTP ' + res.status)
      placement = parseHorizonsPlacement(await res.json())
      try { localStorage.setItem(key, JSON.stringify(placement)) } catch (e) { /* cache full — proceed uncached */ }
    }
    if (!lonByName.has(body.name)) lonByName.set(body.name, placement.longitude)
    placements.push({ command: body.command, name: body.name, longitude: placement.longitude, latitude: placement.latitude })
    onProgress({ completed: ++done, total: bodies.length })
  })
  return withPlacements(lonByName, placements)
}
