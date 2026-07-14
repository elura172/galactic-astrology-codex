import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cacheKey, horizonsUrl, mapConcurrent, parseHorizonsPlacement } from './horizons.js'

const port = Number(process.env.SKY_PORT || 8787)
const cacheDirectory = new URL('../.cache/ephemeris/', import.meta.url)
await mkdir(cacheDirectory, { recursive: true })

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
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
  if (!Array.isArray(body.bodies) || !body.bodies.length || body.bodies.length > 100) throw new Error('Supply between 1 and 100 bodies.')
  body.bodies.forEach(item => {
    if (!/^\d+;$/.test(item.command)) throw new Error('Every body requires a numeric Horizons small-body command.')
  })
  return { timestamp: timestamp.toISOString(), bodies: body.bodies }
}

async function placement(body, timestamp) {
  const path = join(cacheDirectory.pathname, `${cacheKey(body.command, timestamp)}.json`)
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const response = await fetch(horizonsUrl(body.command, timestamp), { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Horizons request failed with HTTP ${response.status}.`)
  const position = parseHorizonsPlacement(await response.json())
  const result = {
    command: body.command, seat: body.seat ?? null, name: body.name ?? null, ...position, timestamp,
    center: 'geocentric', frame: 'apparent ecliptic-of-date', source: 'NASA/JPL Horizons',
  }
  await writeFile(path, JSON.stringify(result), { mode: 0o600 })
  return result
}

createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') return json(response, 200, { ok: true, service: 'codex-ephemeris' })
  if (request.method !== 'POST' || request.url !== '/api/ephemeris') return json(response, 404, { error: 'Not found.' })
  try {
    const input = validate(await requestBody(request))
    const placements = await mapConcurrent(input.bodies, 2, body => placement(body, input.timestamp))
    return json(response, 200, { timestamp: input.timestamp, placements, source: 'NASA/JPL Horizons' })
  } catch (error) {
    return json(response, 400, { error: error.message })
  }
}).listen(port, '127.0.0.1', () => console.log(`Codex ephemeris service listening on http://127.0.0.1:${port}`))
