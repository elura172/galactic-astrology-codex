export function parseLineages(markdown) {
  // Core essences from the overview table
  const essences = new Map()
  const essRe = /^\| (\d{1,2}) \| ([A-Za-z ]+) \| ([^|]+) \|$/gm
  let em
  while ((em = essRe.exec(markdown))) essences.set(em[2].trim(), em[3].trim())

  const sections = markdown.split(/^## \u2727 LINEAGE /m).slice(1)
  return sections.map((sec, i) => {
    const titleCase = s => s.trim().toLowerCase().replace(/(^|[ -])([a-z])/g, (m, p, c) => p + c.toUpperCase())
    const name = titleCase(sec.match(/^[A-Z]+:\s*([A-Z ]+)/)?.[1] || '')
    const subtitle = clean(sec.match(/^\*([^*\n]+)\*$/m)?.[1])
    const quoteLines = [...sec.matchAll(/^> \*?([^\n]*?)\*?\s*$/gm)].map(m => m[1]).filter(Boolean)
    const starIdx = sec.indexOf('**Star Origin:**')
    const quote = quoteLines.filter((q, qi) => {
      const pos = sec.indexOf(q)
      return starIdx < 0 || pos < starIdx
    }).join(' ').replace(/"/g, '').trim()
    const grab = label => clean(sec.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([\\s\\S]*?)\\n\\n`))?.[1])
    const echoes = []
    const echoBlock = sec.split(/### \u2726 Glyph Echoes/)[1] || ''
    const rowRe = /^\| ([^|\n]+) \| \(?([\d,]+)\)? \| ([^|\n]+) \| ([^|\n]+) \|/gm
    let rm
    while ((rm = rowRe.exec(echoBlock))) {
      const body = clean(rm[1]); if (body === 'Body' || /^-+$/.test(body)) continue
      const station = clean(rm[3])
      const seatMatch = station.match(/\.(\d{1,3})/)
      echoes.push({ body, cat: rm[2].trim(), station, office: clean(rm[4]), seat: seatMatch ? Number(seatMatch[1]) : null })
    }
    return {
      index: i, name,
      essence: essences.get(name) || '',
      subtitle, quote,
      starOrigin: grab('Star Origin'),
      functions: grab('Functions'),
      mantra: grab('Ritual Mantra').replace(/"/g, ''),
      crystals: grab('Crystal Allies'),
      closing: grab('Closing Thought'),
      echoes,
    }
  }).filter(l => l.name)
}
