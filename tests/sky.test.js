import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchEphemerisInBatches, placementsBySeat, technicalRecord, uniqueMeasuredBodies, zodiacLabel } from '../src/sky.js'

const glyphs = [
  { number: 1, name: 'First face', catalogueId: { horizonsCommand: '57;' } },
  { number: 2, name: 'Seam face', catalogueId: { horizonsCommand: '57;' } },
  { number: 3, name: 'Invoked', catalogueId: null },
]

test('deduplicates ephemeris work while restoring every canonical seat', () => {
  assert.deepEqual(uniqueMeasuredBodies(glyphs), [{ command: '57;', name: 'First face' }])
  const placements = placementsBySeat([{ command: '57;', longitude: 359.5 }], glyphs)
  assert.equal(placements.size, 2)
  assert.equal(placements.get(1).name, 'First face')
  assert.equal(placements.get(2).name, 'Seam face')
})

test('formats measured longitude as degree within zodiac sign', () => {
  assert.equal(zodiacLabel(0), '0.00° Aries')
  assert.equal(zodiacLabel(359.5), '29.50° Pisces')
  assert.equal(zodiacLabel(-1), '29.00° Pisces')
})

test('fetches ephemeris batches in order and reports cumulative progress', async () => {
  const calls = []
  const progress = []
  const fetcher = async (_url, options) => {
    const request = JSON.parse(options.body)
    calls.push(request.bodies.map(body => body.command))
    return { ok: true, json: async () => ({ placements: request.bodies.map(body => ({ ...body, longitude: 1 })) }) }
  }
  const result = await fetchEphemerisInBatches({
    timestamp: '2000-01-01T12:00:00.000Z', bodies: [{ command: '1;' }, { command: '2;' }, { command: '3;' }],
    batchSize: 2, fetcher, onProgress: state => progress.push([state.completed, state.total]),
  })
  assert.deepEqual(calls, [['1;', '2;'], ['3;']])
  assert.deepEqual(progress, [[2, 3], [3, 3]])
  assert.equal(result.placements.length, 3)
})

test('honors cancellation before requesting another batch', async () => {
  const controller = new AbortController()
  const fetcher = async (_url, options) => {
    controller.abort()
    const request = JSON.parse(options.body)
    return { ok: true, json: async () => ({ placements: request.bodies }) }
  }
  await assert.rejects(fetchEphemerisInBatches({
    timestamp: '2000-01-01T12:00:00.000Z', bodies: [{ command: '1;' }, { command: '2;' }],
    batchSize: 1, signal: controller.signal, fetcher,
  }), error => error.name === 'AbortError')
})

test('builds an explicit technical record without birthplace or reader identity', () => {
  const record = technicalRecord({
    timestamp: '2000-01-01T12:00:00Z', mode: 'birth',
    placements: new Map([[1, { command: '1;', seat: 1, name: 'Ceres', longitude: 1, latitude: 2 }]]),
    planets: [], angles: null, houses: null, angleConfidence: null,
  })
  assert.equal(record.schema, 'celestial-glyphs/technical-record/v1')
  assert.equal(record.glyphPlacements.length, 1)
  assert.ok(!JSON.stringify(record).includes('birthplace'))
  assert.ok(!JSON.stringify(record).includes('reader'))
})
