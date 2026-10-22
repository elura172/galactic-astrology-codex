// --- Generative sigils: each seat's mark derived from its canonical geometry ---
export function sigilDataUri(glyph, opts = {}) {
  const ink = opts.ink || 'rgba(10,14,21,0.78)'
  const gold = opts.gold || '#B98438'
  const within = (glyph.number - 1) % 9
  const gi = glyph.groupIndex
  const P = a => {
    const r = a * Math.PI / 180
    return [50 + 40 * Math.cos(r), 50 + 40 * Math.sin(r)]
  }
  const arcAt = (r, a0, a1, w = 0.7, op = 0.55, stroke = ink) => {
    const p = a => [50 + r * Math.cos(a * Math.PI / 180), 50 + r * Math.sin(a * Math.PI / 180)]
    const [x0, y0] = p(a0), [x1, y1] = p(a1)
    const large = ((a1 - a0) % 360 + 360) % 360 > 180 ? 1 : 0
    return `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${w}" opacity="${op}"/>`
  }
  let s = ''
  const gateA = (gi <= 9 ? gi * 36 : (gi === 10 ? 90 : -90)) - (gi <= 9 ? 90 : 0)
  // the frame dissolved: the inner ring stays, broken open toward the gate
  const innerR = 12 + within * 2.2
  s += arcAt(innerR, gateA + 24, gateA + 336, 0.7, 0.5)
  // the seam voice: a second broken ring, opened opposite
  if (glyph.seam) s += arcAt(innerR + 4.5, gateA + 204, gateA + 156 + 360, 0.7, 0.4)
  if (gi <= 9) {
    const a0 = gi * 36 - 90
    const [hx, hy] = P(a0)
    for (let k = 1; k <= 5; k++) {
      const [tx, ty] = P(a0 + k * 36)
      const vow = k === 3
      s += `<line x1="${hx.toFixed(2)}" y1="${hy.toFixed(2)}" x2="${tx.toFixed(2)}" y2="${ty.toFixed(2)}" stroke="${vow ? gold : ink}" stroke-width="${vow ? 1.1 : 0.7}" opacity="${vow ? 0.9 : 0.45}"/>`
    }
    s += `<circle cx="${hx.toFixed(2)}" cy="${hy.toFixed(2)}" r="2.6" fill="${gold}"/>`
  } else {
    s += `<line x1="50" y1="10" x2="50" y2="90" stroke="${ink}" stroke-width="0.9" opacity="0.6"/>`
    const y = gi === 10 ? 90 : 10
    s += `<circle cx="50" cy="${y}" r="2.6" fill="${gold}"/>`
  }
  if (glyph.invoked) s += `<circle cx="50" cy="50" r="2" fill="${gold}"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${s}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27')
}

// Lineage sigils: dodecagonal marks — one vertex per lineage, braid position encoded
// Central motif per lineage — one shared field-glyph grammar (broken concentric
// rings, nodes, threads), varied per lineage theme
function lineageMotif(name, ink, gold) {
  const arc = (cx, cy, r, a0, a1, stroke, w = 0.8, op = 1) => {
    const p = a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)]
    const [x0, y0] = p(a0), [x1, y1] = p(a1)
    const large = ((a1 - a0) % 360 + 360) % 360 > 180 ? 1 : 0
    return `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${w}" opacity="${op}"/>`
  }
  const node = (x, y, r, fill) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}"/>`
  const at = (r, a) => [50 + r * Math.cos(a * Math.PI / 180), 50 + r * Math.sin(a * Math.PI / 180)]
  const m = {
    // Vega — Memory Keepers: rings broken where memory slips; one gold moment kept, threaded to centre
    'Vega': (() => {
      let s = [[6, -60, 205], [10, 40, 275], [14, -140, 75], [18, 115, 330]]
        .map(([r, a0, a1]) => arc(50, 50, r, a0, a1, ink, 0.8, 0.95 - r * 0.02)).join('')
      const [kx, ky] = at(14, 75)
      return s + `<line x1="50" y1="50" x2="${kx.toFixed(1)}" y2="${ky.toFixed(1)}" stroke="${gold}" stroke-width="0.7" opacity="0.7"/>` + node(kx, ky, 1.7, gold) + node(50, 50, 1, ink)
    })(),
    // Lyra — Sound & Word Weavers: every ring opens eastward, wider as it travels — a broadcast leaving the field
    'Lyra': (() => {
      const s = [[6, 18], [10, 26], [14, 34], [18, 42]]
        .map(([r, g]) => arc(50, 50, r, g, 360 - g, ink, 0.8, 1.02 - r * 0.02)).join('')
      const [tx, ty] = at(22, 0)
      return s + node(50, 50, 1.2, ink) + node(tx, ty, 1.7, gold)
    })(),
    // Arcturus — Sacred Devotionals: rings parted at the crown; a gold thread rises through the opening
    'Arcturus': (() => {
      const s = [[7, 22], [12, 16], [17, 11]]
        .map(([r, g]) => arc(50, 50, r, -90 + g, 270 - g, ink, 0.8, 1.04 - r * 0.02)).join('')
      return s + `<line x1="50" y1="52" x2="50" y2="30" stroke="${gold}" stroke-width="0.8"/>` + node(50, 29, 1.6, gold) + node(50, 54, 1, ink)
    })(),
    // Orion — Chaos Catalysts: two ring-fields interfering; gold spark where they cross
    'Orion': (() => {
      let s = [[5, 60, 350], [9, 130, 55]].map(([r, a0, a1]) => arc(43.5, 50, r, a0, a1, ink, 0.8)).join('')
      s += [[5, 240, 170], [9, -50, 235]].map(([r, a0, a1]) => arc(56.5, 50, r, a0, a1, ink, 0.8)).join('')
      return s + node(50, 50, 1.6, gold)
    })(),
    // Aldebaran — Beauty Makers: arcs unfurling by the golden ratio — a spiral told in rings
    'Aldebaran': (() => {
      let s = '', r = 4, a0 = -90
      for (let i = 0; i < 4; i++) { s += arc(50, 50, r, a0, a0 + 205 - i * 18, ink, 0.8, 1 - i * 0.08); a0 += 137.5; r *= 1.618 }
      const [gx2, gy2] = at(4, -90)
      return s + node(gx2, gy2, 1.5, gold)
    })(),
    // Sirius — Teachers & Patterners: gaps in strict cadence — a calibrated field
    'Sirius': (() => {
      let s = ''
      ;[7, 12, 17].forEach((r, i) => { for (let k = 0; k < 4; k++) s += arc(50, 50, r, k * 90 + 8 + i * 30, (k + 1) * 90 - 8 + i * 30, ink, 0.8, 1 - i * 0.1) })
      const [sx, sy] = at(17, 30 * 2 - 90)
      return s + node(50, 50, 1.1, ink) + node(sx, sy, 1.6, gold)
    })(),
    // Antares — Deathwalkers: every ring opens on the same downward corridor — the passage through
    'Antares': (() => {
      const s = [[6, 14], [10, 11], [14, 9], [18, 7]]
        .map(([r, g]) => arc(50, 50, r, 90 + g, 90 - g + 360, ink, 0.8, 1.04 - r * 0.018)).join('')
      const [ox, oy] = at(21, 90)
      return s + node(ox, oy, 1.6, gold)
    })(),
    // Andromeda — Innovators & Futurists: each ring's opening advances — the field mid-turn
    'Andromeda': (() => {
      const s = [[6, 0], [10, 50], [14, 100], [18, 150]]
        .map(([r, lead]) => arc(50, 50, r, -90 + lead + 30, -90 + lead + 360 - 30, ink, 0.8, 1.04 - r * 0.018)).join('')
      const [lx, ly] = at(18, -90 + 150)
      return s + node(lx, ly, 1.6, gold)
    })(),
    // Alpha Centauri — Lovers & Relationals: two ring-fields, each broken toward the other; gold at the shared point
    'Alpha Centauri': (() => {
      let s = [[4.5, 40], [8, 55]].map(([r, g]) => arc(44, 50, r, g, 360 - g, ink, 0.8)).join('')
      s += [[4.5, 40], [8, 55]].map(([r, g]) => arc(56, 50, r, 180 + g, 180 - g + 360, ink, 0.8)).join('')
      return s + node(50, 50, 1.6, gold)
    })(),
    // Pleiades — Incarnates & Earth Stewards: seven seeds held inside one parted ring
    'Pleiades': (() => {
      let s = arc(50, 50, 17, -78, 258, ink, 0.8)
      ;[[50, 50], [50, 43], [56, 46.5], [56, 53.5], [50, 57], [44, 53.5], [44, 46.5]].forEach(([x, y], i) => { s += node(x, y, 1.4, i === 0 ? gold : ink) })
      return s
    })(),
    // Galactic Core — the Deep Court: the field nearly closed; one gold veil arc
    'Galactic Core': (() => {
      let s = node(50, 50, 6.5, ink).replace('/>', ` opacity="0.85"/>`)
      s += [[11, 100, 80], [16, 275, 262]].map(([r, a0, a1]) => arc(50, 50, r, a0, a1 + 360, ink, 0.8, 0.8)).join('')
      return s + arc(50, 50, 11, 115, 155, gold, 0.9)
    })(),
    // Polaris — the Crown Court: the one unbroken ring; the field that holds
    'Polaris': (() => {
      let s = arc(50, 50, 13, 0, 359.99, ink, 0.9)
      ;[0, 90, 180, 270].forEach(a => { const [x0, y0] = at(15, a - 90), [x1, y1] = at(18.5, a - 90); s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${ink}" stroke-width="0.8"/>` })
      return s + node(50, 50, 1.8, gold)
    })(),
  }
  const key = Object.keys(m).find(k => name && name.toLowerCase().includes(k.toLowerCase()))
  return key ? m[key] : ''
}

export function lineageSigilDataUri(index, opts = {}) {
  const ink = opts.ink || 'rgba(10,14,21,0.78)'
  const gold = opts.gold || '#B98438'
  // the field-glyph alone — the old dodecagon frame is dissolved
  const s = `<g transform="translate(50 50) scale(1.85) translate(-50 -50)">${lineageMotif(opts.name, ink, gold)}</g>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${s}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27')
}

// The Wheel of 108 — full chart-wheel background (structure only; tap dots are DOM)
export function wheelDataUri(opts = {}) {
  const ink = opts.ink || 'rgba(10,14,21,0.55)'
  const gold = opts.gold || '#B98438'
  const P = (a, r) => {
    const rad = a * Math.PI / 180
    return [50 + r * Math.cos(rad), 50 + r * Math.sin(rad)]
  }
  let s = `<circle cx="50" cy="50" r="46" fill="none" stroke="${ink}" stroke-width="0.5"/>`
  s += `<circle cx="50" cy="50" r="37" fill="none" stroke="${ink}" stroke-width="0.3" opacity="0.5"/>`
  s += `<circle cx="50" cy="50" r="17" fill="none" stroke="${ink}" stroke-width="0.3" opacity="0.5"/>`
  for (let k = 0; k < 10; k++) {
    const a = k * 36 - 90
    const [gx, gy] = P(a, 46)
    const [ix, iy] = P(a, 17)
    s += `<line x1="${ix.toFixed(2)}" y1="${iy.toFixed(2)}" x2="${gx.toFixed(2)}" y2="${gy.toFixed(2)}" stroke="${ink}" stroke-width="0.3" opacity="0.35"/>`
    s += `<circle cx="${gx.toFixed(2)}" cy="${gy.toFixed(2)}" r="1" fill="${gold}"/>`
  }
  s += `<line x1="50" y1="33" x2="50" y2="67" stroke="${ink}" stroke-width="0.3" opacity="0.5"/>`
  s += `<circle cx="50" cy="50" r="0.8" fill="${gold}"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${s}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27')
}

// Seat position on the Wheel of 108, in percent of the square
export function wheelSeatPosition(glyph) {
  const gi = glyph.groupIndex
  const within = (glyph.number - 1) % 9
  let angle, r
  if (gi <= 9) {
    angle = gi * 36 - 90 - 12.8 + within * 3.2
    r = 41.5
  } else {
    const base = gi === 11 ? -90 : 90 // zenith top, nadir bottom
    angle = base - 12.8 + within * 3.2
    r = 24.5
  }
  const rad = angle * Math.PI / 180
  return { left: 50 + r * Math.cos(rad), top: 50 + r * Math.sin(rad) }
}

// Dodecahedron face: pentagon of observatory glass carrying a ring of nine seats
export function dodecaFaceDataUri(seats, opts = {}) {
  const ink = 'rgba(10,14,21,0.55)'
  const gold = '#B98438'
  const off = opts.pointDown ? 36 : 0 // point-down faces share their flat top edge with the face above
  const P = (a, r) => [55 + r * Math.cos((a + off - 90) * Math.PI / 180), 55 + r * Math.sin((a + off - 90) * Math.PI / 180)]
  const pts = [0, 72, 144, 216, 288].map(a => P(a, 46).map(v => v.toFixed(2)).join(',')).join(' ')
  let s = `<polygon points="${pts}" fill="rgba(241,232,214,0.8)" stroke="${ink}" stroke-width="0.9"/>`
  const [gx, gy] = P(0, 46)
  s += `<circle cx="${gx.toFixed(2)}" cy="${gy.toFixed(2)}" r="2.2" fill="${gold}"/>`
  seats.forEach((seat, i) => {
    const [x, y] = P(i * 40, 25)
    s += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.7" fill="${seat.seam ? gold : ink}"/>`
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110">${s}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27')
}

// The twelve face placements of the dodecahedral mandala (CSS 3D transforms).
// Zenith crowns the top, Nadir grounds the bottom; upper-course rings form the
// upper band, lower-course rings the lower — the canon's own arrangement.
export function dodecaFaces(groups, edge = 54) {
  const r = 1.113516 * edge // inradius
  const tilt = 26.565 // 90 - half dihedral
  const upper = [], lower = []
  groups.forEach((g, i) => {
    if (g.course === 'upper') upper.push(i)
    else if (g.course === 'lower') lower.push(i)
  })
  const faces = []
  faces.push({ index: 11, transform: `rotateX(90deg) translateZ(${r.toFixed(1)}px)`, pointDown: false })
  faces.push({ index: 10, transform: `rotateX(-90deg) translateZ(${r.toFixed(1)}px)`, pointDown: true })
  upper.forEach((gi, k) => faces.push({ index: gi, transform: `rotateY(${k * 72}deg) rotateX(${tilt}deg) translateZ(${r.toFixed(1)}px)`, pointDown: true }))
  lower.forEach((gi, k) => faces.push({ index: gi, transform: `rotateY(${k * 72 + 36}deg) rotateX(${-tilt}deg) translateZ(${r.toFixed(1)}px)`, pointDown: false }))
  return faces
}

// Chord sigils — each of the five angles drawn as its own field-glyph,
// angle-true where the geometry carries meaning
export function chordSigilDataUri(offset, opts = {}) {
  const ink = opts.ink || 'rgba(10,14,21,0.78)'
  const gold = opts.gold || '#B98438'
  const at = (r, a) => [50 + r * Math.cos((a - 90) * Math.PI / 180), 50 + r * Math.sin((a - 90) * Math.PI / 180)]
  const arc = (r, a0, a1, stroke, w = 0.8, op = 1) => {
    const [x0, y0] = at(r, a0), [x1, y1] = at(r, a1)
    const large = ((a1 - a0) % 360 + 360) % 360 > 180 ? 1 : 0
    return `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${w}" opacity="${op}"/>`
  }
  const node = (x, y, r, fill) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}"/>`
  const line = (x0, y0, x1, y1, stroke, w = 0.8, op = 1) => `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${stroke}" stroke-width="${w}" opacity="${op}"/>`
  let s = ''
  if (offset === 1) {
    // The Step 36° — succession: an inner ring opens exactly where an outer ring begins;
    // one prepares, the other receives. The handing point is gold.
    s += arc(20, 18, 306, ink, 1, 0.9)
    s += arc(32, 342, 234 + 360 - 90, ink, 1, 0.55)
    const [hx, hy] = at(26, -18)
    s += line(...at(20, -54), ...at(32, -18), ink, 0.9, 0.5)
    s += node(hx, hy, 2.4, gold)
    s += node(...at(20, 126), 1.8, ink)
  } else if (offset === 2) {
    // The Gift 72° — the pentagon's step: five seats implied, two of them singing
    // together without effort; their chord in gold, the other three left faint
    for (let k = 0; k < 5; k++) {
      const a = k * 72
      s += arc(36, a + 12, a + 60, ink, 1, k < 2 ? 0.9 : 0.35)
    }
    const [ax, ay] = at(36, 0), [bx, by] = at(36, 72)
    s += line(ax, ay, bx, by, gold, 1.2, 0.9)
    s += node(ax, ay, 2, ink)
    s += node(bx, by, 2.4, gold)
  } else if (offset === 3) {
    // The Vow 108° — the pentagon's corner held open: two arms meeting at a
    // true 108°, the oath a gold thread joining their far ends
    const [vx, vy] = [50, 68]
    const a1 = -90 - 54, a2 = -90 + 54 // 108° between arms, opening upward
    const [e1x, e1y] = [vx + 40 * Math.cos(a1 * Math.PI / 180), vy + 40 * Math.sin(a1 * Math.PI / 180)]
    const [e2x, e2y] = [vx + 40 * Math.cos(a2 * Math.PI / 180), vy + 40 * Math.sin(a2 * Math.PI / 180)]
    s += line(vx, vy, e1x, e1y, ink, 1.1)
    s += line(vx, vy, e2x, e2y, ink, 1.1)
    // witness arc inside the corner, centred on the vertex
    const wr = 12
    const [w1x, w1y] = [vx + wr * Math.cos(a1 * Math.PI / 180), vy + wr * Math.sin(a1 * Math.PI / 180)]
    const [w2x, w2y] = [vx + wr * Math.cos(a2 * Math.PI / 180), vy + wr * Math.sin(a2 * Math.PI / 180)]
    s += `<path d="M ${w1x.toFixed(1)} ${w1y.toFixed(1)} A ${wr} ${wr} 0 0 1 ${w2x.toFixed(1)} ${w2y.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="0.8" opacity="0.4"/>`
    s += line(e1x, e1y, e2x, e2y, gold, 1.1, 0.85)
    s += node(vx, vy, 1.8, ink)
    s += node(e1x, e1y, 1.8, ink)
    s += node(e2x, e2y, 2.4, gold)
  } else if (offset === 4) {
    // The Spiral 144° — long-arc weaving: arcs advancing by 144° each turn,
    // widening as the pattern completes across spans no life will see
    let a = -90, r = 10
    for (let i = 0; i < 4; i++) {
      s += arc(r, a, a + 144, ink, 1, 0.95 - i * 0.18)
      a += 144; r += 8
    }
    s += node(...at(10, -90), 1.8, ink)
    s += node(...at(34, -90 + 144 * 4), 2.4, gold)
  } else {
    // The Mirror 180° — two half-rings facing each other across the centre;
    // the diameter in gold passes through what refuses to be skipped
    s += arc(34, 100, 260, ink, 1.05, 0.9)
    s += arc(34, 280, 80 + 360, ink, 1.05, 0.9)
    const [ax, ay] = at(34, -90), [bx, by] = at(34, 90)
    s += line(ax, ay, bx, by, gold, 1.2, 0.9)
    s += node(50, 50, 2.2, gold)
    s += node(ax, ay, 1.8, ink)
    s += node(bx, by, 1.8, ink)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${s}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27')
}

// The chord lattice drawn flat: computed chords as gold lines across the ecliptic wheel.
// Canonical chart orientation — 0° at the left, longitudes increasing counterclockwise.
export function latticeDataUri(chords, points, opts = {}) {
  const ink = opts.ink || 'rgba(10,14,21,0.6)'
  const gold = opts.gold || '#B98438'
  const at = (lon, r) => {
    const th = (180 - lon) * Math.PI / 180
    return [50 + r * Math.cos(th), 50 - r * Math.sin(th)]
  }
  let s = `<circle cx="50" cy="50" r="46" fill="none" stroke="${ink}" stroke-width="0.5"/>`
  for (let k = 0; k < 12; k++) {
    const [x0, y0] = at(k * 30, 46), [x1, y1] = at(k * 30, 43.5)
    s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${ink}" stroke-width="0.4" opacity="0.6"/>`
  }
  const tierOp = { lattice: 0.9, working: 0.6, whisper: 0.3 }
  const lonOf = new Map(points.map(p => [p.name, p.longitude]))
  chords.forEach(ch => {
    const la = lonOf.get(ch.first), lb = lonOf.get(ch.second)
    if (la == null || lb == null) return
    const [ax, ay] = at(la, 42), [bx, by] = at(lb, 42)
    s += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${gold}" stroke-width="0.8" opacity="${tierOp[ch.tier] ?? 0.4}"/>`
  })
  const used = new Set(chords.flatMap(ch => [ch.first, ch.second]))
  points.forEach(p => {
    if (!used.has(p.name)) return
    const [x, y] = at(p.longitude, 42)
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.planet ? 1.9 : 1.3}" fill="${p.planet ? gold : ink}"/>`
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${s}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27')
}

