import './style.css'
import codexMarkdown from '../codex_of_celestial_glyphs.md?raw'
import { GROUPS, CHORDS, parseCodex, seamCounterpart, chordDestinations, adjacentFaces, relatedGlyphNumbers, classifiedRelationships } from './codex.js'
import { placementsBySeat, uniqueMeasuredBodies, zodiacLabel } from './sky.js'

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
  skyStatus: '',
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
    <form data-sky-form>
      <label>Moment in local time<input type="datetime-local" name="moment" required></label>
      <div class="birth-fields" data-birth-fields hidden>
        <label>Time confidence<select name="confidence"><option value="exact">Exact</option><option value="approximate">Approximate</option><option value="unknown">Unknown</option></select></label>
        <label>Birthplace<input name="place" autocomplete="off" placeholder="City, country"></label>
        <p>Place remains in this browser. Angles and houses stay disabled until coordinates and timezone are explicitly confirmed.</p>
      </div>
      <div class="sky-privacy"><i>◇</i><p><b>Transient by design</b>Nothing entered here is saved. The ephemeris service receives only the selected instant and canonical body identifiers.</p></div>
      <button class="sky-calculate" type="submit">Calculate glyph field <span>→</span></button>
      <p class="sky-status" data-sky-status aria-live="polite"></p>
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
  return `<g class="zodiac-register">${ticks}${labels}</g><g class="sky-points">${points}${bridge}</g>`
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

async function calculateSky(event) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const moment = new Date(form.get('moment'))
  if (!Number.isFinite(moment.getTime())) return
  const status = document.querySelector('[data-sky-status]')
  status.textContent = 'Opening the ephemeris · 96 measured bodies'
  event.currentTarget.querySelector('button[type="submit"]').disabled = true
  try {
    const response = await fetch('/api/ephemeris', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ timestamp: moment.toISOString(), bodies: uniqueMeasuredBodies(glyphs) }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'The ephemeris could not be opened.')
    state.skyPlacements = placementsBySeat(result.placements, glyphs)
    state.skyTimestamp = result.timestamp
    state.skyMode = skyDrawer.dataset.kind || 'live'
    status.textContent = `${state.skyPlacements.size} seats measured · NASA/JPL Horizons`
    document.body.classList.add('has-sky')
    renderMandala()
    updateModeCopy()
  } catch (error) {
    status.textContent = error.message
  } finally {
    event.currentTarget.querySelector('button[type="submit"]').disabled = false
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
