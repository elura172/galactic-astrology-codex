import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cacheKey, horizonsUrl, mapConcurrent, parseHorizonsPlacement } from './horizons.js'

const port = Number(process.env.SKY_PORT || 8787)
const cacheDirectory = new URL('../.cache/ephemeris/', import.meta.url)
const geocodeCacheDirectory = new URL('../.cache/geocode/', import.meta.url)
await mkdir(cacheDirectory, { recursive: true })
await mkdir(geocodeCacheDirectory, { recursive: true })

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

function geocodeCacheKey(query) {
  return query.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_').slice(0, 60)
}

async function geocodeCity(query) {
  const safeKey = geocodeCacheKey(query)
  const path = join(geocodeCacheDirectory.pathname, `${safeKey}.json`)
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
  const upstream = await fetch(url, { signal: AbortSignal.timeout(6000) })
  if (!upstream.ok) throw new Error(`Geocoding failed with HTTP ${upstream.status}`)
  const data = await upstream.json()
  const results = (data.results || []).map(item => ({
    id: item.id,
    name: item.name,
    admin1: item.admin1 || '',
    country: item.country || '',
    latitude: item.latitude,
    longitude: item.longitude,
    elevation: item.elevation,
    timezone: item.timezone || 'UTC',
    countryCode: item.country_code || '',
    displayName: [item.name, item.admin1 && item.admin1 !== item.name ? item.admin1 : null, item.country].filter(Boolean).join(', '),
  }))
  await writeFile(path, JSON.stringify(results), { mode: 0o600 })
  return results
}

async function requestBody(request) {
  const chunks = []
  let length = 0
  for await (const chunk of request) {
    length += chunk.length
    if (length > 250000) throw new Error('Request body is too large.')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function validate(body) {
  const timestamp = new Date(body.timestamp)
  if (!Number.isFinite(timestamp.getTime())) throw new Error('A valid ISO timestamp is required.')
  if (!Array.isArray(body.bodies) || !body.bodies.length || body.bodies.length > 110) throw new Error('Supply between 1 and 110 bodies.')
  body.bodies.forEach(item => {
    if (!/^\d+;?$/.test(item.command)) throw new Error('Every body requires a numeric Horizons command.')
  })
  const center = (body.center || body.frame) === 'heliocentric' ? 'heliocentric' : 'geocentric'
  return { timestamp: timestamp.toISOString(), bodies: body.bodies, center }
}

async function placement(body, timestamp, center = 'geocentric') {
  const path = join(cacheDirectory.pathname, `${cacheKey(body.command, timestamp, center)}.json`)
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const response = await fetch(horizonsUrl(body.command, timestamp, center), { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Horizons request failed with HTTP ${response.status}.`)
  const position = parseHorizonsPlacement(await response.json())
  const result = {
    command: body.command, seat: body.seat ?? null, name: body.name ?? null, ...position, timestamp,
    center, frame: center === 'heliocentric' ? 'heliocentric ecliptic-of-date' : 'apparent ecliptic-of-date', source: 'NASA/JPL Horizons',
  }
  await writeFile(path, JSON.stringify(result), { mode: 0o600 })
  return result
}

createServer(async (request, response) => {
  const parsedUrl = new URL(request.url, `http://127.0.0.1:${port}`)
  if (request.method === 'GET' && parsedUrl.pathname === '/health') return json(response, 200, { ok: true, service: 'codex-ephemeris' })
  if (request.method === 'GET' && parsedUrl.pathname === '/api/geocode') {
    const query = (parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('name') || '').trim()
    if (query.length < 2) return json(response, 200, { query, results: [] })
    if (query.length > 100) return json(response, 400, { error: 'Query is too long.' })
    try {
      const results = await geocodeCity(query)
      return json(response, 200, { query, results })
    } catch (error) {
      return json(response, 200, { query, results: [], error: error.message })
    }
  }
  if (request.method !== 'POST' || parsedUrl.pathname !== '/api/ephemeris') return json(response, 404, { error: 'Not found.' })
  try {
    const input = validate(await requestBody(request))
    const placements = await mapConcurrent(input.bodies, 2, body => placement(body, input.timestamp, input.center))
    return json(response, 200, { timestamp: input.timestamp, center: input.center, placements, source: 'NASA/JPL Horizons' })
  } catch (error) {
    return json(response, 400, { error: error.message })
  }
}).listen(port, '127.0.0.1', () => console.log(`Codex ephemeris service listening on http://127.0.0.1:${port}`))
