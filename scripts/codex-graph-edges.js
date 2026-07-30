/**
 * Emit the canon's computed geometry as a graphify extraction fragment.
 *
 * The manuscript states the wheel's structure generatively — the chord lattice, the
 * seams, the walk, and the face adjacencies are arithmetic on seat numbers, not
 * sentences. A prose extractor therefore sees only "the mandala holds twelve faces"
 * and makes the mandala a hub. This script runs the arithmetic and writes the edges
 * it produces, so the graph carries the lattice the instrument actually uses.
 *
 * Node IDs are resolved against the existing graph rather than re-derived, so every
 * edge attaches to a node that is already there instead of minting an orphan.
 *
 *   node scripts/codex-graph-edges.js > graphify-out/.graphify_lattice.json
 */
import { readFile } from 'node:fs/promises'
import { GROUPS, parseCodex, chordDestinations, seamCounterpart } from '../src/codex.js'
import { GATES } from '../src/gates.js'

const SOURCE = new URL('../codex_of_celestial_glyphs.md', import.meta.url)
const GRAPH = new URL('../graphify-out/graph.json', import.meta.url)
const CHORD_RELATION = { 1: 'chord_step', 2: 'chord_gift', 3: 'chord_vow', 4: 'chord_spiral', 5: 'chord_mirror' }

const glyphs = parseCodex(await readFile(SOURCE, 'utf8'))
const glyphByNumber = new Map(glyphs.map(glyph => [glyph.number, glyph]))
const graph = JSON.parse(await readFile(GRAPH, 'utf8'))

// Resolve names to the IDs already present in the graph. Labels read "Hekate - Asteroid (100)".
const canonNodes = graph.nodes.filter(node => node.id.startsWith('codex_of_celestial_glyphs_'))
// Fold diacritics: the manuscript writes Poësia, the extracted node label writes Poesia.
const fold = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const idByName = new Map(canonNodes.map(node => [fold(String(node.label).split(' - ')[0].trim()), node.id]))
const idByLabel = new Map(canonNodes.map(node => [String(node.label), node.id]))

const ringId = groupIndex => idByLabel.get({
  0: 'Ring I - The Memory Keepers', 1: 'Ring II - The Sound & Word Weavers',
  2: 'Ring III - The Sacred Devotionals', 3: 'Ring IV - The Chaos Catalysts',
  4: 'Ring V - The Beauty Makers', 5: 'Ring VI - The Teachers & Patterners',
  6: 'Ring VII - The Deathwalkers & Threshold Guides', 7: 'Ring VIII - The Innovators & Futurists',
  8: 'Ring IX - The Lovers & Relationals', 9: 'Ring X - The Incarnates & Earth Stewards',
  10: 'Nadir Face - The Deep Court', 11: 'Zenith Face - The Crown Court',
}[groupIndex])

const gateId = name => idByLabel.get(`${name} (Gate-Function)`)

const unresolved = new Set()
const seatId = glyph => {
  const id = idByName.get(fold(glyph.name))
  if (!id) unresolved.add(`${glyph.number} ${glyph.name}`)
  return id
}

const edges = []
const seen = new Set()
const add = (source, target, relation, confidence_score = 1.0) => {
  if (!source || !target || source === target) return
  const key = [relation, ...[source, target].sort()].join('|')
  if (seen.has(key)) return
  seen.add(key)
  edges.push({
    source, target, relation, confidence: 'EXTRACTED', confidence_score,
    source_file: SOURCE.pathname, source_location: null, weight: 1.0,
  })
}

// 1. The chord lattice — every band seat sworn to five others by decagonal offset.
glyphs.forEach(glyph => {
  const source = seatId(glyph)
  chordDestinations(glyph, glyphByNumber).forEach(({ chord, target }) => {
    if (target) add(source, seatId(target), CHORD_RELATION[chord.offset])
  })
})

// 2. The Nine Seams — one voice seated in two rings binds those rings.
glyphs.filter(glyph => glyph.seam).forEach(glyph => {
  const counterpart = seamCounterpart(glyph, glyphs)
  if (!counterpart) return
  add(ringId(glyph.groupIndex), ringId(counterpart.groupIndex), 'seam_binds')
  add(seatId(glyph), ringId(glyph.groupIndex), 'seated_in')
  add(seatId(glyph), ringId(counterpart.groupIndex), 'seated_in')
})

// 3. The Initiatory Walk — gate order 1..10 traverses the rings out of ring order.
GATES.forEach((gate, index) => {
  const next = GATES[index + 1]
  const from = ringId(GROUPS.findIndex(group => group.gate === gate.name))
  add(gateId(gate.name), from, 'gate_of_ring')
  if (next) add(from, ringId(GROUPS.findIndex(group => group.gate === next.name)), 'walk_succeeds')
})

// 4. Face adjacency — each band face borders the previous and next around the decagon.
for (let index = 0; index < 10; index += 1) add(ringId(index), ringId((index + 1) % 10), 'face_adjacent')

if (unresolved.size) process.stderr.write(`unresolved seats (${unresolved.size}): ${[...unresolved].join(', ')}\n`)
process.stderr.write(`emitted ${edges.length} edges across ${new Set(edges.map(edge => edge.relation)).size} relations\n`)
process.stdout.write(JSON.stringify({ nodes: [], edges, hyperedges: [], input_tokens: 0, output_tokens: 0 }, null, 2))
