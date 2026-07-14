export function uniqueMeasuredBodies(glyphs) {
  const byCommand = new Map()
  glyphs.filter(glyph => glyph.catalogueId).forEach(glyph => {
    const command = glyph.catalogueId.horizonsCommand
    if (!byCommand.has(command)) byCommand.set(command, { command, name: glyph.name })
  })
  return [...byCommand.values()]
}

export function placementsBySeat(placements, glyphs) {
  const byCommand = new Map(placements.map(placement => [placement.command, placement]))
  return new Map(glyphs.flatMap(glyph => {
    const placement = glyph.catalogueId && byCommand.get(glyph.catalogueId.horizonsCommand)
    return placement ? [[glyph.number, { ...placement, seat: glyph.number, name: glyph.name }]] : []
  }))
}

export function zodiacLabel(longitude) {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
  const normalized = ((longitude % 360) + 360) % 360
  const sign = Math.floor(normalized / 30)
  return `${(normalized % 30).toFixed(2)}° ${signs[sign]}`
}

export async function fetchEphemerisInBatches({ timestamp, bodies, batchSize = 8, signal, fetcher = fetch, endpoint = '/api/ephemeris', onProgress = () => {} }) {
  const placements = []
  for (let start = 0; start < bodies.length; start += batchSize) {
    if (signal?.aborted) throw new DOMException('The ephemeris calculation was cancelled.', 'AbortError')
    const batch = bodies.slice(start, start + batchSize)
    const response = await fetcher(endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal,
      body: JSON.stringify({ timestamp, bodies: batch }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'The ephemeris could not be opened.')
    placements.push(...result.placements)
    onProgress({ completed: placements.length, total: bodies.length, placements: [...placements] })
  }
  return { timestamp, placements, source: 'NASA/JPL Horizons' }
}

export function technicalRecord({ timestamp, mode, placements, planets, angles, houses, angleConfidence }) {
  return {
    schema: 'celestial-glyphs/technical-record/v1',
    generatedAt: new Date().toISOString(),
    chart: { timestamp, mode, center: 'geocentric', frame: 'apparent ecliptic-of-date', source: 'NASA/JPL Horizons' },
    countingRules: { glyphClusters: 'unique catalogue bodies', canonicalDisplay: 'all 108 seats including seams and invoked presences' },
    glyphPlacements: [...placements.values()].map(({ command, seat, name, longitude, latitude }) => ({ command, seat, name, longitude, latitude })),
    planetaryPlacements: planets.map(({ command, name, longitude, latitude }) => ({ command, name, longitude, latitude })),
    angles: angles ? { confidence: angleConfidence, ...angles } : null,
    houses: houses ? { system: 'Whole Sign', cusps: houses } : null,
  }
}
