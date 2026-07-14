import test from 'node:test'
import assert from 'node:assert/strict'
import { cacheKey, horizonsUrl, julianDate, mapConcurrent, parseHorizonsPlacement } from '../server/horizons.js'

test('converts ISO instants to Julian dates and constructs constrained queries', () => {
  assert.equal(julianDate('2000-01-01T12:00:00.000Z'), 2451545)
  const url = new URL(horizonsUrl('1;', '2000-01-01T12:00:00.000Z'))
  assert.equal(url.searchParams.get('COMMAND'), "'1;'")
  assert.equal(url.searchParams.get('CENTER'), "'500@399'")
  assert.equal(url.searchParams.get('QUANTITIES'), "'31'")
  assert.equal(new URL(horizonsUrl('10', '2000-01-01T12:00:00.000Z')).searchParams.get('COMMAND'), "'10'")
  assert.throws(() => horizonsUrl('Ceres', '2000-01-01T12:00:00.000Z'))
})

test('parses the official Horizons CSV observer-ecliptic row', () => {
  const payload = { result: 'header\n$$SOE\n 2000-Jan-01 12:00:00.000, , , 184.4530625, 11.8375968,\n$$EOE\nfooter' }
  assert.deepEqual(parseHorizonsPlacement(payload), { longitude: 184.4530625, latitude: 11.8375968 })
  assert.throws(() => parseHorizonsPlacement({ error: 'unknown target' }), /unknown target/)
})

test('cache keys distinguish body and instant without storing personal labels', () => {
  assert.equal(cacheKey('1;', '2000-01-01T12:00:00Z').length, 64)
  assert.notEqual(cacheKey('1;', '2000-01-01T12:00:00Z'), cacheKey('2;', '2000-01-01T12:00:00Z'))
})

test('bounded concurrency preserves input order', async () => {
  assert.deepEqual(await mapConcurrent([3, 1, 2], 2, async value => value * 2), [6, 2, 4])
})
