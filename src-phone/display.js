// Presentation overlay for the phone build.
//
// `src/codex.js` holds the canonical GROUPS and CHORDS: the structure the
// analysis joins on (gate name, offset, lineage). The phone interface shows a
// longer, more formal set of ring names and spells the axial courts out. Those
// are display strings, not a second source of truth, so they are applied over
// the canonical rows rather than forked into a parallel table.
//
// Keyed by `gate` / `offset` — the stable identifiers — so a reordering in the
// canon cannot silently mis-assign a name. An unmatched row is a build error,
// not a quiet fallback.

const GROUP_DISPLAY = {
  'Vow Crown': { short: 'I', name: 'The Memory Keepers', course: 'lower' },
  'Signal Path': { short: 'II', name: 'The Sound & Word Weavers', course: 'upper' },
  'Dream Circuit': { short: 'III', name: 'The Sacred Devotionals', course: 'lower' },
  'Flame Gate': { short: 'IV', name: 'The Chaos Catalysts', course: 'lower' },
  'Mirror-Bond': { short: 'V', name: 'The Beauty Makers', course: 'upper' },
  'Codex Mirror': { short: 'VI', name: 'The Teachers & Patterners', course: 'upper' },
  'Threshold Warden': { short: 'VII', name: 'The Deathwalkers & Threshold Guides', course: 'lower' },
  'Bio-Architect': { short: 'VIII', name: 'The Innovators & Futurists', course: 'upper' },
  'Heart Beacon': { short: 'IX', name: 'The Lovers & Relationals', course: 'upper' },
  'Earth Grid': { short: 'X', name: 'The Incarnates & Earth Stewards', course: 'lower' },
  Nadir: { short: 'Nadir', name: 'The Veiled Ones — The Deep Court', course: 'axial' },
  Zenith: { short: 'Zenith', name: 'The Veiled Ones — The Crown Court', course: 'axial' },
}

export function applyPhoneDisplay(groups, chords) {
  groups.forEach(group => {
    const display = GROUP_DISPLAY[group.gate]
    if (!display) throw new RangeError(`No phone display row for gate "${group.gate}" — the canon and the overlay have drifted.`)
    Object.assign(group, display)
  })
  // The interface prints the chord angle with its degree sign; the canon already
  // stores it that way, so only the CSS class name needs to survive.
  chords.forEach(chord => {
    if (!chord.className) chord.className = chord.name.toLowerCase()
  })
  return { groups, chords }
}
