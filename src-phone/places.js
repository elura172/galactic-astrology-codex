// Birthplace → coordinates, for the Four Angles.
//
// The angles are the one layer that cannot be derived from the instant alone:
// the ascendant turns a full circle every day, so it needs a place AND a true
// UTC instant. Canon rule for this layer is "approximate angles flagged, never
// inferred", so this module never guesses — an unrecognised place yields null
// and the layer stays silent.
//
// City names are not unique. Portland is in Oregon and in Maine, Athens is in
// Greece and in Georgia, Tripoli is in Libya and in Lebanon. An earlier version
// keyed on the bare name and took the first match, which turned "Portland,
// Maine" into an Oregon ascendant with nothing to show it had happened. A bare
// name that matches more than one place is now reported as ambiguous rather
// than resolved, and the caller is expected to ask rather than pick.

// city, admin (state or region, '' where a country is enough), country, lat, lon, IANA zone
const CITIES = [
  ['London', '', 'United Kingdom', 51.5074, -0.1278, 'Europe/London'],
  ['London', 'Ontario', 'Canada', 42.9849, -81.2453, 'America/Toronto'],
  ['Manchester', '', 'United Kingdom', 53.4808, -2.2426, 'Europe/London'],
  ['Manchester', 'New Hampshire', 'United States', 42.9956, -71.4548, 'America/New_York'],
  ['Birmingham', '', 'United Kingdom', 52.4862, -1.8904, 'Europe/London'],
  ['Birmingham', 'Alabama', 'United States', 33.5186, -86.8104, 'America/Chicago'],
  ['Cambridge', '', 'United Kingdom', 52.2053, 0.1218, 'Europe/London'],
  ['Cambridge', 'Massachusetts', 'United States', 42.3736, -71.1097, 'America/New_York'],
  ['Newcastle', '', 'United Kingdom', 54.9783, -1.6178, 'Europe/London'],
  ['Newcastle', 'New South Wales', 'Australia', -32.9283, 151.7817, 'Australia/Sydney'],
  ['Bristol', '', 'United Kingdom', 51.4545, -2.5879, 'Europe/London'],
  ['Perth', '', 'United Kingdom', 56.3950, -3.4308, 'Europe/London'],
  ['Perth', 'Western Australia', 'Australia', -31.9505, 115.8605, 'Australia/Perth'],
  ['Edinburgh', '', 'United Kingdom', 55.9533, -3.1883, 'Europe/London'],
  ['Glasgow', '', 'United Kingdom', 55.8642, -4.2518, 'Europe/London'],
  ['Dublin', '', 'Ireland', 53.3498, -6.2603, 'Europe/Dublin'],
  ['Dublin', 'Ohio', 'United States', 40.0992, -83.1141, 'America/New_York'],
  ['Cork', '', 'Ireland', 51.8985, -8.4756, 'Europe/Dublin'],
  ['Paris', '', 'France', 48.8566, 2.3522, 'Europe/Paris'],
  ['Lyon', '', 'France', 45.7640, 4.8357, 'Europe/Paris'],
  ['Marseille', '', 'France', 43.2965, 5.3698, 'Europe/Paris'],
  ['Berlin', '', 'Germany', 52.5200, 13.4050, 'Europe/Berlin'],
  ['Munich', '', 'Germany', 48.1351, 11.5820, 'Europe/Berlin'],
  ['Hamburg', '', 'Germany', 53.5511, 9.9937, 'Europe/Berlin'],
  ['Cologne', '', 'Germany', 50.9375, 6.9603, 'Europe/Berlin'],
  ['Frankfurt', '', 'Germany', 50.1109, 8.6821, 'Europe/Berlin'],
  ['Amsterdam', '', 'Netherlands', 52.3676, 4.9041, 'Europe/Amsterdam'],
  ['Rotterdam', '', 'Netherlands', 51.9244, 4.4777, 'Europe/Amsterdam'],
  ['Brussels', '', 'Belgium', 50.8503, 4.3517, 'Europe/Brussels'],
  ['Zurich', '', 'Switzerland', 47.3769, 8.5417, 'Europe/Zurich'],
  ['Geneva', '', 'Switzerland', 46.2044, 6.1432, 'Europe/Zurich'],
  ['Vienna', '', 'Austria', 48.2082, 16.3738, 'Europe/Vienna'],
  ['Prague', '', 'Czechia', 50.0755, 14.4378, 'Europe/Prague'],
  ['Warsaw', '', 'Poland', 52.2297, 21.0122, 'Europe/Warsaw'],
  ['Krakow', '', 'Poland', 50.0647, 19.9450, 'Europe/Warsaw'],
  ['Budapest', '', 'Hungary', 47.4979, 19.0402, 'Europe/Budapest'],
  ['Bucharest', '', 'Romania', 44.4268, 26.1025, 'Europe/Bucharest'],
  ['Sofia', '', 'Bulgaria', 42.6977, 23.3219, 'Europe/Sofia'],
  ['Belgrade', '', 'Serbia', 44.7866, 20.4489, 'Europe/Belgrade'],
  ['Zagreb', '', 'Croatia', 45.8150, 15.9819, 'Europe/Zagreb'],
  ['Madrid', '', 'Spain', 40.4168, -3.7038, 'Europe/Madrid'],
  ['Barcelona', '', 'Spain', 41.3874, 2.1686, 'Europe/Madrid'],
  ['Valencia', '', 'Spain', 39.4699, -0.3763, 'Europe/Madrid'],
  ['Valencia', '', 'Venezuela', 10.1620, -68.0077, 'America/Caracas'],
  ['Seville', '', 'Spain', 37.3891, -5.9845, 'Europe/Madrid'],
  ['Cordoba', '', 'Spain', 37.8882, -4.7794, 'Europe/Madrid'],
  ['Cordoba', '', 'Argentina', -31.4201, -64.1888, 'America/Argentina/Cordoba'],
  ['Toledo', '', 'Spain', 39.8628, -4.0273, 'Europe/Madrid'],
  ['Toledo', 'Ohio', 'United States', 41.6528, -83.5379, 'America/New_York'],
  ['Lisbon', '', 'Portugal', 38.7223, -9.1393, 'Europe/Lisbon'],
  ['Porto', '', 'Portugal', 41.1579, -8.6291, 'Europe/Lisbon'],
  ['Rome', '', 'Italy', 41.9028, 12.4964, 'Europe/Rome'],
  ['Rome', 'Georgia', 'United States', 34.2570, -85.1647, 'America/New_York'],
  ['Milan', '', 'Italy', 45.4642, 9.1900, 'Europe/Rome'],
  ['Naples', '', 'Italy', 40.8518, 14.2681, 'Europe/Rome'],
  ['Naples', 'Florida', 'United States', 26.1420, -81.7948, 'America/New_York'],
  ['Florence', '', 'Italy', 43.7696, 11.2558, 'Europe/Rome'],
  ['Venice', '', 'Italy', 45.4408, 12.3155, 'Europe/Rome'],
  ['Turin', '', 'Italy', 45.0703, 7.6869, 'Europe/Rome'],
  ['Athens', '', 'Greece', 37.9838, 23.7275, 'Europe/Athens'],
  ['Athens', 'Georgia', 'United States', 33.9519, -83.3576, 'America/New_York'],
  ['Thessaloniki', '', 'Greece', 40.6401, 22.9444, 'Europe/Athens'],
  ['Stockholm', '', 'Sweden', 59.3293, 18.0686, 'Europe/Stockholm'],
  ['Gothenburg', '', 'Sweden', 57.7089, 11.9746, 'Europe/Stockholm'],
  ['Malmo', '', 'Sweden', 55.6050, 13.0038, 'Europe/Stockholm'],
  ['Oslo', '', 'Norway', 59.9139, 10.7522, 'Europe/Oslo'],
  ['Bergen', '', 'Norway', 60.3913, 5.3221, 'Europe/Oslo'],
  ['Copenhagen', '', 'Denmark', 55.6761, 12.5683, 'Europe/Copenhagen'],
  ['Helsinki', '', 'Finland', 60.1699, 24.9384, 'Europe/Helsinki'],
  ['Reykjavik', '', 'Iceland', 64.1466, -21.9426, 'Atlantic/Reykjavik'],
  ['Tallinn', '', 'Estonia', 59.4370, 24.7536, 'Europe/Tallinn'],
  ['Riga', '', 'Latvia', 56.9496, 24.1052, 'Europe/Riga'],
  ['Vilnius', '', 'Lithuania', 54.6872, 25.2797, 'Europe/Vilnius'],
  ['Moscow', '', 'Russia', 55.7558, 37.6173, 'Europe/Moscow'],
  ['Saint Petersburg', '', 'Russia', 59.9311, 30.3609, 'Europe/Moscow'],
  ['Saint Petersburg', 'Florida', 'United States', 27.7676, -82.6403, 'America/New_York'],
  ['Novosibirsk', '', 'Russia', 55.0084, 82.9357, 'Asia/Novosibirsk'],
  ['Irkutsk', '', 'Russia', 52.2871, 104.3056, 'Asia/Irkutsk'],
  ['Ulan-Ude', '', 'Russia', 51.8335, 107.5841, 'Asia/Irkutsk'],
  ['Vladivostok', '', 'Russia', 43.1332, 131.9113, 'Asia/Vladivostok'],
  ['Kyiv', '', 'Ukraine', 50.4501, 30.5234, 'Europe/Kyiv'],
  ['Odesa', '', 'Ukraine', 46.4825, 30.7233, 'Europe/Kyiv'],
  ['Odessa', 'Texas', 'United States', 31.8457, -102.3676, 'America/Chicago'],
  ['Minsk', '', 'Belarus', 53.9006, 27.5590, 'Europe/Minsk'],
  ['Istanbul', '', 'Turkey', 41.0082, 28.9784, 'Europe/Istanbul'],
  ['Ankara', '', 'Turkey', 39.9334, 32.8597, 'Europe/Istanbul'],
  ['New York', 'New York', 'United States', 40.7128, -74.0060, 'America/New_York'],
  ['Brooklyn', 'New York', 'United States', 40.6782, -73.9442, 'America/New_York'],
  ['Boston', 'Massachusetts', 'United States', 42.3601, -71.0589, 'America/New_York'],
  ['Philadelphia', 'Pennsylvania', 'United States', 39.9526, -75.1652, 'America/New_York'],
  ['Pittsburgh', 'Pennsylvania', 'United States', 40.4406, -79.9959, 'America/New_York'],
  ['Washington', 'District of Columbia', 'United States', 38.9072, -77.0369, 'America/New_York'],
  ['Baltimore', 'Maryland', 'United States', 39.2904, -76.6122, 'America/New_York'],
  ['Richmond', 'Virginia', 'United States', 37.5407, -77.4360, 'America/New_York'],
  ['Alexandria', 'Virginia', 'United States', 38.8048, -77.0469, 'America/New_York'],
  ['Alexandria', '', 'Egypt', 31.2001, 29.9187, 'Africa/Cairo'],
  ['Atlanta', 'Georgia', 'United States', 33.7490, -84.3880, 'America/New_York'],
  ['Charlotte', 'North Carolina', 'United States', 35.2271, -80.8431, 'America/New_York'],
  ['Miami', 'Florida', 'United States', 25.7617, -80.1918, 'America/New_York'],
  ['Orlando', 'Florida', 'United States', 28.5383, -81.3792, 'America/New_York'],
  ['Columbus', 'Ohio', 'United States', 39.9612, -82.9988, 'America/New_York'],
  ['Cleveland', 'Ohio', 'United States', 41.4993, -81.6944, 'America/New_York'],
  ['Detroit', 'Michigan', 'United States', 42.3314, -83.0458, 'America/Detroit'],
  ['Chicago', 'Illinois', 'United States', 41.8781, -87.6298, 'America/Chicago'],
  ['Springfield', 'Illinois', 'United States', 39.7817, -89.6501, 'America/Chicago'],
  ['Springfield', 'Massachusetts', 'United States', 42.1015, -72.5898, 'America/New_York'],
  ['Milwaukee', 'Wisconsin', 'United States', 43.0389, -87.9065, 'America/Chicago'],
  ['Minneapolis', 'Minnesota', 'United States', 44.9778, -93.2650, 'America/Chicago'],
  ['Saint Louis', 'Missouri', 'United States', 38.6270, -90.1994, 'America/Chicago'],
  ['Kansas City', 'Missouri', 'United States', 39.0997, -94.5786, 'America/Chicago'],
  ['Nashville', 'Tennessee', 'United States', 36.1627, -86.7816, 'America/Chicago'],
  ['Memphis', 'Tennessee', 'United States', 35.1495, -90.0490, 'America/Chicago'],
  ['New Orleans', 'Louisiana', 'United States', 29.9511, -90.0715, 'America/Chicago'],
  ['Houston', 'Texas', 'United States', 29.7604, -95.3698, 'America/Chicago'],
  ['Dallas', 'Texas', 'United States', 32.7767, -96.7970, 'America/Chicago'],
  ['Austin', 'Texas', 'United States', 30.2672, -97.7431, 'America/Chicago'],
  ['San Antonio', 'Texas', 'United States', 29.4241, -98.4936, 'America/Chicago'],
  ['Denver', 'Colorado', 'United States', 39.7392, -104.9903, 'America/Denver'],
  ['Boulder', 'Colorado', 'United States', 40.0150, -105.2705, 'America/Denver'],
  ['Santa Fe', 'New Mexico', 'United States', 35.6870, -105.9378, 'America/Denver'],
  ['Albuquerque', 'New Mexico', 'United States', 35.0844, -106.6504, 'America/Denver'],
  ['Salt Lake City', 'Utah', 'United States', 40.7608, -111.8910, 'America/Denver'],
  ['Phoenix', 'Arizona', 'United States', 33.4484, -112.0740, 'America/Phoenix'],
  ['Tucson', 'Arizona', 'United States', 32.2226, -110.9747, 'America/Phoenix'],
  ['Las Vegas', 'Nevada', 'United States', 36.1699, -115.1398, 'America/Los_Angeles'],
  ['Los Angeles', 'California', 'United States', 34.0522, -118.2437, 'America/Los_Angeles'],
  ['San Diego', 'California', 'United States', 32.7157, -117.1611, 'America/Los_Angeles'],
  ['San Francisco', 'California', 'United States', 37.7749, -122.4194, 'America/Los_Angeles'],
  ['Oakland', 'California', 'United States', 37.8044, -122.2712, 'America/Los_Angeles'],
  ['San Jose', 'California', 'United States', 37.3382, -121.8863, 'America/Los_Angeles'],
  ['San Jose', '', 'Costa Rica', 9.9281, -84.0907, 'America/Costa_Rica'],
  ['Sacramento', 'California', 'United States', 38.5816, -121.4944, 'America/Los_Angeles'],
  ['Portland', 'Oregon', 'United States', 45.5152, -122.6784, 'America/Los_Angeles'],
  ['Portland', 'Maine', 'United States', 43.6591, -70.2568, 'America/New_York'],
  ['Salem', 'Oregon', 'United States', 44.9429, -123.0351, 'America/Los_Angeles'],
  ['Salem', 'Massachusetts', 'United States', 42.5195, -70.8967, 'America/New_York'],
  ['Seattle', 'Washington', 'United States', 47.6062, -122.3321, 'America/Los_Angeles'],
  ['Anchorage', 'Alaska', 'United States', 61.2181, -149.9003, 'America/Anchorage'],
  ['Honolulu', 'Hawaii', 'United States', 21.3069, -157.8583, 'Pacific/Honolulu'],
  ['Toronto', 'Ontario', 'Canada', 43.6532, -79.3832, 'America/Toronto'],
  ['Ottawa', 'Ontario', 'Canada', 45.4215, -75.6972, 'America/Toronto'],
  ['Hamilton', 'Ontario', 'Canada', 43.2557, -79.8711, 'America/Toronto'],
  ['Hamilton', '', 'New Zealand', -37.7870, 175.2793, 'Pacific/Auckland'],
  ['Kingston', 'Ontario', 'Canada', 44.2312, -76.4860, 'America/Toronto'],
  ['Kingston', '', 'Jamaica', 17.9714, -76.7931, 'America/Jamaica'],
  ['Montreal', 'Quebec', 'Canada', 45.5017, -73.5673, 'America/Toronto'],
  ['Quebec City', 'Quebec', 'Canada', 46.8139, -71.2080, 'America/Toronto'],
  ['Vancouver', 'British Columbia', 'Canada', 49.2827, -123.1207, 'America/Vancouver'],
  ['Victoria', 'British Columbia', 'Canada', 48.4284, -123.3656, 'America/Vancouver'],
  ['Calgary', 'Alberta', 'Canada', 51.0447, -114.0719, 'America/Edmonton'],
  ['Edmonton', 'Alberta', 'Canada', 53.5461, -113.4938, 'America/Edmonton'],
  ['Winnipeg', 'Manitoba', 'Canada', 49.8951, -97.1384, 'America/Winnipeg'],
  ['Mexico City', '', 'Mexico', 19.4326, -99.1332, 'America/Mexico_City'],
  ['Guadalajara', '', 'Mexico', 20.6597, -103.3496, 'America/Mexico_City'],
  ['Monterrey', '', 'Mexico', 25.6866, -100.3161, 'America/Monterrey'],
  ['Oaxaca', '', 'Mexico', 17.0732, -96.7266, 'America/Mexico_City'],
  ['Havana', '', 'Cuba', 23.1136, -82.3666, 'America/Havana'],
  ['Santo Domingo', '', 'Dominican Republic', 18.4861, -69.9312, 'America/Santo_Domingo'],
  ['Santiago', '', 'Chile', -33.4489, -70.6693, 'America/Santiago'],
  ['Santiago', '', 'Dominican Republic', 19.4517, -70.6970, 'America/Santo_Domingo'],
  ['Bogota', '', 'Colombia', 4.7110, -74.0721, 'America/Bogota'],
  ['Medellin', '', 'Colombia', 6.2442, -75.5812, 'America/Bogota'],
  ['Caracas', '', 'Venezuela', 10.4806, -66.9036, 'America/Caracas'],
  ['Quito', '', 'Ecuador', -0.1807, -78.4678, 'America/Guayaquil'],
  ['Lima', '', 'Peru', -12.0464, -77.0428, 'America/Lima'],
  ['Lima', 'Ohio', 'United States', 40.7426, -84.1052, 'America/New_York'],
  ['La Paz', '', 'Bolivia', -16.4897, -68.1193, 'America/La_Paz'],
  ['Buenos Aires', '', 'Argentina', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires'],
  ['Montevideo', '', 'Uruguay', -34.9011, -56.1645, 'America/Montevideo'],
  ['Sao Paulo', '', 'Brazil', -23.5505, -46.6333, 'America/Sao_Paulo'],
  ['Rio de Janeiro', '', 'Brazil', -22.9068, -43.1729, 'America/Sao_Paulo'],
  ['Brasilia', '', 'Brazil', -15.7939, -47.8828, 'America/Sao_Paulo'],
  ['Salvador', '', 'Brazil', -12.9777, -38.5016, 'America/Bahia'],
  ['Lagos', '', 'Nigeria', 6.5244, 3.3792, 'Africa/Lagos'],
  ['Abuja', '', 'Nigeria', 9.0765, 7.3986, 'Africa/Lagos'],
  ['Accra', '', 'Ghana', 5.6037, -0.1870, 'Africa/Accra'],
  ['Dakar', '', 'Senegal', 14.7167, -17.4677, 'Africa/Dakar'],
  ['Casablanca', '', 'Morocco', 33.5731, -7.5898, 'Africa/Casablanca'],
  ['Marrakesh', '', 'Morocco', 31.6295, -7.9811, 'Africa/Casablanca'],
  ['Tunis', '', 'Tunisia', 36.8065, 10.1815, 'Africa/Tunis'],
  ['Tripoli', '', 'Libya', 32.8872, 13.1913, 'Africa/Tripoli'],
  ['Tripoli', '', 'Lebanon', 34.4367, 35.8497, 'Asia/Beirut'],
  ['Cairo', '', 'Egypt', 30.0444, 31.2357, 'Africa/Cairo'],
  ['Khartoum', '', 'Sudan', 15.5007, 32.5599, 'Africa/Khartoum'],
  ['Addis Ababa', '', 'Ethiopia', 9.0300, 38.7400, 'Africa/Addis_Ababa'],
  ['Nairobi', '', 'Kenya', -1.2921, 36.8219, 'Africa/Nairobi'],
  ['Kampala', '', 'Uganda', 0.3476, 32.5825, 'Africa/Kampala'],
  ['Dar es Salaam', '', 'Tanzania', -6.7924, 39.2083, 'Africa/Dar_es_Salaam'],
  ['Luanda', '', 'Angola', -8.8390, 13.2894, 'Africa/Luanda'],
  ['Harare', '', 'Zimbabwe', -17.8252, 31.0335, 'Africa/Harare'],
  ['Johannesburg', '', 'South Africa', -26.2041, 28.0473, 'Africa/Johannesburg'],
  ['Cape Town', '', 'South Africa', -33.9249, 18.4241, 'Africa/Johannesburg'],
  ['Durban', '', 'South Africa', -29.8587, 31.0218, 'Africa/Johannesburg'],
  ['Tel Aviv', '', 'Israel', 32.0853, 34.7818, 'Asia/Jerusalem'],
  ['Jerusalem', '', 'Israel', 31.7683, 35.2137, 'Asia/Jerusalem'],
  ['Beirut', '', 'Lebanon', 33.8938, 35.5018, 'Asia/Beirut'],
  ['Damascus', '', 'Syria', 33.5138, 36.2765, 'Asia/Damascus'],
  ['Amman', '', 'Jordan', 31.9454, 35.9284, 'Asia/Amman'],
  ['Baghdad', '', 'Iraq', 33.3152, 44.3661, 'Asia/Baghdad'],
  ['Riyadh', '', 'Saudi Arabia', 24.7136, 46.6753, 'Asia/Riyadh'],
  ['Jeddah', '', 'Saudi Arabia', 21.4858, 39.1925, 'Asia/Riyadh'],
  ['Dubai', '', 'United Arab Emirates', 25.2048, 55.2708, 'Asia/Dubai'],
  ['Abu Dhabi', '', 'United Arab Emirates', 24.4539, 54.3773, 'Asia/Dubai'],
  ['Doha', '', 'Qatar', 25.2854, 51.5310, 'Asia/Qatar'],
  ['Kuwait City', '', 'Kuwait', 29.3759, 47.9774, 'Asia/Kuwait'],
  ['Tehran', '', 'Iran', 35.6892, 51.3890, 'Asia/Tehran'],
  ['Kabul', '', 'Afghanistan', 34.5553, 69.2075, 'Asia/Kabul'],
  ['Karachi', '', 'Pakistan', 24.8607, 67.0011, 'Asia/Karachi'],
  ['Lahore', '', 'Pakistan', 31.5204, 74.3587, 'Asia/Karachi'],
  ['Islamabad', '', 'Pakistan', 33.6844, 73.0479, 'Asia/Karachi'],
  ['Delhi', '', 'India', 28.6139, 77.2090, 'Asia/Kolkata'],
  ['Mumbai', '', 'India', 19.0760, 72.8777, 'Asia/Kolkata'],
  ['Bangalore', '', 'India', 12.9716, 77.5946, 'Asia/Kolkata'],
  ['Chennai', '', 'India', 13.0827, 80.2707, 'Asia/Kolkata'],
  ['Kolkata', '', 'India', 22.5726, 88.3639, 'Asia/Kolkata'],
  ['Hyderabad', '', 'India', 17.3850, 78.4867, 'Asia/Kolkata'],
  ['Pune', '', 'India', 18.5204, 73.8567, 'Asia/Kolkata'],
  ['Jaipur', '', 'India', 26.9124, 75.7873, 'Asia/Kolkata'],
  ['Varanasi', '', 'India', 25.3176, 82.9739, 'Asia/Kolkata'],
  ['Kathmandu', '', 'Nepal', 27.7172, 85.3240, 'Asia/Kathmandu'],
  ['Dhaka', '', 'Bangladesh', 23.8103, 90.4125, 'Asia/Dhaka'],
  ['Colombo', '', 'Sri Lanka', 6.9271, 79.8612, 'Asia/Colombo'],
  ['Bangkok', '', 'Thailand', 13.7563, 100.5018, 'Asia/Bangkok'],
  ['Chiang Mai', '', 'Thailand', 18.7883, 98.9853, 'Asia/Bangkok'],
  ['Hanoi', '', 'Vietnam', 21.0278, 105.8342, 'Asia/Ho_Chi_Minh'],
  ['Ho Chi Minh City', '', 'Vietnam', 10.8231, 106.6297, 'Asia/Ho_Chi_Minh'],
  ['Phnom Penh', '', 'Cambodia', 11.5564, 104.9282, 'Asia/Phnom_Penh'],
  ['Yangon', '', 'Myanmar', 16.8661, 96.1951, 'Asia/Yangon'],
  ['Singapore', '', 'Singapore', 1.3521, 103.8198, 'Asia/Singapore'],
  ['Kuala Lumpur', '', 'Malaysia', 3.1390, 101.6869, 'Asia/Kuala_Lumpur'],
  ['Jakarta', '', 'Indonesia', -6.2088, 106.8456, 'Asia/Jakarta'],
  ['Denpasar', 'Bali', 'Indonesia', -8.6500, 115.2167, 'Asia/Makassar'],
  ['Manila', '', 'Philippines', 14.5995, 120.9842, 'Asia/Manila'],
  ['Hong Kong', '', 'China', 22.3193, 114.1694, 'Asia/Hong_Kong'],
  ['Taipei', '', 'Taiwan', 25.0330, 121.5654, 'Asia/Taipei'],
  ['Shanghai', '', 'China', 31.2304, 121.4737, 'Asia/Shanghai'],
  ['Beijing', '', 'China', 39.9042, 116.4074, 'Asia/Shanghai'],
  ['Guangzhou', '', 'China', 23.1291, 113.2644, 'Asia/Shanghai'],
  ['Chengdu', '', 'China', 30.5728, 104.0668, 'Asia/Shanghai'],
  ['Lhasa', '', 'China', 29.6520, 91.1721, 'Asia/Shanghai'],
  ['Seoul', '', 'South Korea', 37.5665, 126.9780, 'Asia/Seoul'],
  ['Busan', '', 'South Korea', 35.1796, 129.0756, 'Asia/Seoul'],
  ['Tokyo', '', 'Japan', 35.6762, 139.6503, 'Asia/Tokyo'],
  ['Kyoto', '', 'Japan', 35.0116, 135.7681, 'Asia/Tokyo'],
  ['Osaka', '', 'Japan', 34.6937, 135.5023, 'Asia/Tokyo'],
  ['Sapporo', '', 'Japan', 43.0618, 141.3545, 'Asia/Tokyo'],
  ['Ulaanbaatar', '', 'Mongolia', 47.8864, 106.9057, 'Asia/Ulaanbaatar'],
  ['Almaty', '', 'Kazakhstan', 43.2220, 76.8512, 'Asia/Almaty'],
  ['Tashkent', '', 'Uzbekistan', 41.2995, 69.2401, 'Asia/Tashkent'],
  ['Sydney', 'New South Wales', 'Australia', -33.8688, 151.2093, 'Australia/Sydney'],
  ['Melbourne', 'Victoria', 'Australia', -37.8136, 144.9631, 'Australia/Melbourne'],
  ['Brisbane', 'Queensland', 'Australia', -27.4698, 153.0251, 'Australia/Brisbane'],
  ['Adelaide', 'South Australia', 'Australia', -34.9285, 138.6007, 'Australia/Adelaide'],
  ['Hobart', 'Tasmania', 'Australia', -42.8821, 147.3272, 'Australia/Hobart'],
  ['Canberra', '', 'Australia', -35.2809, 149.1300, 'Australia/Sydney'],
  ['Darwin', 'Northern Territory', 'Australia', -12.4634, 130.8456, 'Australia/Darwin'],
  ['Auckland', '', 'New Zealand', -36.8485, 174.7633, 'Pacific/Auckland'],
  ['Wellington', '', 'New Zealand', -41.2865, 174.7762, 'Pacific/Auckland'],
  ['Christchurch', '', 'New Zealand', -43.5321, 172.6362, 'Pacific/Auckland'],
  ['Suva', '', 'Fiji', -18.1248, 178.4501, 'Pacific/Fiji'],
]

const PLACES = CITIES.map(([city, admin, country, latitude, longitude, timeZone]) => ({
  city,
  admin,
  country,
  latitude,
  longitude,
  timeZone,
  // What the interface offers and what a resolved place calls itself. Always
  // carries the country, so a chosen suggestion can never be the ambiguous one.
  label: [city, admin, country].filter(Boolean).join(', '),
}))

// Accents are a spelling difference, not a different city: "Bogotá" and
// "Bogota" are the same place, and a birth certificate may use either.
function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Every way a place may reasonably be named, mapped to the places that answer
// to it. A key reaching two places is ambiguous and is never silently resolved.
const INDEX = new Map()
function index(key, place) {
  const folded = fold(key)
  if (!folded) return
  const existing = INDEX.get(folded)
  if (existing) existing.push(place)
  else INDEX.set(folded, [place])
}
PLACES.forEach(place => {
  index(place.city, place)
  index(`${place.city} ${place.country}`, place)
  index(`${place.city}, ${place.country}`, place)
  if (place.admin) {
    index(`${place.city} ${place.admin}`, place)
    index(`${place.city}, ${place.admin}`, place)
    index(`${place.city}, ${place.admin}, ${place.country}`, place)
  }
})

const COORDINATE_PAIR = /^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/

/**
 * Resolve a birthplace.
 *
 * Returns a place, or `{ ambiguous: [...] }` when a name answers to more than
 * one place, or null when nothing matches. Ambiguity is deliberately not
 * resolved here: "Portland" is a real question, and answering it by picking
 * Oregon would put a wrong ascendant in a reading with nothing to show for it.
 */
export function resolveBirthplace(input) {
  const text = String(input ?? '').trim()
  if (!text) return null

  const pair = text.match(COORDINATE_PAIR)
  if (pair) {
    const latitude = Number(pair[1])
    const longitude = Number(pair[2])
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
    return { latitude, longitude, timeZone: null, source: 'coordinates', label: `${latitude}, ${longitude}` }
  }

  // Try the fullest reading of what was typed first, then fall back to looser
  // keys, so "Portland, Maine, United States" never has to compete with "Portland".
  const attempts = [text, text.replace(/\s*,\s*/g, ', ')]
  for (const attempt of attempts) {
    const matches = INDEX.get(fold(attempt))
    if (!matches) continue
    if (matches.length === 1) {
      const place = matches[0]
      return { ...place, source: 'city' }
    }
    return { ambiguous: matches.map(place => ({ ...place })) }
  }
  return null
}

/** Every label the interface can offer, for a datalist. */
export function placeLabels() {
  return PLACES.map(place => place.label)
}

export function knownPlaceCount() {
  return PLACES.length
}
