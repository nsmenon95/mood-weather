/* ============================================================
   CONFIG
   ============================================================ */
const API_URL = "https://mood-weather-eta.vercel.app/api/weather";


/* ============================================================
   DOM REFERENCES
   ============================================================ */
const el = {
  cityInput:    document.getElementById('city-input'),
  searchBtn:    document.getElementById('search-btn'),
  locateBtn:    document.getElementById('locate-btn'),
  loader:       document.getElementById('loader'),
  weatherIcon:  document.getElementById('weather-icon'),
  temp:         document.getElementById('temp'),
  cityName:     document.getElementById('city-name'),
  moodMessage:  document.getElementById('mood-message'),
  forecast:     document.getElementById('forecast-container'),
  body:         document.body
};


/* ============================================================
   MOOD MAP
   ============================================================ */
const moodMap = {
  Clear:       { gradient: 'from-yellow-400 via-orange-500 to-red-500',    message: "Sun's out, shades on! Time for an iced coffee."    },
  Clouds:      { gradient: 'from-gray-300 via-gray-400 to-gray-500',       message: "A bit gray today. Perfect for a walk and lo-fi beats." },
  Rain:        { gradient: 'from-blue-700 via-blue-800 to-gray-900',       message: "Perfect weather for a cozy book and tea."           },
  Snow:        { gradient: 'from-blue-100 via-blue-200 to-white',          message: "Bundle up! It's a winter wonderland."              },
  Thunderstorm:{ gradient: 'from-gray-900 via-purple-900 to-black',        message: "Stay inside and watch the lightning show."         },
  Drizzle:     { gradient: 'from-blue-300 via-blue-400 to-blue-500',       message: "Light sprinkle. Fresh air day."                   },
  Mist:        { gradient: 'from-gray-200 via-gray-300 to-gray-400',       message: "Low visibility — travel safe."                    },
  Haze:        { gradient: 'from-yellow-100 via-gray-300 to-gray-400',     message: "Hazy skies today. Stay hydrated."                 },
  Default:     { gradient: 'from-blue-400 to-indigo-600',                  message: "Search a city to discover its mood."              }
};


/* ============================================================
   AUTOCOMPLETE STATE
   ============================================================ */
let autocompleteDebounce = null;   // debounce timer
let selectedFromDropdown = false;  // flag: user clicked a suggestion


/* ============================================================
   NETWORK HELPERS
   ============================================================ */

/**
 * Centralised fetch:
 * - Always reads body as text first to avoid JSON parse crashes
 * - Throws a clean Error with the backend's message
 */
async function safeFetch(url) {
  const res  = await fetch(url);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Weather service temporarily unavailable");
  }

  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}


/* ============================================================
   WEATHER API CALLS
   ============================================================ */

async function getWeatherByCity(city) {
  if (!city.trim()) throw new Error("Please enter a city name");
  return safeFetch(`${API_URL}?city=${encodeURIComponent(city)}`);
}

async function getWeatherByCoords(lat, lon) {
  return safeFetch(`${API_URL}?lat=${lat}&lon=${lon}`);
}

async function getForecast(lat, lon) {
  try {
    const data = await safeFetch(`${API_URL}?type=forecast&lat=${lat}&lon=${lon}`);
    return data.list || [];
  } catch {
    return []; // forecast failure must never break the UI
  }
}

/**
 * Geocoding autocomplete
 * Returns array: [{ name, country, state, 