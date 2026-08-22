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
// One batch of twelve failing used to discard every real placement and quietly
// substitute fixtures — a whole reading of illustrative numbers, announced only
// by one sentence in the note. A cold service, a Horizons hiccup or a rate limit
// is a reason to wait and ask again, not to abandon the sky.
async function fetchBatch(endpoint, timestamp, batch, frame = 'heliocentric', attempts = 3) {
  let last
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 400 * 2 ** (attempt - 1)))
    try {
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ timestamp, bodies: batch, frame }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) return data
      // A refused request is final; a busy or broken service is worth retrying.
      // Marked on the error rather than inferred from its message, because the
      // message is the service's own text and cannot be pattern-matched.
      const error = new Error(data.error || `ephemeris failed (HTTP ${res.status})`)
      error.final = res.status !== 429 && res.status !== 408 && res.status < 500
      throw error
    } catch (error) {
      if (error.final) throw error
      last = error
    }
  }
  throw last
}

// `onProgress` matters more than it looks: a reading is 96 bodies in twelve
// round trips, and on a cold service that is 10-20 seconds. Without it the
// service path reports nothing at all while it works — the direct path had
// progress, the one actually used did not.
export async function fetchGlyphLongitudes(glyphs, timestamp, endpoint, onProgress = () => {}, frame = 'heliocentric') {
  const bodies = uniqueBodies(glyphs)
  const lonByName = new Map()
  const placements = []
  onProgress({ completed: 0, total: bodies.length })
  for (let i = 0; i < bodies.length; i += 8) {
    const data = await fetchBatch(endpoint, timestamp, bodies.slice(i, i + 8), frame)
    data.placements.forEach(p => {
      if (!lonByName.has(p.name)) lonByName.set(p.name, p.longitude)
      placements.push({ command: p.command, name: p.name, longitude: p.longitude, latitude: p.latitude })
    })
    onProgress({ completed: placements.length, total: bodies.length })
  }
  return withPlacements(lonByName, placements)
}

// --- Direct NASA/JPL Horizons access ---
// NOT reachable from a browser: Horizons returns no Access-Control-Allow-Origin
// and answers OPTIONS with 405, so a cross-origin fetch always fails. Kept
// because it works wherever CORS does not apply (Node, a native shell); in the
// browser this tier always falls through to the fixtures below. The phone app
// therefore needs the Codex ephemeris service, local or hosted, for real sky.
// Query + parser ported verbatim from server/horizons.js
export const HORIZONS_ENDPOINT = 'https://ssd.jpl.nasa.gov/api/horizons.api'
// Sun body centre. The Codex is drawn from the Sun, not from the barycentre,
// which sits about 0.013° away and is a different origin.
export const CENTERS = { heliocentric: '500@10', geocentric: '500@399' }
export function horizonsUrl(command, timestamp, frame = 'heliocentric') {
  if (!/^\d+;?$/.test(command)) throw new TypeError('Horizons command must be numeric.')
  const parameters = new URLSearchParams({
    format: 'json', COMMAND: `'${command}'`, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES',
    // Repo `julianDate` takes a Date; this function is handed an ISO string.
    EPHEM_TYPE: 'OBSERVER', CENTER: `'${CENTERS[frame] || CENTERS.heliocentric}'`, TLIST: `'${julianDate(new Date(timestamp)).toFixed(8)}'`,
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
export async function fetchGlyphLongitudesDirect(glyphs, timestamp, onProgress = () => {}, frame = 'heliocentric') {
  const bodies = uniqueBodies(glyphs)
  const iso = new Date(timestamp).toISOString()
  const lonByName = new Map()
  const placements = []
  let done = 0
  await mapConcurrent(bodies, 3, async body => {
    const key = 'glcx_eph_' + body.command + '|' + iso + '|' + frame
    let placement
    try { placement = JSON.parse(localStorage.getItem(key)) } catch (e) { placement = null }
    if (!placement) {
      const res = await fetch(horizonsUrl(body.command, iso, frame), { signal: AbortSignal.timeout(30000) })
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
