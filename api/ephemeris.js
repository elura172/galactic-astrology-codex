// The Codex ephemeris service, as a Vercel function.
//
// This exists because the browser cannot reach JPL Horizons itself: Horizons
// sends no Access-Control-Allow-Origin and answers OPTIONS with 405, so every
// cross-origin fetch fails. Without a proxy the app falls through to fixtures
// and shows a sky that is illustrative rather than measured.
//
// Same-origin with the page it serves, so no CORS headers are needed for the
// app itself; they are sent anyway so the canvas editor (a different origin)
// can point `ephemerisEndpoint` here while a design is being worked on.

import { CENTERS, horizonsUrl, mapConcurrent, parseHorizonsPlacement } from '../server/horizons.js'

// A placement for a fixed body at a fixed instant never changes, so anything
// already fetched can be answered from memory. Per-instance and lost on a cold
// start — a real cache would need Redis or KV, but this alone collapses repeat
// readings of the same chart from ~20s to nothing.
const memo = new Map()
const MEMO_LIMIT = 5000

const CORS = {
  'access-control-allow-origin': process.env.SKY_ORIGIN || '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
}

function validate(body) {
  const timestamp = new Date(body?.timestamp)
  if (!Number.isFinite(timestamp.getTime())) throw new Error('A valid ISO timestamp is required.')
  if (!Array.isArray(body.bodies) || !body.bodies.length || body.bodies.length > 110) throw new Error('Supply between 1 and 110 bodies.')
  body.bodies.forEach(item => {
    if (!/^\d+;?$/.test(item?.command)) throw new Error('Every body requires a numeric Horizons command.')
  })
  const frame = body.frame || 'heliocentric'
  if (!CENTERS[frame]) throw new Error('Frame must be heliocentric or geocentric.')
  return { timestamp: timestamp.toISOString(), bodies: body.bodies, frame }
}

async function placement(body, timestamp, frame) {
  const key = `${body.command}|${timestamp}|${frame}`
  const cached = memo.get(key)
  if (cached) return { ...cached, seat: body.seat ?? null, name: body.name ?? null }

  // Horizons is a shared public service and throttles a burst; a 429 or a 5xx
  // means wait, not fail. Without this one throttled body fails a whole batch,
  // which the client then reports as a lost reading.
  let payload
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 500 * 2 ** (attempt - 1)))
    const response = await fetch(horizonsUrl(body.command, timestamp, frame), { signal: AbortSignal.timeout(20000) })
    if (response.ok) { payload = await response.json(); break }
    if (response.status !== 429 && response.status < 500) throw new Error(`Horizons request failed with HTTP ${response.status}.`)
    if (attempt === 2) throw new Error(`Horizons is unavailable (HTTP ${response.status}).`)
  }
  const position = parseHorizonsPlacement(payload)
  const result = {
    command: body.command, ...position, timestamp,
    center: frame, origin: CENTERS[frame], frame: 'apparent ecliptic-of-date', source: 'NASA/JPL Horizons',
  }
  if (memo.size >= MEMO_LIMIT) memo.clear()
  memo.set(key, result)
  return { ...result, seat: body.seat ?? null, name: body.name ?? null }
}

export default async function handler(request, response) {
  Object.entries(CORS).forEach(([header, value]) => response.setHeader(header, value))

  if (request.method === 'OPTIONS') return response.status(204).end()
  if (request.method === 'GET') return response.status(200).json({ ok: true, service: 'codex-ephemeris', cached: memo.size })
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' })

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body
    const input = validate(body)
    // Two at a time: Horizons is a shared public service and the client already
    // batches, so this stays polite without making a reading feel slow.
    const placements = await mapConcurrent(input.bodies, 2, item => placement(item, input.timestamp, input.frame))
    // An ephemeris for a past instant is immutable; let the CDN and the browser
    // keep it. Readings for "now" vary by the minute, which the timestamp in the
    // request body already distinguishes.
    response.setHeader('cache-control', 'public, max-age=31536000, immutable')
    return response.status(200).json({ timestamp: input.timestamp, frame: input.frame, placements, source: 'NASA/JPL Horizons' })
  } catch (error) {
    response.setHeader('cache-control', 'no-store')
    return response.status(400).json({ error: error.message })
  }
}
