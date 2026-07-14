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
