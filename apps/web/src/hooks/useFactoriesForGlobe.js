import { useState, useEffect } from 'react';
import { get } from '../lib/http';

// Real API-based factory data
export function useFactoriesForGlobe() {
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFactories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from real API
        const data = await get('/api/vendors/saved');
        const savedVendors = data.items || [];
        
        // Enrich with lat/lng (simplified for now)
        const enriched = savedVendors.map(f => {
          const { lat, lng } = inferCoords(f.name, f.id);
          return { ...f, lat, lng };
        });
        
        setFactories(enriched);
      } catch (err) {
        console.error('Error fetching factories:', err);
        setError(err.message);
        setFactories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFactories();
  }, []);

  return { factories, loading, error };
}

// Simple coordinate inference (replace with real geocoding)
function inferCoords(name, id) {
  // Basic coordinate inference based on factory name patterns
  const patterns = {
    'china': { lat: 35.8617, lng: 104.1954 },
    'india': { lat: 20.5937, lng: 78.9629 },
    'vietnam': { lat: 14.0583, lng: 108.2772 },
    'bangladesh': { lat: 23.6850, lng: 90.3563 },
    'sri lanka': { lat: 7.8731, lng: 80.7718 },
    'thailand': { lat: 15.8700, lng: 100.9925 },
    'indonesia': { lat: -0.7893, lng: 113.9213 },
    'philippines': { lat: 12.8797, lng: 121.7740 },
    'malaysia': { lat: 4.2105, lng: 101.9758 },
    'taiwan': { lat: 23.6978, lng: 120.9605 },
    'south korea': { lat: 35.9078, lng: 127.7669 },
    'japan': { lat: 36.2048, lng: 138.2529 },
    'pakistan': { lat: 30.3753, lng: 69.3451 },
    'turkey': { lat: 38.9637, lng: 35.2433 },
    'mexico': { lat: 23.6345, lng: -102.5528 },
    'brazil': { lat: -14.2350, lng: -51.9253 },
    'peru': { lat: -9.1900, lng: -75.0152 },
    'colombia': { lat: 4.5709, lng: -74.2973 },
    'guatemala': { lat: 15.7835, lng: -90.2308 },
    'honduras': { lat: 15.2000, lng: -86.2419 },
    'el salvador': { lat: 13.7942, lng: -88.8965 },
    'nicaragua': { lat: 12.8654, lng: -85.2072 },
    'costa rica': { lat: 9.7489, lng: -83.7534 },
    'dominican republic': { lat: 18.7357, lng: -70.1627 },
    'haiti': { lat: 18.9712, lng: -72.2852 },
    'jamaica': { lat: 18.1096, lng: -77.2975 },
    'trinidad': { lat: 10.6918, lng: -61.2225 },
    'morocco': { lat: 31.6295, lng: -7.9811 },
    'tunisia': { lat: 33.8869, lng: 9.5375 },
    'egypt': { lat: 26.0975, lng: 30.0444 },
    'ethiopia': { lat: 9.1450, lng: 40.4897 },
    'kenya': { lat: -0.0236, lng: 37.9062 },
    'uganda': { lat: 1.3733, lng: 32.2903 },
    'tanzania': { lat: -6.3690, lng: 34.8888 },
    'madagascar': { lat: -18.7669, lng: 46.8691 },
    'mauritius': { lat: -20.3484, lng: 57.5522 },
    'south africa': { lat: -30.5595, lng: 22.9375 },
    'lesotho': { lat: -29.6100, lng: 28.2336 },
    'swaziland': { lat: -26.5225, lng: 31.4659 },
    'botswana': { lat: -22.3285, lng: 24.6849 },
    'namibia': { lat: -22.9576, lng: 18.4904 },
    'zimbabwe': { lat: -19.0154, lng: 29.1549 },
    'zambia': { lat: -13.1339, lng: 27.8493 },
    'malawi': { lat: -13.2543, lng: 34.3015 },
    'mozambique': { lat: -18.6657, lng: 35.5296 },
    'angola': { lat: -11.2027, lng: 17.8739 },
    'cameroon': { lat: 7.3697, lng: 12.3547 },
    'central african republic': { lat: 6.6111, lng: 20.9394 },
    'chad': { lat: 15.4542, lng: 18.7322 },
    'niger': { lat: 17.6078, lng: 8.0817 },
    'mali': { lat: 17.5707, lng: -3.9962 },
    'burkina faso': { lat: 12.2383, lng: -1.5616 },
    'ivory coast': { lat: 7.5400, lng: -5.5471 },
    'ghana': { lat: 7.9465, lng: -1.0232 },
    'togo': { lat: 8.6195, lng: 0.8248 },
    'benin': { lat: 9.3077, lng: 2.3158 },
    'nigeria': { lat: 9.0819, lng: 8.6753 },
    'senegal': { lat: 14.4974, lng: -14.4524 },
    'gambia': { lat: 13.4432, lng: -15.3101 },
    'guinea-bissau': { lat: 11.8037, lng: -15.1804 },
    'guinea': { lat: 9.6412, lng: -9.6966 },
    'sierra leone': { lat: 8.4606, lng: -11.7799 },
    'liberia': { lat: 6.4281, lng: -9.4295 },
    'cape verde': { lat: 16.5388, lng: -24.0132 },
    'sao tome': { lat: 0.1864, lng: 6.6131 },
    'equatorial guinea': { lat: 1.6508, lng: 10.2679 },
    'gabon': { lat: -0.8037, lng: 11.6094 },
    'congo': { lat: -0.2280, lng: 15.8277 },
    'democratic republic of the congo': { lat: -4.0383, lng: 21.7587 },
    'rwanda': { lat: -1.9403, lng: 29.8739 },
    'burundi': { lat: -3.3731, lng: 29.9189 },
    'albania': { lat: 41.1533, lng: 20.1683 },
    'bosnia': { lat: 43.9159, lng: 17.6791 },
    'croatia': { lat: 45.1000, lng: 15.2000 },
    'serbia': { lat: 44.0165, lng: 21.0059 },
    'montenegro': { lat: 42.7087, lng: 19.3744 },
    'north macedonia': { lat: 41.6086, lng: 21.7453 },
    'bulgaria': { lat: 42.7339, lng: 25.4858 },
    'romania': { lat: 45.9432, lng: 24.9668 },
    'moldova': { lat: 47.4116, lng: 28.3699 },
    'ukraine': { lat: 48.3794, lng: 31.1656 },
    'belarus': { lat: 53.7098, lng: 27.9534 },
    'lithuania': { lat: 55.1694, lng: 23.8813 },
    'latvia': { lat: 56.8796, lng: 24.6032 },
    'estonia': { lat: 58.5953, lng: 25.0136 },
    'poland': { lat: 51.9194, lng: 19.1451 },
    'czech republic': { lat: 49.8175, lng: 15.4730 },
    'slovakia': { lat: 48.6690, lng: 19.6990 },
    'hungary': { lat: 47.1625, lng: 19.5033 },
    'slovenia': { lat: 46.1512, lng: 14.9955 },
    'austria': { lat: 47.5162, lng: 14.5501 },
    'switzerland': { lat: 46.8182, lng: 8.2275 },
    'liechtenstein': { lat: 47.1660, lng: 9.5554 },
    'germany': { lat: 51.1657, lng: 10.4515 },
    'luxembourg': { lat: 49.8153, lng: 6.1296 },
    'belgium': { lat: 50.5039, lng: 4.4699 },
    'netherlands': { lat: 52.1326, lng: 5.2913 },
    'denmark': { lat: 56.2639, lng: 9.5018 },
    'sweden': { lat: 60.1282, lng: 18.6435 },
    'norway': { lat: 60.4720, lng: 8.4689 },
    'finland': { lat: 61.9241, lng: 25.7482 },
    'iceland': { lat: 64.9631, lng: -19.0208 },
    'ireland': { lat: 53.4129, lng: -8.2439 },
    'united kingdom': { lat: 55.3781, lng: -3.4360 },
    'france': { lat: 46.2276, lng: 2.2137 },
    'spain': { lat: 40.4637, lng: -3.7492 },
    'portugal': { lat: 39.3999, lng: -8.2245 },
    'italy': { lat: 41.8719, lng: 12.5674 },
    'malta': { lat: 35.9375, lng: 14.3754 },
    'cyprus': { lat: 35.1264, lng: 33.4299 },
    'greece': { lat: 39.0742, lng: 21.8243 },
    'albania': { lat: 41.1533, lng: 20.1683 },
    'north macedonia': { lat: 41.6086, lng: 21.7453 },
    'bulgaria': { lat: 42.7339, lng: 25.4858 },
    'romania': { lat: 45.9432, lng: 24.9668 },
    'moldova': { lat: 47.4116, lng: 28.3699 },
    'ukraine': { lat: 48.3794, lng: 31.1656 },
    'belarus': { lat: 53.7098, lng: 27.9534 },
    'lithuania': { lat: 55.1694, lng: 23.8813 },
    'latvia': { lat: 56.8796, lng: 24.6032 },
    'estonia': { lat: 58.5953, lng: 25.0136 },
    'poland': { lat: 51.9194, lng: 19.1451 },
    'czech republic': { lat: 49.8175, lng: 15.4730 },
    'slovakia': { lat: 48.6690, lng: 19.6990 },
    'hungary': { lat: 47.1625, lng: 19.5033 },
    'slovenia': { lat: 46.1512, lng: 14.9955 },
    'austria': { lat: 47.5162, lng: 14.5501 },
    'switzerland': { lat: 46.8182, lng: 8.2275 },
    'liechtenstein': { lat: 47.1660, lng: 9.5554 },
    'germany': { lat: 51.1657, lng: 10.4515 },
    'luxembourg': { lat: 49.8153, lng: 6.1296 },
    'belgium': { lat: 50.5039, lng: 4.4699 },
    'netherlands': { lat: 52.1326, lng: 5.2913 },
    'denmark': { lat: 56.2639, lng: 9.5018 },
    'sweden': { lat: 60.1282, lng: 18.6435 },
    'norway': { lat: 60.4720, lng: 8.4689 },
    'finland': { lat: 61.9241, lng: 25.7482 },
    'iceland': { lat: 64.9631, lng: -19.0208 },
    'ireland': { lat: 53.4129, lng: -8.2439 },
    'united kingdom': { lat: 55.3781, lng: -3.4360 },
    'france': { lat: 46.2276, lng: 2.2137 },
    'spain': { lat: 40.4637, lng: -3.7492 },
    'portugal': { lat: 39.3999, lng: -8.2245 },
    'italy': { lat: 41.8719, lng: 12.5674 },
    'malta': { lat: 35.9375, lng: 14.3754 },
    'cyprus': { lat: 35.1264, lng: 33.4299 },
    'greece': { lat: 39.0742, lng: 21.8243 }
  };

  const name = name.toLowerCase();
  for (const [pattern, coords] of Object.entries(patterns)) {
    if (name.includes(pattern)) {
      return coords;
    }
  }

  // Default to a random location if no pattern matches
  return {
    lat: 20 + Math.random() * 40, // Between 20-60 degrees
    lng: -180 + Math.random() * 360 // Between -180 to 180 degrees
  };
}