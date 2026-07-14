import './style.css'
import codexMarkdown from '../codex_of_celestial_glyphs.md?raw'
import { GROUPS, CHORDS, parseCodex, seamCounterpart, chordDestinations, adjacentFaces, relatedGlyphNumbers, classifiedRelationships } from './codex.js'
import { fetchEphemerisInBatches, placementsBySeat, technicalRecord, uniqueMeasuredBodies, zodiacLabel } from './sky.js'
import { chartAngles, houseForLongitude, lineageHouseResonance, MAJOR_BODIES, wholeSignHouses, zonedDateTime } from './chart.js'
import { conjunction } from './astrology.js'
import { angleContacts, densestCluster, planetaryCourts, populatedCourts, strongestChords } from './reading.js'
import { composeTransmission } from './synthesis.js'

const COLORS = [
  '#748c83', '#7893a3', '#9a7892', '#a45743', '#c29854',
  '#667d9b', '#705b73', '#73958d', '#a76c76', '#8e8b59',
  '#514761', '#b38f52',
]


const glyphs = parseCodex(codexMarkdown)
const glyphByNumber = new Map(glyphs.map(glyph => [glyph.number, glyph]))

if (glyphs.length !== 108) {
  throw new Error(`Codex parser expected 108 seats and found ${glyphs.length}.`)
}

const state = {
  mode: 'rings',
  selected: 1,
  chamber: false,
  relatedCursor: -1,
  relatedRing: [],
  relatedAnchor: null,
  skyOpen: false,
  skyMode: null,
  skyTimestamp: null,
  skyPlacements: new Map(),
  majorPlacements: [],
  chartAngles: null,
  angleConfidence: null,
  houses: null,
  skyHighlight: null,
  skyStatus: '',
  skyController: null,
}

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="threshold" data-threshold>
    <div class="threshold__seal" aria-hidden="true"><span>108</span></div>
    <p class="eyebrow">Spiral of Cellular Light · Canonical Instrument</p>
    <h1>The Codex of<br><i>Celestial Glyphs</i></h1>
    <p class="threshold__lede">Twelve faces. Ninety-nine voices. Nine seams through which the wheel remembers itself.</p>
    <button class="enter-key" data-enter>Enter the instrument <span>↘</span></button>
  </div>

  <main class="instrument" aria-hidden="true">
    <header class="masthead">
      <a class="wordmark" href="#" aria-label="Celestial Glyphs home">
        <span class="wordmark__mark">CG</span>
        <span>Celestial Glyphs<small>Canonical instrument · 108 seats</small></span>
      </a>
      <div class="mode-switch" role="group" aria-label="Explorer mode">
        <button class="is-active" data-mode="rings">Rings <kbd>1</kbd></button>
        <button data-mode="faces">Faces <kbd>2</kbd></button>
        <button data-mode="chords">Chords <kbd>3</kbd></button>
      </div>
      <button class="index-button" data-chamber aria-pressed="false">
        <span>Astral chamber</span><b>◫</b>
      </button>
      <button class="sky-button" data-sky-open aria-expanded="false"><span>Set the sky</span><b>☉</b></button>
    </header>

    <section class="workbench">
      <aside class="rail rail--left">
        <div class="rail__block census">
          <span class="rail__label">Census</span>
          <strong>108</strong>
          <p>seats</p>
          <dl><div><dt>Voices</dt><dd>99</dd></div><div><dt>Seams</dt><dd>09</dd></div><div><dt>Faces</dt><dd>12</dd></div></dl>
        </div>
        <div class="rail__block search-block">
          <label for="glyph-search">Find a voice</label>
          <div class="search-shell"><input id="glyph-search" type="search" placeholder="Name or seat" autocomplete="off"><span>⌕</span></div>
          <div class="search-results" data-results></div>
        </div>
        <div class="rail__block legend" data-legend></div>
      </aside>

      <section class="plot-shell" aria-label="108-seat mandala explorer">
        <div class="plot-heading">
          <span data-mode-kicker>01 · Ring register</span>
          <h2 data-mode-title>The dodecahedral mandala</h2>
          <p data-mode-copy>Ten working faces around two axial courts. Select any numbered seat.</p>
        </div>
        <svg class="mandala" viewBox="0 0 820 820" role="group" aria-label="Celestial glyph mandala" data-mandala></svg>
        <div class="plot-readout" aria-live="polite" data-live></div>
      </section>

      <aside class="rail rail--right" data-detail></aside>
    </section>

    <footer class="instrument-footer">
      <span>Canonical vessel · July 2026</span>
      <span data-footer-nav>← → move between seats</span>
      <span data-footer-state>Ring register active</span>
    </footer>
  </main>
  <aside class="sky-drawer" data-sky-drawer aria-hidden="true">
    <div class="sky-drawer__header"><div><span>Ephemeris layer</span><h2>Set the sky</h2></div><button data-sky-close aria-label="Close sky controls">×</button></div>
    <div class="sky-kind" role="group" aria-label="Chart kind"><button class="is-active" data-sky-kind="live">Live sky</button><button data-sky-kind="birth">Birth chart</button></div>
    <button class="reference-chart" data-reference-chart>Load Greenwich · J2000 reference</button>
    <form data-sky-form>
      <label>Moment in local time<input type="datetime-local" name="moment" required></label>
      <div class="birth-fields" data-birth-fields hidden>
        <label>Time confidence<select name="confidence"><option value="exact">Exact</option><option value="approximate">Approximate</option><option value="unknown">Unknown</option></select></label>
        <label>Birthplace note <input name="place" autocomplete="off" placeholder="City, country · optional local note"></label>
        <div class="coordinate-fields"><label>Latitude<input name="latitude" type="number" min="-90" max="90" step="any" placeholder="43.6532"></label><label>Longitude<input name="longitude" type="number" min="-180" max="180" step="any" placeholder="-79.3832"></label></div>
        <label>Confirmed timezone<input name="timezone" placeholder="America/Toronto" autocomplete="off"></label>
        <p>Coordinates and timezone are confirmed directly; the birthplace text remains local and is never sent to a geocoder.</p>
      </div>
      <div class="sky-privacy"><i>◇</i><p><b>Transient by design</b>Nothing entered here is saved. The ephemeris service receives only the selected instant and canonical body identifiers.</p></div>
      <button class="sky-calculate" type="submit">Calculate glyph field <span>→</span></button>
      <div class="calculation-progress" data-calculation-progress hidden><div><i data-progress-bar></i></div><p><span data-progress-count>0 / 106</span><button type="button" data-cancel-sky>Cancel</button></p></div>
      <p class="sky-status" data-sky-status aria-live="polite"></p>
      <section class="house-resonance" data-house-resonance hidden></section>
      <section class="reading-folio" data-reading-folio hidden></section>
    </form>
  </aside>
`

const instrument = document.querySelector('.instrument')
const threshold = document.querySelector('[data-threshold]')
const mandala = document.querySelector('[data-mandala]')
const detail = document.querySelector('[data-detail]')
const live = document.querySelector('[data-live]')
const results = document.querySelector('[data-results]')
const skyDrawer = document.querySelector('[data-sky-drawer]')

const escapeHtml = value => value.replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
})[character])

const polar = (radius, degrees) => {
  const radians = degrees * Math.PI / 180
  return { x: 410 + Math.cos(radians) * radius, y: 410 + Math.sin(radians) * radius }
}

function nodePosition(glyph) {
  const group = glyph.groupIndex
  const within = (glyph.number - 1) % 9
  if (group < 10) {
    const row = Math.floor(within / 3)
    const column = within % 3
    return polar(246 + row * 37, -90 + group * 36 + (column - 1) * 6.5)
  }
  return polar(group === 10 ? 105 : 166, -90 + within * 40)
}

function ringPath(inner, outer, startDegrees, endDegrees) {
  const a = polar(inner, startDegrees)
  const b = polar(outer, startDegrees)
  const c = polar(outer, endDegrees)
  const d = polar(inner, endDegrees)
  return `M ${a.x} ${a.y} L ${b.x} ${b.y} A ${outer} ${outer} 0 0 1 ${c.x} ${c.y} L ${d.x} ${d.y} A ${inner} ${inner} 0 0 0 ${a.x} ${a.y} Z`
}

function polygonPoints(sides, radius, rotation = -90) {
  return Array.from({ length: sides }, (_, index) => {
    const point = polar(radius, rotation + index * 360 / sides)
    return `${point.x},${point.y}`
  }).join(' ')
}

function chordLines(selected) {
  if (state.mode !== 'chords' || selected.groupIndex > 9) return ''
  const source = nodePosition(selected)
  const within = (selected.number - 1) % 9
  return CHORDS.map(chord => {
    const targetGroup = (selected.groupIndex + chord.offset) % 10
    const target = nodePosition(glyphByNumber.get(targetGroup * 9 + within + 1))
    return `<g class="chord chord--${chord.className}">
      <line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" />
      <text x="${(source.x + target.x) / 2}" y="${(source.y + target.y) / 2 - 7}">${chord.angle}</text>
    </g>`
  }).join('')
}

function relationshipPath(source, target, index) {
  const midpoint = { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 }
  const inward = 0.22 + (index % 3) * 0.045
  const control = {
    x: midpoint.x + (410 - midpoint.x) * inward,
    y: midpoint.y + (410 - midpoint.y) * inward,
  }
  return `M ${source.x} ${source.y} Q ${control.x} ${control.y} ${target.x} ${target.y}`
}

function chamberRelationships(selected) {
  if (!state.chamber) return ''
  const source = nodePosition(selected)
  return classifiedRelationships(selected, glyphs).map((relationship, index) => {
    const target = nodePosition(relationship.target)
    return `<g class="relationship relationship--${relationship.type}">
      <path d="${relationshipPath(source, target, index)}" />
      <circle cx="${target.x}" cy="${target.y}" r="11" />
      <title>${escapeHtml(relationship.label)} to seat ${relationship.target.number}, ${escapeHtml(relationship.target.name)}</title>
    </g>`
  }).join('')
}

function skyLayer(selected) {
  if (!state.skyPlacements.size) return ''
  const signs = ['ARI', 'TAU', 'GEM', 'CAN', 'LEO', 'VIR', 'LIB', 'SCO', 'SAG', 'CAP', 'AQU', 'PIS']
  const ticks = Array.from({ length: 36 }, (_, index) => {
    const outer = polar(394, -90 + index * 10)
    const inner = polar(index % 3 === 0 ? 382 : 388, -90 + index * 10)
    return `<line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}" />`
  }).join('')
  const labels = signs.map((sign, index) => {
    const point = polar(406, -75 + index * 30)
    return `<text x="${point.x}" y="${point.y}">${sign}</text>`
  }).join('')
  const points = [...state.skyPlacements.entries()].map(([seat, placement]) => {
    const point = polar(386, -90 + placement.longitude)
    const active = seat === selected.number
    return `<circle class="sky-point${active ? ' is-active' : ''}" data-sky-seat="${seat}" tabindex="0" role="button" aria-label="Seat ${seat}, ${escapeHtml(placement.name)}, ${zodiacLabel(placement.longitude)}" cx="${point.x}" cy="${point.y}" r="${active ? 4.8 : 1.8}"><title>Seat ${seat}, ${escapeHtml(placement.name)} · ${zodiacLabel(placement.longitude)}</title></circle>`
  }).join('')
  const activePlacement = state.skyPlacements.get(selected.number)
  const bridge = activePlacement ? (() => {
    const sky = polar(386, -90 + activePlacement.longitude)
    const seat = nodePosition(selected)
    return `<path class="sky-bridge" d="M ${sky.x} ${sky.y} Q 410 410 ${seat.x} ${seat.y}" />`
  })() : ''
  const planets = state.majorPlacements.map(placement => {
    const point = polar(370, -90 + placement.longitude)
    const body = MAJOR_BODIES.find(candidate => candidate.command === placement.command)
    return `<g class="planet-point"><circle cx="${point.x}" cy="${point.y}" r="7"/><text x="${point.x}" y="${point.y + 3}">${body?.symbol || '·'}</text><title>${body?.name || placement.name} · ${zodiacLabel(placement.longitude)}</title></g>`
  }).join('')
  const angles = state.chartAngles ? Object.entries({ ASC: state.chartAngles.ascendant, MC: state.chartAngles.midheaven, DSC: state.chartAngles.descendant, IC: state.chartAngles.imumCoeli }).map(([label, longitude]) => {
    const outer = polar(399, -90 + longitude)
    const inner = polar(375, -90 + longitude)
    return `<g class="angle-mark${state.angleConfidence === 'approximate' ? ' is-approximate' : ''}"><line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}"/><text x="${outer.x}" y="${outer.y}">${label}</text></g>`
  }).join('') : ''
  const houses = state.houses ? state.houses.map(house => {
    const outer = polar(365, -90 + house.cusp)
    const inner = polar(342, -90 + house.cusp)
    const label = polar(353, -75 + house.cusp)
    return `<g class="house-mark"><line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}"/><text x="${label.x}" y="${label.y}">${house.house}</text></g>`
  }).join('') : ''
  const highlight = state.skyHighlight?.type === 'cluster'
    ? `<path class="cluster-wash" d="${ringPath(365, 399, -90 + state.skyHighlight.center - state.skyHighlight.span / 2, -90 + state.skyHighlight.center + state.skyHighlight.span / 2)}"/>`
    : state.skyHighlight?.type === 'chord' ? (() => {
      const first = polar(370, -90 + state.skyHighlight.first.longitude)
      const second = polar(370, -90 + state.skyHighlight.second.longitude)
      return `<path class="measured-chord measured-chord--${state.skyHighlight.aspect.toLowerCase()}" d="M ${first.x} ${first.y} Q 410 410 ${second.x} ${second.y}"/>`
    })() : ''
  return `<g class="zodiac-register">${highlight}${ticks}${labels}${houses}${angles}</g><g class="sky-points">${points}${planets}${bridge}</g>`
}

function renderMandala() {
  const selected = glyphByNumber.get(state.selected)
  const chamberRelated = state.chamber ? classifiedRelationships(selected, glyphs) : []
  const chamberRelatedNumbers = new Set(chamberRelated.map(relationship => relationship.target.number))
  const sectorOpacity = state.mode === 'faces' ? 0.2 : 0.08
  const sectors = GROUPS.slice(0, 10).map((group, index) => `
    <path class="face-sector" data-group="${index}" d="${ringPath(218, 344, -106 + index * 36, -74 + index * 36)}"
      fill="${COLORS[index]}" fill-opacity="${sectorOpacity}" />
  `).join('')

  const labels = GROUPS.slice(0, 10).map((group, index) => {
    const point = polar(375, -90 + index * 36)
    const label = state.mode === 'faces' ? group.lineage : `${group.short} · ${group.name}`
    return `<text class="group-label" x="${point.x}" y="${point.y}" transform="rotate(${-90 + index * 36 + 90} ${point.x} ${point.y})">${escapeHtml(label)}</text>`
  }).join('')

  const nodes = glyphs.map(glyph => {
    const position = nodePosition(glyph)
    const selectedClass = glyph.number === state.selected ? ' is-selected' : ''
    const chamberRelationship = chamberRelatedNumbers.has(glyph.number)
    const mutedClass = (state.mode === 'faces' && glyph.groupIndex !== selected.groupIndex) || (state.chamber && !chamberRelationship && glyph.number !== selected.number) ? ' is-muted' : ''
    const relatedClass = chamberRelationship ? ' is-related' : ''
    return `<g class="seat${selectedClass}${relatedClass}${mutedClass}" data-seat="${glyph.number}" tabindex="0" role="button" aria-label="Seat ${glyph.number}, ${escapeHtml(glyph.name)}${chamberRelationship ? ', related to selected seat' : ''}">
      <circle class="seat__hit" cx="${position.x}" cy="${position.y}" r="15" />
      ${glyph.seam ? `<circle class="seat__seam" cx="${position.x}" cy="${position.y}" r="9" />` : ''}
      <circle class="seat__dot ${glyph.invoked ? 'seat__dot--invoked' : ''}" cx="${position.x}" cy="${position.y}" r="${glyph.number === state.selected ? 7 : 4.2}" fill="${glyph.invoked ? '#a46370' : COLORS[glyph.groupIndex]}" />
      <text class="seat__number" x="${position.x}" y="${position.y - 11}">${String(glyph.number).padStart(3, '0')}</text>
    </g>`
  }).join('')

  mandala.innerHTML = `
    <defs>
      <filter id="ink"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="8" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.35"/></filter>
    </defs>
    <g class="geometry">${sectors}<polygon points="${polygonPoints(10, 217)}"/><polygon class="geometry__inner" points="${polygonPoints(5, 194)}"/><circle cx="410" cy="410" r="184"/><circle cx="410" cy="410" r="126"/></g>
    <g class="sky-layer">${skyLayer(selected)}</g>
    <g class="chord-layer">${chordLines(selected)}</g>
    <g class="relationship-layer" aria-hidden="true">${chamberRelationships(selected)}</g>
    <g class="labels">${labels}
      <text class="axis-label" x="410" y="292">NADIR · GALACTIC CORE</text>
      <text class="axis-label" x="410" y="231">ZENITH · POLARIS</text>
    </g>
    <g class="seats">${nodes}</g>
    <g class="center-seal">
      <circle cx="410" cy="410" r="67" />
      <text x="410" y="400">${String(selected.number).padStart(3, '0')}</text>
      <text class="center-seal__name" x="410" y="425">${escapeHtml(selected.name)}</text>
      <text class="center-seal__meta" x="410" y="446">${selected.seam ? 'SEAM VOICE' : selected.invoked ? 'INVOKED PRESENCE' : 'CATALOGUE VOICE'}</text>
    </g>
  `

  mandala.querySelectorAll('[data-seat]').forEach(node => {
    const select = () => selectGlyph(Number(node.dataset.seat))
    node.addEventListener('click', select)
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select() }
    })
  })
  mandala.querySelectorAll('[data-sky-seat]').forEach(node => {
    const select = () => selectGlyph(Number(node.dataset.skySeat))
    node.addEventListener('click', select)
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select() }
    })
  })
}

function renderDetail() {
  const glyph = glyphByNumber.get(state.selected)
  const group = GROUPS[glyph.groupIndex]
  const counterpart = seamCounterpart(glyph, glyphs)
  const adjacent = adjacentFaces(glyph)
  const chords = chordDestinations(glyph, glyphByNumber)
  const relatedAnchor = glyphByNumber.get(state.relatedAnchor)
  const measured = state.skyPlacements.get(glyph.number)
  const planetContacts = measured ? state.majorPlacements.flatMap(placement => {
    const contact = conjunction(measured.longitude, placement.longitude)
    const body = MAJOR_BODIES.find(candidate => candidate.command === placement.command)
    return contact ? [{ ...contact, body, placement }] : []
  }) : []
  const natalHouse = measured && state.houses ? houseForLongitude(measured.longitude, state.houses) : null
  const skyReading = measured ? `<section class="measured-sky">
    <span>Measured sky · ${state.skyMode === 'birth' ? 'Natal field' : 'Live field'}</span>
    <p><b>${zodiacLabel(measured.longitude)}</b><small>${natalHouse ? `Whole Sign house ${natalHouse} · ` : ''}Latitude ${measured.latitude.toFixed(3)}° · NASA/JPL Horizons</small></p>
    ${planetContacts.length ? `<div>${planetContacts.map(contact => `<p><b>${contact.body.symbol} ${contact.body.name}</b><small>${contact.tier} conjunction · orb ${contact.orb.toFixed(3)}°</small></p>`).join('')}</div>` : '<em>No planetary conjunction within 3° · a measured silence</em>'}
  </section>` : ''
  const chamberPanel = state.chamber ? `
    <section class="chamber-panel" aria-label="Canonical relationships">
      <div class="chamber-panel__heading">
        <span>Canonical relationships</span>
        <p>${state.relatedRing.length} related seats in the ring of seat ${String(relatedAnchor.number).padStart(3, '0')} · derived from the wheel</p>
      </div>
      <nav class="related-nav" aria-label="Previous and next related glyph">
        <button data-related-prev aria-label="Previous related glyph">← <span>Previous related</span></button>
        <button data-related-next aria-label="Next related glyph"><span>Next related</span> →</button>
      </nav>
      ${counterpart ? `<div class="relationship-block relationship-block--seam">
        <span class="relationship-label">◆ Nine Seam counterpart</span>
        <button class="relationship-jump" data-jump-seat="${counterpart.number}">
          <b>${String(counterpart.number).padStart(3, '0')}</b><span>${escapeHtml(counterpart.name)}<small>${escapeHtml(GROUPS[counterpart.groupIndex].lineage)} · Face ${GROUPS[counterpart.groupIndex].short}</small></span><i>↗</i>
        </button>
      </div>` : ''}
      <div class="relationship-block">
        <span class="relationship-label">Lineage face</span>
        <p class="lineage-name">${escapeHtml(group.lineage)} <small>Face ${group.short} · ${escapeHtml(group.name)}</small></p>
        <div class="face-jumps">
          ${adjacent.map(face => {
            const target = glyphByNumber.get(face.number)
            const targetGroup = GROUPS[face.groupIndex]
            return `<button data-jump-seat="${target.number}"><small>${face.relation}</small><b>${targetGroup.short} · ${escapeHtml(targetGroup.lineage)}</b><span>${String(target.number).padStart(3, '0')} ${escapeHtml(target.name)}</span></button>`
          }).join('')}
        </div>
        ${glyph.groupIndex > 9 ? '<p class="court-note">The axial courts touch five faces in their course, and together touch all ten rings.</p>' : ''}
      </div>
      <div class="relationship-block">
        <span class="relationship-label">Decagonal chords</span>
        ${chords.length ? `<div class="chord-destinations">${chords.map(({ chord, target }) => `
          <button data-jump-seat="${target.number}">
            <i class="legend-line legend-line--${chord.className}"></i><b>${chord.angle}<small>${chord.name}</small></b><span><em>${String(target.number).padStart(3, '0')}</em>${escapeHtml(target.name)}</span><strong>↗</strong>
          </button>`).join('')}</div>` : '<p class="court-note">Axial seat · no decagonal chords. Its relationships travel by course.</p>'}
      </div>
    </section>` : ''
  detail.innerHTML = `
    <div class="detail-card">
      <div class="detail-card__topline"><span>Seat ${String(glyph.number).padStart(3, '0')}</span><span>${group.short}</span></div>
      <p class="detail-card__station">${escapeHtml(group.name)} · ${escapeHtml(group.gate)}</p>
      <h3>${escapeHtml(glyph.name)}</h3>
      <p class="catalogue">${escapeHtml(glyph.catalogue)}</p>
      <div class="glyph-sigil" style="--sigil-color:${COLORS[glyph.groupIndex]}" aria-hidden="true"><i></i><i></i><i></i></div>
      <dl class="glyph-fields">
        <div><dt>Function</dt><dd>${escapeHtml(glyph.function)}</dd></div>
        <div><dt>Craft thread</dt><dd>${escapeHtml(glyph.craft)}</dd></div>
        <div><dt>Lineage face</dt><dd>${escapeHtml(group.lineage)}</dd></div>
      </dl>
      <blockquote>${escapeHtml(glyph.mirror)}</blockquote>
      <div class="detail-flags">
        ${glyph.seam ? '<span>◆ Nine Seam</span>' : ''}
        ${glyph.invoked ? '<span>✦ Invoked Presence</span>' : '<span>○ Catalogue Seat</span>'}
      </div>
      ${skyReading}
      ${chamberPanel}
      <button class="chamber-key" data-detail-chamber>${state.chamber ? 'Return to instrument' : 'Enter this chamber'} <span>↗</span></button>
    </div>
  `
  detail.querySelector('[data-detail-chamber]').addEventListener('click', toggleChamber)
  detail.querySelectorAll('[data-jump-seat]').forEach(button => button.addEventListener('click', () => selectGlyph(Number(button.dataset.jumpSeat))))
  detail.querySelector('[data-related-prev]')?.addEventListener('click', () => selectRelated(-1))
  detail.querySelector('[data-related-next]')?.addEventListener('click', () => selectRelated(1))
  live.textContent = `Seat ${glyph.number}. ${glyph.name}. ${glyph.function}${state.chamber && counterpart ? ` Nine Seam counterpart: seat ${counterpart.number}, ${counterpart.name}.` : ''}`
}

function renderLegend() {
  const legend = document.querySelector('[data-legend]')
  if (state.mode === 'chords') {
    legend.innerHTML = `<span class="rail__label">Five chords</span>${CHORDS.map(chord => `<button data-chord-offset="${chord.offset}"><i class="legend-line legend-line--${chord.className}"></i><span>${chord.angle}<small>${chord.name}</small></span></button>`).join('')}`
  } else {
    legend.innerHTML = `<span class="rail__label">Notation</span><p><i class="legend-dot"></i> Catalogue voice</p><p><i class="legend-dot legend-dot--rose"></i> Invoked presence</p><p><i class="legend-seam"></i> Repeated seam voice</p>`
  }
}

function updateModeCopy() {
  const copy = {
    rings: ['01 · Ring register', 'The dodecahedral mandala', 'Ten working faces around two axial courts. Select any numbered seat.', 'Ring register active'],
    faces: ['02 · Lineage braid', 'Twelve faces, twelve origins', 'Each lineage stands at one face and sings across the whole mandala.', 'Lineage braid active'],
    chords: ['03 · Relationship grammar', 'The five chords of the wheel', 'Select a band seat to reveal Step, Gift, Vow, Spiral, and Mirror.', 'Chord lattice active'],
  }[state.mode]
  document.querySelector('[data-mode-kicker]').textContent = copy[0]
  document.querySelector('[data-mode-title]').textContent = copy[1]
  document.querySelector('[data-mode-copy]').textContent = copy[2]
  document.querySelector('[data-footer-state]').textContent = copy[3]
}

function selectGlyph(number, preserveRelatedRing = false) {
  state.selected = ((number - 1 + glyphs.length) % glyphs.length) + 1
  if (state.chamber && !preserveRelatedRing) {
    state.relatedRing = relatedGlyphNumbers(glyphByNumber.get(state.selected), glyphs)
    state.relatedCursor = -1
    state.relatedAnchor = state.selected
  }
  renderMandala()
  renderDetail()
}

function selectRelated(direction) {
  if (!state.relatedRing.length) return
  state.relatedCursor = state.relatedCursor === -1 && direction < 0
    ? state.relatedRing.length - 1
    : (state.relatedCursor + direction + state.relatedRing.length) % state.relatedRing.length
  selectGlyph(state.relatedRing[state.relatedCursor], true)
}

function setMode(mode) {
  state.mode = mode
  document.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('is-active', button.dataset.mode === mode))
  updateModeCopy()
  renderLegend()
  renderMandala()
}

function toggleChamber() {
  state.chamber = !state.chamber
  state.relatedRing = state.chamber ? relatedGlyphNumbers(glyphByNumber.get(state.selected), glyphs) : []
  state.relatedCursor = -1
  state.relatedAnchor = state.chamber ? state.selected : null
  document.body.classList.toggle('is-chamber', state.chamber)
  document.querySelector('[data-chamber]').setAttribute('aria-pressed', String(state.chamber))
  document.querySelector('[data-footer-nav]').textContent = state.chamber ? '← → move through related glyphs · Esc exits' : '← → move between seats'
  renderMandala()
  renderDetail()
}

function toggleSkyDrawer(open = !state.skyOpen) {
  state.skyOpen = open
  skyDrawer.classList.toggle('is-open', open)
  skyDrawer.setAttribute('aria-hidden', String(!open))
  document.querySelector('[data-sky-open]').setAttribute('aria-expanded', String(open))
  if (open) skyDrawer.querySelector('input')?.focus()
}

function setSkyKind(kind) {
  skyDrawer.querySelectorAll('[data-sky-kind]').forEach(button => button.classList.toggle('is-active', button.dataset.skyKind === kind))
  skyDrawer.querySelector('[data-birth-fields]').hidden = kind !== 'birth'
  skyDrawer.dataset.kind = kind
  if (kind === 'live') skyDrawer.querySelector('[name="moment"]').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function contactRows(contacts) {
  return contacts.map(contact => `<button data-folio-seat="${contact.glyph.number}">
    <span><b>${String(contact.glyph.number).padStart(3, '0')} · ${escapeHtml(contact.glyph.name)}</b><small>${zodiacLabel(contact.placement.longitude)} · orb ${contact.orb.toFixed(3)}° · ${contact.tier}</small></span>
    <em>${escapeHtml(contact.glyph.function)}</em>
  </button>`).join('')
}

function renderReadingFolio() {
  const folio = document.querySelector('[data-reading-folio]')
  const courts = planetaryCourts(glyphs, state.skyPlacements, state.majorPlacements, MAJOR_BODIES)
  const populated = populatedCourts(courts)
  const angles = angleContacts(glyphs, state.skyPlacements, state.chartAngles, state.angleConfidence)
  const silentCourts = courts.filter(court => !court.contacts.length && court.planet)
  const cluster = densestCluster(glyphs, state.skyPlacements)
  const uniqueGlyphPoints = [...new Map([...state.skyPlacements.values()].map(placement => [placement.command, { ...placement, id: placement.command, kind: 'glyph', label: placement.name }])).values()]
  const planetPoints = state.majorPlacements.map(placement => ({ ...placement, id: `planet:${placement.command}`, kind: 'planet', label: MAJOR_BODIES.find(body => body.command === placement.command)?.name || placement.name }))
  const anglePoints = state.chartAngles ? Object.entries({ Ascendant: state.chartAngles.ascendant, Midheaven: state.chartAngles.midheaven, Descendant: state.chartAngles.descendant, 'Imum Coeli': state.chartAngles.imumCoeli }).map(([label, longitude]) => ({ id: `angle:${label}`, kind: 'angle', label, longitude })) : []
  const chords = strongestChords([...uniqueGlyphPoints, ...planetPoints, ...anglePoints])
  const chordFamilies = ['Step', 'Gift', 'Vow', 'Spiral', 'Mirror']
  const evidence = [
    ...(cluster ? [{
      id: 'cluster:primary', kind: 'cluster', count: cluster.members.length,
      measurement: `${cluster.members.length} unique bodies within ${cluster.span.toFixed(3)}° centered at ${zodiacLabel(cluster.center)}`,
      transmission: `The field gathers ${cluster.members.map(member => member.name).slice(0, 4).join(', ')}${cluster.members.length > 4 ? ', and their companions' : ''} into one council. Their offices ask to be received together before any one voice is interpreted alone.`,
    }] : []),
    ...populated.flatMap(court => court.contacts.map(contact => ({
      id: `court:${court.body.command}:${contact.glyph.number}`, kind: 'court', tier: contact.tier, orb: contact.orb,
      measurement: `${contact.glyph.name} conjunct ${court.body.name} · orb ${contact.orb.toFixed(3)}°`,
      transmission: `Within ${court.body.name}'s court, ${contact.glyph.name} carries the office of ${contact.glyph.function.toLowerCase()}. Notice where this function is already moving through the life, and where it is still asking for form.`,
    }))),
    ...angles.flatMap(angle => angle.contacts.map(contact => ({
      id: `angle:${angle.key}:${contact.glyph.number}`, kind: 'angle', tier: contact.tier, orb: contact.orb, confidence: angle.confidence,
      measurement: `${contact.glyph.name} conjunct ${angle.label} · orb ${contact.orb.toFixed(3)}° · ${angle.confidence}`,
      transmission: `At the ${angle.label}, ${contact.glyph.name} approaches the threshold with its office of ${contact.glyph.function.toLowerCase()}. Receive this as an orientation, not an instruction.`,
    }))),
    ...chordFamilies.flatMap(family => (chords.get(family) || []).map((chord, index) => ({
      id: `chord:${family}:${index}`, kind: 'chord', tier: chord.tier, orb: chord.orb,
      measurement: `${chord.first.label} ${family} ${chord.second.label} · orb ${chord.orb.toFixed(3)}°`,
      transmission: `A ${family} joins ${chord.first.label} and ${chord.second.label}. Let these two offices be heard in relationship: neither completes the sentence alone.`,
    }))),
  ]
  const synthesis = composeTransmission(evidence)
  const isNatal = state.skyMode === 'birth'
  folio.innerHTML = `<header><span>${isNatal ? 'Natal' : 'Live'} result folio</span><h3>Measured correspondences</h3><p>Measurement and canonical interpretation remain separate registers.</p></header>
    <section><div class="folio-heading"><span>01</span><h4>Planetary courts</h4><small>${populated.length} populated</small></div>
      ${populated.length ? populated.map(court => `<article><h5>${court.body.symbol} ${court.body.name}'s Court <small>${zodiacLabel(court.planet.longitude)}</small></h5>${contactRows(court.contacts)}</article>`).join('') : '<p class="folio-silence">No glyph lies within the declared 3° conjunction range of a planetary point.</p>'}
      ${silentCourts.length ? `<p class="folio-silence"><b>Silent courts</b> ${silentCourts.map(court => court.body.name).join(' · ')}</p>` : ''}
    </section>
    <section><div class="folio-heading"><span>02</span><h4>The four angles</h4><small>${angles.length ? state.angleConfidence : 'unavailable'}</small></div>
      ${angles.length ? angles.map(angle => `<article class="angle-record${angle.confidence === 'approximate' ? ' is-approximate' : ''}"><h5>${angle.label} <small>${zodiacLabel(angle.longitude)} · ${angle.confidence}</small></h5>${angle.contacts.length ? contactRows(angle.contacts) : '<p class="folio-silence">No glyph within 3° · measured silence</p>'}</article>`).join('') : `<p class="folio-silence">${isNatal ? 'Birth time unknown: angle claims are suppressed.' : 'Angles belong to a located chart and are not inferred for the geocentric live field.'}</p>`}
    </section>
    <section><div class="folio-heading"><span>03</span><h4>The densest gathering</h4><small>${cluster?.members.length || 0} bodies</small></div>
      ${cluster ? `<article class="cluster-record"><h5>${zodiacLabel(cluster.center)} <small>${cluster.span.toFixed(3)}° span · ${cluster.countingRule}</small></h5><p>${cluster.members.map(member => escapeHtml(member.name)).join(' · ')}</p><p class="cluster-seats">Canonical seats ${cluster.seats.map(seat => String(seat).padStart(3, '0')).join(' · ')}</p><button class="folio-reveal" data-reveal-cluster>Reveal gathering on wheel <span>↗</span></button></article>` : '<p class="folio-silence">No measured glyph field available.</p>'}
    </section>
    <section><div class="folio-heading"><span>04</span><h4>The chord lattice</h4><small>strongest by family</small></div>
      ${chordFamilies.map(family => {
        const familyChords = chords.get(family) || []
        return `<article class="chord-family"><h5>${family} <small>${familyChords.length ? `${familyChords.length} strongest` : 'silent'}</small></h5>${familyChords.length ? familyChords.map((chord, index) => `<button data-reveal-chord="${family}:${index}"><span><b>${escapeHtml(chord.first.label)} ↔ ${escapeHtml(chord.second.label)}</b><small>${chord.separation.toFixed(3)}° separation · orb ${chord.orb.toFixed(3)}°</small></span><em>${chord.tier}</em></button>`).join('') : '<p class="folio-silence">No chord within 2° of this family.</p>'}</article>`
      }).join('')}
    </section>
    <section class="synthesis-gate"><div class="folio-heading"><span>05</span><h4>Synthesis</h4><small>${synthesis.evidence.length} primary threads</small></div>
      <div class="synthesis-threshold"><p>The following transmission is composed from the strongest measured relationships in this chart and the canonical offices they activate. It is offered as a mirror. Keep what brings recognition; leave what does not.</p><button data-receive-synthesis>Receive the synthesis <span>↓</span></button></div>
      <div class="transmission" data-transmission hidden><span>Transmission</span>${synthesis.passages.map(passage => `<p>${escapeHtml(passage)}</p>`).join('')}<blockquote>What is measured creates the vessel. What is recognized remains yours to name.</blockquote><details><summary>Open the evidence record</summary>${synthesis.evidence.map(item => `<p><b>${item.score}</b><span>${escapeHtml(item.measurement)}</span></p>`).join('')}</details></div>
    </section><button class="export-record" data-export-record>Export technical record <span>JSON ↓</span></button>`
  folio.hidden = false
  folio.querySelectorAll('[data-folio-seat]').forEach(button => button.addEventListener('click', () => {
    selectGlyph(Number(button.dataset.folioSeat))
    toggleSkyDrawer(false)
  }))
  folio.querySelector('[data-reveal-cluster]')?.addEventListener('click', () => {
    state.skyHighlight = { type: 'cluster', center: cluster.center, span: Math.max(cluster.span, .8) }
    renderMandala()
    toggleSkyDrawer(false)
  })
  folio.querySelectorAll('[data-reveal-chord]').forEach(button => button.addEventListener('click', () => {
    const [family, index] = button.dataset.revealChord.split(':')
    const chord = chords.get(family)[Number(index)]
    state.skyHighlight = { type: 'chord', aspect: chord.aspect, first: chord.first, second: chord.second }
    renderMandala()
    toggleSkyDrawer(false)
  }))
  folio.querySelector('[data-receive-synthesis]')?.addEventListener('click', buttonEvent => {
    const transmission = folio.querySelector('[data-transmission]')
    transmission.hidden = false
    buttonEvent.currentTarget.setAttribute('aria-expanded', 'true')
    transmission.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  })
  folio.querySelector('[data-export-record]').addEventListener('click', () => {
    const record = technicalRecord({ timestamp: state.skyTimestamp, mode: state.skyMode, placements: state.skyPlacements, planets: state.majorPlacements, angles: state.chartAngles, houses: state.houses, angleConfidence: state.angleConfidence })
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }))
    const anchor = Object.assign(document.createElement('a'), { href: url, download: `celestial-glyphs-${state.skyTimestamp.slice(0, 10)}.json` })
    anchor.click()
    URL.revokeObjectURL(url)
  })
}

async function calculateSky(event) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const kind = skyDrawer.dataset.kind || 'live'
  const confidence = form.get('confidence')
  let moment
  let angles = null
  let houses = null
  try {
    if (kind === 'birth') {
      moment = zonedDateTime(form.get('moment'), form.get('timezone'))
      if (confidence !== 'unknown') {
        if (form.get('latitude') === '' || form.get('longitude') === '') throw new Error('Confirmed coordinates are required for chart angles.')
        angles = chartAngles(moment, Number(form.get('latitude')), Number(form.get('longitude')))
        houses = wholeSignHouses(angles.ascendant)
      }
    } else {
      moment = new Date(form.get('moment'))
    }
    if (!Number.isFinite(moment.getTime())) throw new Error('Enter a valid moment.')
  } catch (error) {
    document.querySelector('[data-sky-status]').textContent = error.message
    return
  }
  const status = document.querySelector('[data-sky-status]')
  status.textContent = 'Opening the ephemeris · 96 glyph bodies + 10 planetary points'
  event.currentTarget.querySelector('button[type="submit"]').disabled = true
  const progress = document.querySelector('[data-calculation-progress]')
  progress.hidden = false
  state.skyController?.abort()
  state.skyController = new AbortController()
  try {
    const bodies = [...uniqueMeasuredBodies(glyphs), ...MAJOR_BODIES]
    state.chartAngles = angles
    state.houses = houses
    state.angleConfidence = kind === 'birth' ? confidence : null
    const result = await fetchEphemerisInBatches({
      timestamp: moment.toISOString(), bodies, signal: state.skyController.signal,
      onProgress: partial => {
        state.skyPlacements = placementsBySeat(partial.placements, glyphs)
        state.majorPlacements = partial.placements.filter(placement => MAJOR_BODIES.some(body => body.command === placement.command))
        document.querySelector('[data-progress-count]').textContent = `${partial.completed} / ${partial.total}`
        document.querySelector('[data-progress-bar]').style.width = `${partial.completed / partial.total * 100}%`
        status.textContent = `Receiving the ephemeris · ${partial.completed} of ${partial.total} bodies · partial field visible`
        renderMandala()
      },
    })
    state.skyPlacements = placementsBySeat(result.placements, glyphs)
    state.majorPlacements = result.placements.filter(placement => MAJOR_BODIES.some(body => body.command === placement.command))
    state.skyTimestamp = result.timestamp
    state.skyMode = kind
    state.skyHighlight = null
    const angleStatus = kind === 'birth' ? (angles ? ` · Whole Sign houses · angles ${confidence}` : ' · houses and angles suppressed') : ''
    status.textContent = `${state.skyPlacements.size} seats + ${state.majorPlacements.length} planets measured${angleStatus} · NASA/JPL Horizons`
    const resonancePanel = document.querySelector('[data-house-resonance]')
    if (houses) {
      const resonances = lineageHouseResonance(glyphs, state.skyPlacements, houses)
      const dominant = Array.from({ length: 12 }, (_, index) => {
        const candidates = resonances.filter(item => item.house === index + 1).sort((a, b) => b.seats.length - a.seats.length)
        return candidates[0]
      }).filter(Boolean)
      resonancePanel.innerHTML = `<span>Lineage–house resonance</span><p>Calculated houses remain distinct from canonical faces.</p><ol>${dominant.map(item => `<li><b>House ${item.house}</b><span>${escapeHtml(GROUPS[item.groupIndex].lineage)}</span><small>${item.seats.length} glyph seat${item.seats.length === 1 ? '' : 's'}</small></li>`).join('')}</ol>`
      resonancePanel.hidden = false
    } else {
      resonancePanel.hidden = true
    }
    renderReadingFolio()
    document.body.classList.add('has-sky')
    renderMandala()
    renderDetail()
    updateModeCopy()
  } catch (error) {
    status.textContent = error.name === 'AbortError' ? 'Calculation cancelled · received placements remain visible and cached' : error.message
  } finally {
    event.currentTarget.querySelector('button[type="submit"]').disabled = false
    progress.hidden = true
    state.skyController = null
  }
}

document.querySelector('[data-enter]').addEventListener('click', () => {
  threshold.classList.add('is-departing')
  instrument.setAttribute('aria-hidden', 'false')
  setTimeout(() => document.body.classList.add('has-entered'), 280)
})

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)))
document.querySelector('[data-chamber]').addEventListener('click', toggleChamber)
document.querySelector('[data-sky-open]').addEventListener('click', () => toggleSkyDrawer())
document.querySelector('[data-sky-close]').addEventListener('click', () => toggleSkyDrawer(false))
document.querySelectorAll('[data-sky-kind]').forEach(button => button.addEventListener('click', () => setSkyKind(button.dataset.skyKind)))
document.querySelector('[data-sky-form]').addEventListener('submit', calculateSky)
document.querySelector('[data-cancel-sky]').addEventListener('click', () => state.skyController?.abort())
document.querySelector('[data-reference-chart]').addEventListener('click', () => {
  setSkyKind('birth')
  const form = document.querySelector('[data-sky-form]')
  form.elements.moment.value = '2000-01-01T12:00'
  form.elements.confidence.value = 'exact'
  form.elements.place.value = 'Greenwich J2000 reference'
  form.elements.latitude.value = '0'
  form.elements.longitude.value = '0'
  form.elements.timezone.value = 'UTC'
  document.querySelector('[data-sky-status]').textContent = 'Synthetic public reference loaded · submit when ready'
})
setSkyKind('live')

document.querySelector('#glyph-search').addEventListener('input', event => {
  const query = event.target.value.trim().toLowerCase()
  if (!query) { results.innerHTML = ''; return }
  const matches = glyphs.filter(glyph => glyph.name.toLowerCase().includes(query) || String(glyph.number).includes(query)).slice(0, 6)
  results.innerHTML = matches.map(glyph => `<button data-search-seat="${glyph.number}"><b>${String(glyph.number).padStart(3, '0')}</b><span>${escapeHtml(glyph.name)}</span></button>`).join('') || '<p>No voice found.</p>'
  results.querySelectorAll('[data-search-seat]').forEach(button => button.addEventListener('click', () => {
    selectGlyph(Number(button.dataset.searchSeat))
    event.target.value = ''
    results.innerHTML = ''
  }))
})

document.addEventListener('keydown', event => {
  if (event.target.matches('input')) return
  if (event.key === 'ArrowRight') state.chamber ? selectRelated(1) : selectGlyph(state.selected + 1)
  if (event.key === 'ArrowLeft') state.chamber ? selectRelated(-1) : selectGlyph(state.selected - 1)
  if (['1', '2', '3'].includes(event.key)) setMode(['rings', 'faces', 'chords'][Number(event.key) - 1])
  if (event.key === 'Escape' && state.chamber) toggleChamber()
  else if (event.key === 'Escape' && state.skyOpen) toggleSkyDrawer(false)
})

renderLegend()
updateModeCopy()
renderMandala()
renderDetail()
