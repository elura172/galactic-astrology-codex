import { createHash } from 'node:crypto'

export const HORIZONS_ENDPOINT = 'https://ssd.jpl.nasa.gov/api/horizons.api'

// The Codex is read from the Sun. `500@10` is the Sun's body centre, which is
// what "drawn from the Sun's perspective" means; `500@0` is the solar system
// barycentre and sits about 0.013° away — close, but not the same origin, and
// not the one the tradition names.
export const CENTERS = {
  heliocentric: '500@10',
  geocentric: '500@399',
}
export const DEFAULT_CENTER = CENTERS.heliocentric

function centerFor(frame) {
  if (!frame) return DEFAULT_CENTER
  if (CENTERS[frame]) return CENTERS[frame]
  if (Object.values(CENTERS).includes(frame)) return frame
  throw new TypeError(`Unknown frame "${frame}" — expected heliocentric or geocentric.`)
}

export function julianDate(value) {
  const milliseconds = new Date(value).getTime()
  if (!Number.isFinite(milliseconds)) throw new TypeError('Timestamp must be a valid ISO date.')
  return milliseconds / 86400000 + 2440587.5
}

export function horizonsUrl(command, timestamp, frame = DEFAULT_CENTER) {
  if (!/^\d+;?$/.test(command)) throw new TypeError('Horizons command must be a numeric major-body ID or small-body number followed by a semicolon.')
  const parameters = new URLSearchParams({
    format: 'json', COMMAND: `'${command}'`, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER', CENTER: `'${centerFor(frame)}'`, TLIST: `'${julianDate(timestamp).toFixed(8)}'`,
    TLIST_TYPE: 'JD', TIME_TYPE: 'UT', TIME_DIGITS: 'FRACSEC', QUANTITIES: "'31'", CSV_FORMAT: 'YES',
  })
  return `${HORIZONS_ENDPOINT}?${parameters}`
}

export function parseHorizonsPlacement(payload) {
  if (payload.error) throw new Error(`Horizons: ${payload.error}`)
  const table = payload.result?.match(/\$\$SOE\s*\n([^\n]+)\n\$\$EOE/)?.[1]
  if (!table) throw new Error('Horizons returned no ephemeris row.')
  const fields = table.split(',').map(field => field.trim()).filter(Boolean)
  const longitude = Number(fields.at(-2))
  const latitude = Number(fields.at(-1))
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) throw new Error('Horizons returned an invalid ecliptic position.')
  return { longitude, latitude }
}

export function cacheKey(command, timestamp, frame = DEFAULT_CENTER) {
  return createHash('sha256').update(`${command}|${new Date(timestamp).toISOString()}|${centerFor(frame)}|31`).digest('hex')
}

export async function mapConcurrent(items, limit, operation) {
  const output = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      output[index] = await operation(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return output
}
