// --- Real planetary positions: JPL approximate Keplerian elements (1800-2050), geocentric ecliptic of date ---
const PLANET_ELEMENTS = [
  ['Mercury', 0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.25032350, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081],
  ['Venus', 0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
  ['Earth', 1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0],
  ['Mars', 1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
  ['Jupiter', 5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
  ['Saturn', 9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794],
  ['Uranus', 19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.95427630, 0.40805281, 74.01692503, 0.04240589],
  ['Neptune', 30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664],
  ['Pluto', 39.48211675, -0.00031596, 0.24882730, 0.00005170, 17.14001206, 0.00004818, 238.92903833, 145.20780515, 224.06891629, -0.04062942, 110.30393684, -0.01183482],
]
// Repo `julianDate` (src/chart.js) is canonical and takes a Date; these
// callers hold ISO strings, so convert at the boundary rather than shadowing it.
function julianDayFromIso(iso) {
  const instant = new Date(iso)
  if (!Number.isFinite(instant.getTime())) throw new TypeError('Invalid instant')
  return julianDate(instant)
}
function helioXYZ(el, T) {
  const D = Math.PI / 180
  const a = el[1] + el[2] * T, e = el[3] + el[4] * T, I = (el[5] + el[6] * T) * D
  const L = el[7] + el[8] * T, w = el[9] + el[10] * T, O = (el[11] + el[12] * T) * D
  const om = (w - el[11] - el[12] * T) * D
  let M = ((L - w) % 360) * D
  let E = M + e * Math.sin(M)
  for (let i = 0; i < 8; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E)
  const cw = Math.cos(om), sw = Math.sin(om), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I)
  return [
    (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    (sw * sI) * xp + (cw * sI) * yp,
  ]
}
// Heliocentric by default: `helioXYZ` already returns Sun-centred vectors, so a
// heliocentric longitude is simply that vector's angle — the geocentric one was
// the same vector with Earth's subtracted.
//
// The two frames hold different bodies, not the same bodies at different
// angles. From the Sun there is no Sun to plot: it is the origin. The Moon has
// no heliocentric longitude distinct from Earth's, being always within 0.0026 AU
// of it. And Earth, which the geocentric frame necessarily omits, is not drawn
// in this tradition either — the chart is read from the Sun looking out, and
// Earth is where the reader stands, not a body in the field.
export function planetLongitudes(iso, frame = 'heliocentric') {
  const T = (julianDayFromIso(iso) - 2451545) / 36525
  const earth = helioXYZ(PLANET_ELEMENTS[2], T)
  const prec = 1.39775 * T // equinox J2000 → of date
  const lon = v => (((Math.atan2(v[1], v[0]) * 180 / Math.PI) + prec) % 360 + 360) % 360
  const geocentric = frame === 'geocentric'
  const out = geocentric ? [{ name: 'Sun', longitude: lon([-earth[0], -earth[1], -earth[2]]) }] : []
  PLANET_ELEMENTS.forEach(el => {
    if (el[0] === 'Earth') return
    const p = helioXYZ(el, T)
    out.push({
      name: el[0],
      longitude: geocentric
        ? lon([p[0] - earth[0], p[1] - earth[1], p[2] - earth[2]])
        : lon(p),
    })
  })
  return out
}

// Moon — truncated ELP-style series (Meeus ch. 47, principal terms); ~0.1° accuracy
export function moonLongitude(iso) {
  const T = (julianDayFromIso(iso) - 2451545) / 36525
  const D2R = Math.PI / 180
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T
  const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T * T) * D2R
  const M = (357.5291092 + 35999.0502909 * T - 0.0001536 * T * T) * D2R
  const Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T * T) * D2R
  const F = (93.2720950 + 483202.0175233 * T - 0.0036539 * T * T) * D2R
  const E = 1 - 0.002516 * T
  const lon = Lp
    + 6.288774 * Math.sin(Mp)
    + 1.274027 * Math.sin(2 * D - Mp)
    + 0.658314 * Math.sin(2 * D)
    + 0.213618 * Math.sin(2 * Mp)
    - 0.185116 * E * Math.sin(M)
    - 0.114332 * Math.sin(2 * F)
    + 0.058793 * Math.sin(2 * D - 2 * Mp)
    + 0.057066 * E * Math.sin(2 * D - M - Mp)
    + 0.053322 * Math.sin(2 * D + Mp)
    + 0.045758 * E * Math.sin(2 * D - M)
    - 0.040923 * E * Math.sin(M - Mp)
    - 0.034720 * Math.sin(D)
    - 0.030383 * E * Math.sin(M + Mp)
    + 0.015327 * Math.sin(2 * D - 2 * F)
    - 0.012528 * Math.sin(Mp + 2 * F)
    + 0.010980 * Math.sin(Mp - 2 * F)
  return ((lon % 360) + 360) % 360
}
