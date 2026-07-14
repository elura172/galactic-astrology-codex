import { conjunction } from './astrology.js'
import { contactsBetween, decagonalChord, normalizeLongitude } from './astrology.js'

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

export function densestCluster(glyphs, placementsBySeat, maxSpan = 6) {
  const unique = new Map()
  placementsBySeat.forEach(placement => {
    if (!unique.has(placement.command)) unique.set(placement.command, placement)
  })
  const points = [...unique.values()].sort((first, second) => first.longitude - second.longitude)
  if (!points.length) return null
  const extended = [...points, ...points.map(point => ({ ...point, longitude: point.longitude + 360 }))]
  let best = null
  for (let start = 0; start < points.length; start += 1) {
    let end = start
    while (end + 1 < start + points.length && extended[end + 1].longitude - extended[start].longitude <= maxSpan) end += 1
    const members = extended.slice(start, end + 1)
    const span = members.at(-1).longitude - members[0].longitude
    if (!best || members.length > best.members.length || (members.length === best.members.length && span < best.span)) best = { members, span }
  }
  const commands = new Set(best.members.map(member => member.command))
  const seats = glyphs.filter(glyph => glyph.catalogueId && commands.has(glyph.catalogueId.horizonsCommand)).map(glyph => glyph.number)
  return {
    members: best.members.map(member => ({ ...member, longitude: normalizeLongitude(member.longitude) })),
    seats,
    span: best.span,
    center: normalizeLongitude(best.members[0].longitude + best.span / 2),
    countingRule: 'unique catalogue bodies',
  }
}

export function strongestChords(points, perFamily = 5) {
  const tierRank = { lattice: 0, working: 1, whisper: 2 }
  const contacts = contactsBetween(points, decagonalChord)
    .filter(contact => !(contact.first.kind === 'angle' && contact.second.kind === 'angle'))
    .sort((first, second) => tierRank[first.tier] - tierRank[second.tier] || first.orb - second.orb)
  const byFamily = new Map()
  contacts.forEach(contact => {
    const family = byFamily.get(contact.aspect) || []
    if (family.length < perFamily) family.push(contact)
    byFamily.set(contact.aspect, family)
  })
  return byFamily
}
