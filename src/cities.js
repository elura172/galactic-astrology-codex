// Curated offline baseline of major global cultural and population centers
// Ensures instant responsiveness and offline resilience for common birth locations.
export const MAJOR_CITIES = [
  // Canada
  { name: 'Toronto', admin1: 'Ontario', country: 'Canada', latitude: 43.7064, longitude: -79.3986, timezone: 'America/Toronto' },
  { name: 'Montreal', admin1: 'Quebec', country: 'Canada', latitude: 45.5017, longitude: -73.5673, timezone: 'America/Toronto' },
  { name: 'Vancouver', admin1: 'British Columbia', country: 'Canada', latitude: 49.2827, longitude: -123.1207, timezone: 'America/Vancouver' },
  { name: 'Calgary', admin1: 'Alberta', country: 'Canada', latitude: 51.0447, longitude: -114.0719, timezone: 'America/Edmonton' },
  { name: 'Ottawa', admin1: 'Ontario', country: 'Canada', latitude: 45.4215, longitude: -75.6972, timezone: 'America/Toronto' },
  { name: 'Edmonton', admin1: 'Alberta', country: 'Canada', latitude: 53.5461, longitude: -113.4938, timezone: 'America/Edmonton' },
  { name: 'Quebec City', admin1: 'Quebec', country: 'Canada', latitude: 46.8139, longitude: -71.2080, timezone: 'America/Toronto' },
  { name: 'Winnipeg', admin1: 'Manitoba', country: 'Canada', latitude: 49.8951, longitude: -97.1384, timezone: 'America/Winnipeg' },
  { name: 'Halifax', admin1: 'Nova Scotia', country: 'Canada', latitude: 44.6488, longitude: -63.5752, timezone: 'America/Halifax' },
  { name: 'Victoria', admin1: 'British Columbia', country: 'Canada', latitude: 48.4284, longitude: -123.3656, timezone: 'America/Vancouver' },

  // United States
  { name: 'New York', admin1: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { name: 'Los Angeles', admin1: 'California', country: 'United States', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
  { name: 'Chicago', admin1: 'Illinois', country: 'United States', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago' },
  { name: 'Houston', admin1: 'Texas', country: 'United States', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago' },
  { name: 'Phoenix', admin1: 'Arizona', country: 'United States', latitude: 33.4484, longitude: -112.0740, timezone: 'America/Phoenix' },
  { name: 'Philadelphia', admin1: 'Pennsylvania', country: 'United States', latitude: 39.9526, longitude: -75.1652, timezone: 'America/New_York' },
  { name: 'San Antonio', admin1: 'Texas', country: 'United States', latitude: 29.4241, longitude: -98.4936, timezone: 'America/Chicago' },
  { name: 'San Diego', admin1: 'California', country: 'United States', latitude: 32.7157, longitude: -117.1611, timezone: 'America/Los_Angeles' },
  { name: 'Dallas', admin1: 'Texas', country: 'United States', latitude: 32.7767, longitude: -96.7970, timezone: 'America/Chicago' },
  { name: 'Austin', admin1: 'Texas', country: 'United States', latitude: 30.2672, longitude: -97.7431, timezone: 'America/Chicago' },
  { name: 'San Francisco', admin1: 'California', country: 'United States', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' },
  { name: 'Seattle', admin1: 'Washington', country: 'United States', latitude: 47.6062, longitude: -122.3321, timezone: 'America/Los_Angeles' },
  { name: 'Denver', admin1: 'Colorado', country: 'United States', latitude: 39.7392, longitude: -104.9903, timezone: 'America/Denver' },
  { name: 'Boston', admin1: 'Massachusetts', country: 'United States', latitude: 42.3601, longitude: -71.0589, timezone: 'America/New_York' },
  { name: 'Miami', admin1: 'Florida', country: 'United States', latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York' },
  { name: 'Atlanta', admin1: 'Georgia', country: 'United States', latitude: 33.7490, longitude: -84.3880, timezone: 'America/New_York' },
  { name: 'Washington', admin1: 'District of Columbia', country: 'United States', latitude: 38.9072, longitude: -77.0369, timezone: 'America/New_York' },
  { name: 'Minneapolis', admin1: 'Minnesota', country: 'United States', latitude: 44.9778, longitude: -93.2650, timezone: 'America/Chicago' },
  { name: 'Detroit', admin1: 'Michigan', country: 'United States', latitude: 42.3314, longitude: -83.0458, timezone: 'America/Detroit' },
  { name: 'Portland', admin1: 'Oregon', country: 'United States', latitude: 45.5152, longitude: -122.6784, timezone: 'America/Los_Angeles' },
  { name: 'Las Vegas', admin1: 'Nevada', country: 'United States', latitude: 36.1699, longitude: -115.1398, timezone: 'America/Los_Angeles' },
  { name: 'Honolulu', admin1: 'Hawaii', country: 'United States', latitude: 21.3069, longitude: -157.8583, timezone: 'Pacific/Honolulu' },
  { name: 'Anchorage', admin1: 'Alaska', country: 'United States', latitude: 61.2181, longitude: -149.9003, timezone: 'America/Anchorage' },

  // Europe
  { name: 'London', admin1: 'England', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { name: 'Edinburgh', admin1: 'Scotland', country: 'United Kingdom', latitude: 55.9533, longitude: -3.1883, timezone: 'Europe/London' },
  { name: 'Manchester', admin1: 'England', country: 'United Kingdom', latitude: 53.4808, longitude: -2.2426, timezone: 'Europe/London' },
  { name: 'Dublin', admin1: 'Leinster', country: 'Ireland', latitude: 53.3498, longitude: -6.2603, timezone: 'Europe/Dublin' },
  { name: 'Paris', admin1: 'Île-de-France', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { name: 'Lyon', admin1: 'Auvergne-Rhône-Alpes', country: 'France', latitude: 45.7640, longitude: 4.8357, timezone: 'Europe/Paris' },
  { name: 'Marseille', admin1: "Provence-Alpes-Côte d'Azur", country: 'France', latitude: 43.2965, longitude: 5.3698, timezone: 'Europe/Paris' },
  { name: 'Berlin', admin1: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin' },
  { name: 'Munich', admin1: 'Bavaria', country: 'Germany', latitude: 48.1351, longitude: 11.5820, timezone: 'Europe/Berlin' },
  { name: 'Frankfurt', admin1: 'Hesse', country: 'Germany', latitude: 50.1109, longitude: 8.6821, timezone: 'Europe/Berlin' },
  { name: 'Hamburg', admin1: 'Hamburg', country: 'Germany', latitude: 53.5511, longitude: 9.9937, timezone: 'Europe/Berlin' },
  { name: 'Amsterdam', admin1: 'North Holland', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam' },
  { name: 'Brussels', admin1: 'Brussels', country: 'Belgium', latitude: 50.8503, longitude: 4.3517, timezone: 'Europe/Brussels' },
  { name: 'Vienna', admin1: 'Vienna', country: 'Austria', latitude: 48.2082, longitude: 16.3738, timezone: 'Europe/Vienna' },
  { name: 'Zurich', admin1: 'Zurich', country: 'Switzerland', latitude: 47.3769, longitude: 8.5417, timezone: 'Europe/Zurich' },
  { name: 'Geneva', admin1: 'Geneva', country: 'Switzerland', latitude: 46.2044, longitude: 6.1432, timezone: 'Europe/Zurich' },
  { name: 'Rome', admin1: 'Lazio', country: 'Italy', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome' },
  { name: 'Milan', admin1: 'Lombardy', country: 'Italy', latitude: 45.4642, longitude: 9.1900, timezone: 'Europe/Rome' },
  { name: 'Madrid', admin1: 'Madrid', country: 'Spain', latitude: 40.4168, longitude: -3.7038, timezone: 'Europe/Madrid' },
  { name: 'Barcelona', admin1: 'Catalonia', country: 'Spain', latitude: 41.3879, longitude: 2.1699, timezone: 'Europe/Madrid' },
  { name: 'Lisbon', admin1: 'Lisbon', country: 'Portugal', latitude: 38.7223, longitude: -9.1393, timezone: 'Europe/Lisbon' },
  { name: 'Athens', admin1: 'Attica', country: 'Greece', latitude: 37.9838, longitude: 23.7275, timezone: 'Europe/Athens' },
  { name: 'Prague', admin1: 'Prague', country: 'Czechia', latitude: 50.0755, longitude: 14.4378, timezone: 'Europe/Prague' },
  { name: 'Warsaw', admin1: 'Masovia', country: 'Poland', latitude: 52.2297, longitude: 21.0122, timezone: 'Europe/Warsaw' },
  { name: 'Budapest', admin1: 'Budapest', country: 'Hungary', latitude: 47.4979, longitude: 19.0402, timezone: 'Europe/Budapest' },
  { name: 'Stockholm', admin1: 'Stockholm', country: 'Sweden', latitude: 59.3293, longitude: 18.0686, timezone: 'Europe/Stockholm' },
  { name: 'Oslo', admin1: 'Oslo', country: 'Norway', latitude: 59.9139, longitude: 10.7522, timezone: 'Europe/Oslo' },
  { name: 'Copenhagen', admin1: 'Capital Region', country: 'Denmark', latitude: 55.6761, longitude: 12.5683, timezone: 'Europe/Copenhagen' },
  { name: 'Helsinki', admin1: 'Uusimaa', country: 'Finland', latitude: 60.1699, longitude: 24.9384, timezone: 'Europe/Helsinki' },
  { name: 'Reykjavik', admin1: 'Capital Region', country: 'Iceland', latitude: 64.1466, longitude: -21.9426, timezone: 'Atlantic/Reykjavik' },

  // Asia & Pacific
  { name: 'Tokyo', admin1: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { name: 'Kyoto', admin1: 'Kyoto', country: 'Japan', latitude: 35.0116, longitude: 135.7681, timezone: 'Asia/Tokyo' },
  { name: 'Osaka', admin1: 'Osaka', country: 'Japan', latitude: 34.6937, longitude: 135.5023, timezone: 'Asia/Tokyo' },
  { name: 'Seoul', admin1: 'Seoul', country: 'South Korea', latitude: 37.5665, longitude: 126.9780, timezone: 'Asia/Seoul' },
  { name: 'Beijing', admin1: 'Beijing', country: 'China', latitude: 39.9042, longitude: 116.4074, timezone: 'Asia/Shanghai' },
  { name: 'Shanghai', admin1: 'Shanghai', country: 'China', latitude: 31.2304, longitude: 121.4737, timezone: 'Asia/Shanghai' },
  { name: 'Hong Kong', admin1: '', country: 'Hong Kong', latitude: 22.3193, longitude: 114.1694, timezone: 'Asia/Hong_Kong' },
  { name: 'Taipei', admin1: '', country: 'Taiwan', latitude: 25.0330, longitude: 121.5654, timezone: 'Asia/Taipei' },
  { name: 'Singapore', admin1: '', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
  { name: 'Bangkok', admin1: 'Bangkok', country: 'Thailand', latitude: 13.7563, longitude: 100.5018, timezone: 'Asia/Bangkok' },
  { name: 'Kuala Lumpur', admin1: 'Federal Territory', country: 'Malaysia', latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Jakarta', admin1: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { name: 'Manila', admin1: 'Metro Manila', country: 'Philippines', latitude: 14.5995, longitude: 120.9842, timezone: 'Asia/Manila' },
  { name: 'Mumbai', admin1: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { name: 'Delhi', admin1: 'Delhi', country: 'India', latitude: 28.7041, longitude: 77.1025, timezone: 'Asia/Kolkata' },
  { name: 'Bengaluru', admin1: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
  { name: 'Kolkata', admin1: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
  { name: 'Sydney', admin1: 'New South Wales', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  { name: 'Melbourne', admin1: 'Victoria', country: 'Australia', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne' },
  { name: 'Brisbane', admin1: 'Queensland', country: 'Australia', latitude: -27.4698, longitude: 153.0251, timezone: 'Australia/Brisbane' },
  { name: 'Perth', admin1: 'Western Australia', country: 'Australia', latitude: -31.9505, longitude: 115.8605, timezone: 'Australia/Perth' },
  { name: 'Auckland', admin1: 'Auckland', country: 'New Zealand', latitude: -36.8485, longitude: 174.7633, timezone: 'Pacific/Auckland' },
  { name: 'Wellington', admin1: 'Wellington', country: 'New Zealand', latitude: -41.2865, longitude: 174.7762, timezone: 'Pacific/Auckland' },

  // Middle East & Africa
  { name: 'Cairo', admin1: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  { name: 'Johannesburg', admin1: 'Gauteng', country: 'South Africa', latitude: -26.2041, longitude: 28.0473, timezone: 'Africa/Johannesburg' },
  { name: 'Cape Town', admin1: 'Western Cape', country: 'South Africa', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg' },
  { name: 'Nairobi', admin1: 'Nairobi', country: 'Kenya', latitude: -1.2921, longitude: 36.8219, timezone: 'Africa/Nairobi' },
  { name: 'Lagos', admin1: 'Lagos', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792, timezone: 'Africa/Lagos' },
  { name: 'Casablanca', admin1: 'Casablanca-Settat', country: 'Morocco', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca' },
  { name: 'Dubai', admin1: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { name: 'Riyadh', admin1: 'Riyadh', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh' },
  { name: 'Tel Aviv', admin1: 'Tel Aviv', country: 'Israel', latitude: 32.0853, longitude: 34.7818, timezone: 'Asia/Jerusalem' },
  { name: 'Istanbul', admin1: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },

  // Latin America
  { name: 'Mexico City', admin1: 'Mexico City', country: 'Mexico', latitude: 19.4326, longitude: -99.1332, timezone: 'America/Mexico_City' },
  { name: 'Guadalajara', admin1: 'Jalisco', country: 'Mexico', latitude: 20.6597, longitude: -103.3496, timezone: 'America/Mexico_City' },
  { name: 'Monterrey', admin1: 'Nuevo León', country: 'Mexico', latitude: 25.6866, longitude: -100.3161, timezone: 'America/Monterrey' },
  { name: 'Bogota', admin1: 'Bogota', country: 'Colombia', latitude: 4.7110, longitude: -74.0721, timezone: 'America/Bogota' },
  { name: 'Lima', admin1: 'Lima', country: 'Peru', latitude: -12.0464, longitude: -77.0428, timezone: 'America/Lima' },
  { name: 'Santiago', admin1: 'Santiago Metropolitan', country: 'Chile', latitude: -33.4489, longitude: -70.6693, timezone: 'America/Santiago' },
  { name: 'Buenos Aires', admin1: 'Buenos Aires', country: 'Argentina', latitude: -34.6037, longitude: -58.3816, timezone: 'America/Argentina/Buenos_Aires' },
  { name: 'Sao Paulo', admin1: 'São Paulo', country: 'Brazil', latitude: -23.5505, longitude: -46.6333, timezone: 'America/Sao_Paulo' },
  { name: 'Rio de Janeiro', admin1: 'Rio de Janeiro', country: 'Brazil', latitude: -22.9068, longitude: -43.1729, timezone: 'America/Sao_Paulo' },
]

export function formatCityDisplay(city) {
  const parts = [city.name]
  if (city.admin1 && city.admin1 !== city.name) parts.push(city.admin1)
  if (city.country) parts.push(city.country)
  return parts.join(', ')
}

export function searchOfflineCities(rawQuery, limit = 8) {
  const query = rawQuery.trim().toLowerCase()
  if (query.length < 2) return []

  const matches = []
  for (const city of MAJOR_CITIES) {
    const name = city.name.toLowerCase()
    const admin = (city.admin1 || '').toLowerCase()
    const country = (city.country || '').toLowerCase()

    let score = 0
    if (name === query) score = 100
    else if (name.startsWith(query)) score = 80
    else if (name.includes(query)) score = 60
    else if (admin.startsWith(query) || country.startsWith(query)) score = 40
    else if (admin.includes(query) || country.includes(query)) score = 20

    if (score > 0) {
      matches.push({
        ...city,
        displayName: formatCityDisplay(city),
        score,
      })
    }
  }

  return matches.sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName)).slice(0, limit)
}

export async function searchCities(rawQuery, { signal, apiEndpoint = '/api/geocode', fetcher = fetch, limit = 8 } = {}) {
  const query = rawQuery.trim()
  if (query.length < 2) return []

  const offline = searchOfflineCities(query, limit)

  try {
    const url = `${apiEndpoint}?q=${encodeURIComponent(query)}`
    const response = await fetcher(url, { signal })
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data.results) && data.results.length) {
        const remote = data.results.map(item => ({
          name: item.name,
          admin1: item.admin1 || '',
          country: item.country || '',
          latitude: Number(Number(item.latitude).toFixed(4)),
          longitude: Number(Number(item.longitude).toFixed(4)),
          timezone: item.timezone || defaultTimezone(),
          displayName: item.displayName || formatCityDisplay(item),
        }))

        // Merge remote results with offline database, avoiding duplicate locations
        const seen = new Set()
        const merged = []
        for (const item of [...remote, ...offline]) {
          const key = `${item.name.toLowerCase()}|${Math.round(item.latitude * 10)}|${Math.round(item.longitude * 10)}`
          if (!seen.has(key)) {
            seen.add(key)
            merged.push(item)
          }
          if (merged.length >= limit) break
        }
        return merged
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') throw error
    // Graceful offline fallback
  }

  return offline
}

export function supportedTimezones() {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('timeZone')
    } catch {
      // fallback
    }
  }
  return [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Vancouver', 'America/Halifax', 'America/Sao_Paulo',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
    'Europe/Athens', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore',
    'Asia/Hong_Kong', 'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland',
  ]
}

export function isValidTimezone(timeZone) {
  if (!timeZone || typeof timeZone !== 'string') return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format()
    return true
  } catch {
    return false
  }
}

export function defaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
