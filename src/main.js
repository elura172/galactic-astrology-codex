import './style.css'
import codexMarkdown from '../codex_of_celestial_glyphs.md?raw'

const GROUPS = [
  { short: 'I', name: 'Memory Keepers', lineage: 'Vega', gate: 'Vow Crown' },
  { short: 'II', name: 'Sound & Word Weavers', lineage: 'Lyra', gate: 'Signal Path' },
  { short: 'III', name: 'Sacred Devotionals', lineage: 'Arcturus', gate: 'Dream Circuit' },
  { short: 'IV', name: 'Chaos Catalysts', lineage: 'Orion', gate: 'Flame Gate' },
  { short: 'V', name: 'Beauty Makers', lineage: 'Aldebaran', gate: 'Mirror-Bond' },
  { short: 'VI', name: 'Teachers & Patterners', lineage: 'Sirius', gate: 'Codex Mirror' },
  { short: 'VII', name: 'Deathwalkers', lineage: 'Antares', gate: 'Threshold Warden' },
  { short: 'VIII', name: 'Innovators & Futurists', lineage: 'Andromeda', gate: 'Bio-Architect' },
  { short: 'IX', name: 'Lovers & Relationals', lineage: 'Alpha Centauri', gate: 'Heart Beacon' },
  { short: 'X', name: 'Earth Stewards', lineage: 'Pleiades', gate: 'Earth Grid' },
  { short: 'N', name: 'Deep Court', lineage: 'Galactic Core', gate: 'Nadir' },
  { short: 'Z', name: 'Crown Court', lineage: 'Polaris', gate: 'Zenith' },
]

const COLORS = [
  '#748c83', '#7893a3', '#9a7892', '#a45743', '#c29854',
  '#667d9b', '#705b73', '#73958d', '#a76c76', '#8e8b59',
  '#514761', '#b38f52',
]

const CHORDS = [
  { offset: 1, name: 'Step', angle: '36°', className: 'step' },
  { offset: 2, name: 'Gift', angle: '72°', className: 'gift' },
  { offset: 3, name: 'Vow', angle: '108°', className: 'vow' },
  { offset: 4, name: 'Spiral', angle: '144°', className: 'spiral' },
  { offset: 5, name: 'Mirror', angle: '180°', className: 'mirror' },
]

const clean = value => value
  ?.replace(/\*+/g, '')
  .replace(/\s+/g, ' ')
  .trim() || ''

function parseCodex(markdown) {
  const entries = []
  const pattern = /^\*\*(\d{2,3})\. ([^*]+)\*\* — ([^\n]+)\n([\s\S]*?)(?=^\*\*\d{2,3}\. |^## |^# |(?![\s\S]))/gm
  let match
  while ((match = pattern.exec(markdown))) {
    const body = match[4]
    const field = (name, next) => clean(body.match(new RegExp(`${name}:\\s*([\\s\\S]*?)(?=\\n${next}:)`))?.[1])
    entries.push({
      number: Number(match[1]),
      name: clean(match[2]),
      catalogue: clean(match[3]),
      function: field('Function', 'Craft Thread'),
      craft: field('Craft Thread', 'Mirror Phrase'),
      mirror: clean(body.match(/Mirror Phrase:\s*([^\n]+)/)?.[1]),
    })
  }

  const nameCounts = entries.reduce((counts, entry) => {
    counts.set(entry.name, (counts.get(entry.name) || 0) + 1)
    return counts
  }, new Map())

  return entries.map(entry => ({
    ...entry,
    groupIndex: Math.floor((entry.number - 1) / 9),
    seam: nameCounts.get(entry.name) > 1,
    invoked: ['Venus', 'Uranus', 'Mirai'].includes(entry.name),
  }))
}

const glyphs = parseCodex(codexMarkdown)
const glyphByNumber = new Map(glyphs.map(glyph => [glyph.number, glyph]))

if (glyphs.length !== 108) {
  throw new Error(`Codex parser expected 108 seats and found ${glyphs.length}.`)
}

const state = {
  mode: 'rings',
  selected: 1,
  chamber: false,
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
      <span>← → move between seats</span>
      <span data-footer-state>Ring register active</span>
    </footer>
  </main>
`

const instrument = document.querySelector('.instrument')
const threshold = document.querySelector('[data-threshold]')
const mandala = document.querySelector('[data-mandala]')
const detail = document.querySelector('[data-detail]')
const live = document.querySelector('[data-live]')
const results = document.querySelector('[data-results]')

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

function renderMandala() {
  const selected = glyphByNumber.get(state.selected)
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
    const mutedClass = state.mode === 'faces' && glyph.groupIndex !== selected.groupIndex ? ' is-muted' : ''
    return `<g class="seat${selectedClass}${mutedClass}" data-seat="${glyph.number}" tabindex="0" role="button" aria-label="Seat ${glyph.number}, ${escapeHtml(glyph.name)}">
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
    <g class="chord-layer">${chordLines(selected)}</g>
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
}

function renderDetail() {
  const glyph = glyphByNumber.get(state.selected)
  const group = GROUPS[glyph.groupIndex]
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
      <button class="chamber-key" data-detail-chamber>${state.chamber ? 'Return to instrument' : 'Enter this chamber'} <span>↗</span></button>
    </div>
  `
  detail.querySelector('[data-detail-chamber]').addEventListener('click', toggleChamber)
  live.textContent = `Seat ${glyph.number}. ${glyph.name}. ${glyph.function}`
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

function selectGlyph(number) {
  state.selected = ((number - 1 + glyphs.length) % glyphs.length) + 1
  renderMandala()
  renderDetail()
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
  document.body.classList.toggle('is-chamber', state.chamber)
  document.querySelector('[data-chamber]').setAttribute('aria-pressed', String(state.chamber))
  renderDetail()
}

document.querySelector('[data-enter]').addEventListener('click', () => {
  threshold.classList.add('is-departing')
  instrument.setAttribute('aria-hidden', 'false')
  setTimeout(() => document.body.classList.add('has-entered'), 280)
})

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)))
document.querySelector('[data-chamber]').addEventListener('click', toggleChamber)

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
  if (event.key === 'ArrowRight') selectGlyph(state.selected + 1)
  if (event.key === 'ArrowLeft') selectGlyph(state.selected - 1)
  if (['1', '2', '3'].includes(event.key)) setMode(['rings', 'faces', 'chords'][Number(event.key) - 1])
  if (event.key === 'Escape' && state.chamber) toggleChamber()
})

renderLegend()
updateModeCopy()
renderMandala()
renderDetail()
