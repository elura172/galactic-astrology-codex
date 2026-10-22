import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAJOR_CITIES,
  defaultTimezone,
  formatCityDisplay,
  isValidTimezone,
  searchCities,
  searchOfflineCities,
  supportedTimezones,
} from '../src/cities.js'

test('formats city display labels with city, admin, and country', () => {
  assert.equal(formatCityDisplay({ name: 'Toronto', admin1: 'Ontario', country: 'Canada' }), 'Toronto, Ontario, Canada')
  assert.equal(formatCityDisplay({ name: 'Paris', admin1: 'Île-de-France', country: 'France' }), 'Paris, Île-de-France, France')
  assert.equal(formatCityDisplay({ name: 'Singapore', admin1: '', country: 'Singapore' }), 'Singapore, Singapore')
})

test('searches offline cities with ranking and limits', () => {
  const torontoResults = searchOfflineCities('toronto')
  assert.ok(torontoResults.length >= 1)
  assert.equal(torontoResults[0].name, 'Toronto')
  assert.equal(torontoResults[0].timezone, 'America/Toronto')
  assert.equal(torontoResults[0].latitude, 43.7064)
  assert.equal(torontoResults[0].longitude, -79.3986)

  const empty = searchOfflineCities('t')
  assert.deepEqual(empty, [])

  const londonResults = searchOfflineCities('london')
  assert.ok(londonResults.some(city => city.name === 'London' && city.country === 'United Kingdom'))
})

test('validates IANA timezones accurately', () => {
  assert.ok(isValidTimezone('America/Toronto'))
  assert.ok(isValidTimezone('Europe/Paris'))
  assert.ok(isValidTimezone('Asia/Tokyo'))
  assert.ok(isValidTimezone('UTC'))
  assert.equal(isValidTimezone('Not/A_Real_Timezone'), false)
  assert.equal(isValidTimezone(''), false)
  assert.equal(isValidTimezone(null), false)
})

test('provides default and supported timezones', () => {
  const defaultTz = defaultTimezone()
  assert.equal(typeof defaultTz, 'string')
  assert.ok(defaultTz.length > 0)
  assert.ok(isValidTimezone(defaultTz))

  const allTzs = supportedTimezones()
  assert.ok(Array.isArray(allTzs))
  assert.ok(allTzs.length >= 20)
  assert.ok(allTzs.includes('America/Toronto') || allTzs.includes('UTC'))
})

test('searchCities handles offline fallback and remote merging', async () => {
  const fakeFetcher = async () => ({
    ok: true,
    json: async () => ({
      results: [
        {
          name: 'Kyoto',
          admin1: 'Kyoto',
          country: 'Japan',
          latitude: 35.0116,
          longitude: 135.7681,
          timezone: 'Asia/Tokyo',
        },
      ],
    }),
  })

  const results = await searchCities('kyoto', { fetcher: fakeFetcher, apiEndpoint: 'http://test/api/geocode' })
  assert.ok(results.length >= 1)
  assert.equal(results[0].name, 'Kyoto')
  assert.equal(results[0].timezone, 'Asia/Tokyo')
})
