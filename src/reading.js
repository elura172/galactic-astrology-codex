import { conjunction } from './astrology.js'

export function planetaryCourts(glyphs, placementsBySeat, majorPlacements, majorBodies) {
  return majorBodies.map(body => {
    const planet = majorPlacements.find(placement => placement.command === body.command)
    if (!planet) return { body, planet: null, contacts: [] }
    const contacts = glyphs.flatMap(glyph => {
      const placement = placementsBySeat.get(glyph.number)
      if (!placement) return []
      const contact = conjunction(placement.longitude, planet.longitude)
      return contact ? [{ glyph, placement, ...contact }] : []
    }).sort((first, second) => first.orb - second.orb || first.glyph.number - second.glyph.number)
    return { body, planet, contacts }
  })
}

export function angleContacts(glyphs, placementsBySeat, angles, confidence = 'exact') {
  if (!angles) return []
  const angleDefinitions = [
    { key: 'ascendant', label: 'Ascendant', longitude: angles.ascendant },
    { key: 'midheaven', label: 'Midheaven', longitude: angles.midheaven },
    { key: 'descendant', label: 'Descendant', longitude: angles.descendant },
    { key: 'imumCoeli', label: 'Imum Coeli', longitude: angles.imumCoeli },
  ]
  return angleDefinitions.map(angle => ({
    ...angle,
    confidence,
    contacts: glyphs.flatMap(glyph => {
      const placement = placementsBySeat.get(glyph.number)
      if (!placement) return []
      const contact = conjunction(placement.longitude, angle.longitude)
      return contact ? [{ glyph, placement, ...contact }] : []
    }).sort((first, second) => first.orb - second.orb || first.glyph.number - second.glyph.number),
  }))
}

export function populatedCourts(courts) {
  return courts.filter(court => court.contacts.length)
}
