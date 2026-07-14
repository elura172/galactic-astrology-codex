import { createHash } from 'node:crypto'

export const HORIZONS_ENDPOINT = 'https://ssd.jpl.nasa.gov/api/horizons.api'

export function julianDate(value) {
  const milliseconds = new Date(value).getTime()
  if (!Number.isFinite(milliseconds)) throw new TypeError('Timestamp must be a valid ISO date.')
  return milliseconds / 86400000 + 2440587.5
}

export function horizonsUrl(command, timestamp) {
  if (!/^\d+;$/.test(command)) throw new TypeError('Horizons small-body command must be a number followed by a semicolon.')
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
  const fields = table.split(',').map(field => field.trim()).filter(Boolean)
  const longitude = Number(fields.at(-2))
  const latitude = Number(fields.at(-1))
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) throw new Error('Horizons returned an invalid ecliptic position.')
  return { longitude, latitude }
}

export function cacheKey(command, timestamp) {
  return createHash('sha256').update(`${command}|${new Date(timestamp).toISOString()}|500@399|31`).digest('hex')
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
