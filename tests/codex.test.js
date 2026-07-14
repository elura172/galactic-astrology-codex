import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseCodex, seamCounterpart, chordDestinations, adjacentFaces, relatedGlyphNumbers } from '../src/codex.js'

const markdown = readFileSync(fileURLToPath(new URL('../codex_of_celestial_glyphs.md', import.meta.url)), 'utf8')
const glyphs = parseCodex(markdown)
const byNumber = new Map(glyphs.map(glyph => [glyph.number, glyph]))

test('parses the complete canonical seat register', () => {
  assert.equal(glyphs.length, 108)
  assert.deepEqual(glyphs.map(glyph => glyph.number), Array.from({ length: 108 }, (_, index) => index + 1))
  glyphs.forEach(glyph => {
    assert.ok(glyph.name)
    assert.ok(glyph.function)
    assert.ok(glyph.mirror)
  })
})

test('identifies canonical seams and invoked presences', () => {
  const seamGroups = Map.groupBy(glyphs.filter(glyph => glyph.seam), glyph => glyph.name)
  assert.equal(seamGroups.size, 9)
  seamGroups.forEach(pair => assert.equal(pair.length, 2))
  assert.deepEqual(seamGroups.get('Mnemosyne').map(glyph => glyph.number), [1, 54])
  assert.deepEqual(seamGroups.get('Vesta').map(glyph => glyph.number), [25, 84])
  assert.deepEqual(seamGroups.get('Tesla').map(glyph => glyph.number), [13, 68])
  assert.equal(glyphs.filter(glyph => glyph.invoked).length, 3)
})

test('derives seam counterparts in both directions', () => {
  assert.equal(seamCounterpart(byNumber.get(1), glyphs).number, 54)
  assert.equal(seamCounterpart(byNumber.get(54), glyphs).number, 1)
  assert.equal(seamCounterpart(byNumber.get(3), glyphs), null)
})

test('derives five chord destinations for band seats only', () => {
  assert.deepEqual(chordDestinations(byNumber.get(1), byNumber).map(item => item.target.number), [10, 19, 28, 37, 46])
  assert.deepEqual(chordDestinations(byNumber.get(82), byNumber).map(item => item.target.number), [1, 10, 19, 28, 37])
  assert.deepEqual(chordDestinations(byNumber.get(91), byNumber), [])
  glyphs.slice(0, 90).forEach(glyph => {
    assert.equal(chordDestinations(glyph, byNumber).filter(item => item.target).length, 5)
  })
})

test('derives adjacent faces and the two court courses', () => {
  assert.deepEqual(adjacentFaces(byNumber.get(1)).map(face => face.number), [82, 10])
  assert.deepEqual(adjacentFaces(byNumber.get(82)).map(face => face.number), [73, 1])
  assert.deepEqual(adjacentFaces(byNumber.get(91)).map(face => face.groupIndex), [0, 2, 3, 6, 9])
  assert.deepEqual(adjacentFaces(byNumber.get(100)).map(face => face.groupIndex), [1, 4, 5, 7, 8])
})

test('builds an ordered, unique related-glyph ring', () => {
  const related = relatedGlyphNumbers(byNumber.get(1), glyphs)
  assert.equal(related[0], 54)
  assert.equal(new Set(related).size, related.length)
  assert.ok(!related.includes(1))
  assert.deepEqual(relatedGlyphNumbers(byNumber.get(91), glyphs), [1, 19, 28, 55, 82])
})
