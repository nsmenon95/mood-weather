/* ============================================================
   CONFIG
   ============================================================ */
const API_URL = "https://mood-weather-eta.vercel.app/api/weather";


/* ============================================================
   DOM REFERENCES
   ============================================================ */
const el = {
  cityInput:   document.getElementById('city-input'),
  searchBtn:   document.getElementById('search-btn'),
  locateBtn:   document.getElementById('locate-btn'),
  loader:      document.getElementById('loader'),
  weatherIcon: document.getElementById('weather-icon'),
  temp:        document.getElementById('temp'),
  cityName:    document.getElementById('city-name'),
  moodMessage: document.getElementById('mood-message'),
  forecast:    document.getElementById('forecast-container'),
  body:        document.body
};


/* ============================================================
   USER LOCATION CACHE
   Stored as soon as we have coords (page load or locate button)
   Used to sort autocomplete suggestions by proximity
   ============================================================ */
let userCoords = null; // { lat, lon } | null


/* ============================================================
   MOOD MAP
   ============================================================ */
const moodMap = {
  Clear:        { gradient: 'from-yellow-400 via-orange-500 to-red-500',  message: "Sun's out, shades on! Time for an iced coffee."      },
  Clouds:       { gradient: 'from-gray-300 via-gray-400 to-gray-500',     message: "A bit gray today. Perfect for a walk and lo-fi beats." },
  Rain:         { gradient: 'from-blue-700 via-blue-800 to-gray-900',     message: "Perfect weather for a cozy book and tea."             },
  Snow:         { gradient: 'from-blue-100 via-blue-200 to-white',        message: "Bundle up! It's a winter wonderland."                },
  Thunderstorm: { gradient: 'from-gray-900 via-purple-900 to-black',      message: "Stay inside and watch the lightning show."           },
  Drizzle:      { gradient: 'from-blue-300 via-blue-400 to-blue-500',     message: "Light sprinkle. Fresh air day."                     },
  Mist:         { gradient: 'from-gray-200 via-gray-300 to-gray-400',     message: "Low visibility — travel safe."                      },
  Haze:         { gradient: 'from-yellow-100 via-gray-300 to-gray-400',   message: "Hazy skies today. Stay hydrated."                   },
  Default:      { gradient: 'from-blue-400 to-indigo-600',                message: "Search a city to discover its mood."                }
};


/* ============================================================
   AUTOCOMPLETE STATE
   ============================================================ */
let autocompleteDebounce = null;  // debounce timer handle
let selectedFromDropdown  = false; // flag: user clicked a suggestion


/* ============================================================
   HAVERSINE DISTANCE
   Returns distance in kilometres between two lat/lon points.
   Formula: https://en.wikipedia.org/wiki/Haversine_formula
   ============================================================ */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;                          // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}


/* ============================================================
   NETWORK HELPERS
   ============================================================ */

/**
 * Centralised fetch:
 * Always reads body as text first to avoid JSON parse crashes.
 * Throws a clean Error with the backend's message.
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
 * Geocoding autocomplete — returns raw array from backend
 * [{ name, country, state, lat, lon }, ...]
 */
async function getCitySuggestions(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const data = await safeFetch(`${API_URL}?q=${encodeURIComponent(query.trim())}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}


/* ============================================================
   SORT SUGGESTIONS BY PROXIMITY
   If we have userCoords, attach a `distanceKm` to each result
   and sort ascending. Falls back to API order if no coords.
   ============================================================ */
function sortByProximity(suggestions) {
  if (!userCoords) return suggestions; // no coords yet → keep API order

  return suggestions
    .map(place => ({
      ...place,
      distanceKm: haversineKm(
        userCoords.lat, userCoords.lon,
        place.lat,      place.lon
      )
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}


/* ============================================================
   UI HELPERS
   ============================================================ */

function setLoading(state) {
  el.loader.classList.toggle('hidden', !state);
  el.searchBtn.disabled = state;
  el.locateBtn.disabled = state;
}

function applyMood(weatherMain) {
  const mood = moodMap[weatherMain] || moodMap.Default;
  el.moodMessage.textContent = mood.message;
  el.body.className =
    `min-h-screen flex items-center justify-center transition-all duration-1000 bg-gradient-to-br p-4 ${mood.gradient}`;
}

function renderCurrent(data) {
  el.cityName.textContent = `${data.name}, ${data.sys.country}`;
  el.temp.textContent     = `${Math.round(data.main.temp)}°`;
  el.weatherIcon.src      = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
  applyMood(data.weather[0].main);
}

function renderForecast(list) {
  el.forecast.innerHTML = '';

  const days = list
    .filter(i => i.dt_txt.includes("12:00:00"))
    .slice(0, 5);

  days.forEach(day => {
    const dayName = new Date(day.dt * 1000)
      .toLocaleDateString('en-US', { weekday: 'short' });

    const card = document.createElement('div');
    card.className =
      "flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/5 shadow-sm";

    card.innerHTML = `
      <span class="text-xs opacity-80">${dayName}</span>
      <img
        src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png"
        alt="${day.weather[0].description}"
        class="w-8 h-8"
      >
      <span class="text-sm font-bold">${Math.round(day.main.temp)}°</span>
    `;

    el.forecast.appendChild(card);
  });
}


/* ============================================================
   AUTOCOMPLETE UI
   ============================================================ */

function getOrCreateDropdown() {
  let dropdown = document.getElementById('autocomplete-dropdown');

  if (!dropdown) {
    dropdown = document.createElement('ul');
    dropdown.id        = 'autocomplete-dropdown';
    dropdown.className = [
      'absolute', 'z-50', 'w-full', 'mt-1',
      'bg-white', 'text-gray-800',
      'rounded-xl', 'shadow-xl',
      'overflow-hidden',
      'border', 'border-gray-100',
      'max-h-60', 'overflow-y-auto'
    ].join(' ');

    const wrapper = el.cityInput.parentElement;
    if (getComputedStyle(wrapper).position === 'static') {
      wrapper.style.position = 'relative';
    }

    wrapper.appendChild(dropdown);
  }

  return dropdown;
}

function closeDropdown() {
  const dropdown = document.getElementById('autocomplete-dropdown');
  if (dropdown) dropdown.innerHTML = '';
}

/**
 * Renders sorted suggestion list.
 * Shows a small distance badge when userCoords is available.
 */
function renderSuggestions(suggestions) {
  const dropdown = getOrCreateDropdown();
  dropdown.innerHTML = '';

  if (!suggestions.length) {
    closeDropdown();
    return;
  }

  // Sort nearest first if we have user location
  const sorted = sortByProximity(suggestions);

  sorted.forEach(place => {
    const label = [place.name, place.state, place.country]
      .filter(Boolean)
      .join(', ');

    // Distance badge — only shown when we have user location
    const distanceBadge = (userCoords && place.distanceKm !== undefined)
      ? buildDistanceBadge(place.distanceKm)
      : '';

    const li = document.createElement('li');
    li.className = [
      'flex', 'items-center', 'justify-between',
      'px-4', 'py-2',
      'cursor-pointer',
      'hover:bg-blue-50',
      'text-sm',
      'transition-colors', 'duration-100',
      'border-b', 'border-gray-50', 'last:border-0'
    ].join(' ');

    li.innerHTML = `
      <span class="truncate">${label}</span>
      ${distanceBadge}
    `;

    // mousedown fires before blur → value is read before focus is lost
    li.addEventListener('mousedown', (e) => {
      e.preventDefault();              // prevent input blur
      selectedFromDropdown = true;
      el.cityInput.value   = label;
      closeDropdown();
      searchCity(label);
    });

    dropdown.appendChild(li);
  });
}

/**
 * Returns a small styled distance pill string.
 * e.g.  "2.4 km"  or  "1,203 km"
 */
function buildDistanceBadge(km) {
  const formatted = km < 10
    ? km.toFixed(1)                          // "2.4"
    : Math.round(km).toLocaleString();       // "1,203"

  return `
    <span class="
      ml-2 shrink-0
      text-xs font-medium
      text-blue-500
      bg-blue-50
      px-2 py-0.5
      rounded-full
    ">
      ${formatted} km
    </span>
  `;
}

/**
 * Debounced input handler — waits 300 ms after user stops typing.
 */
function handleAutocompleteInput() {
  clearTimeout(autocompleteDebounce);

  const query = el.cityInput.value.trim();

  if (query.length < 2) {
    closeDropdown();
    return;
  }

  autocompleteDebounce = setTimeout(async () => {
    const suggestions = await getCitySuggestions(query);
    renderSuggestions(suggestions);
  }, 300);
}


/* ============================================================
   CONTROLLERS
   ============================================================ */

async function searchCity(city) {
  try {
    setLoading(true);
    closeDropdown();

    const data     = await getWeatherByCity(city);
    renderCurrent(data);

    const forecast = await getForecast(data.coord.lat, data.coord.lon);
    renderForecast(forecast);

  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
}

async function loadByCoords(lat, lon) {
  try {
    setLoading(true);

    // ✅ Cache coords for proximity sorting
    userCoords = { lat, lon };

    const data     = await getWeatherByCoords(lat, lon);
    renderCurrent(data);

    el.cityInput.value = `${data.name}, ${data.sys.country}`;

    const forecast = await getForecast(data.coord.lat, data.coord.lon);
    renderForecast(forecast);

  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
}

/**
 * Requests geolocation and loads local weather.
 * `silent = true` → no alert on denial (used for auto-load on page start).
 */
function locateUser(silent = false) {
  if (!navigator.geolocation) {
    if (!silent) alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      // Cache coords immediately — before the weather loads —
      // so autocomplete can use them even if the API call is slow
      userCoords = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      };
      loadByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      if (!silent) alert("Unable to get your location. Please search manually.");
      console.warn("Geolocation error:", err.message);
    },
    { timeout: 10000 }
  );
}


/* ============================================================
   AUTO-LOAD ON PAGE START
   ============================================================ */

function initAutoLocation() {
  if (!navigator.geolocation) return;

  if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'granted' || result.state === 'prompt') {
        locateUser(true);
      }
      // 'denied' → do nothing, let user search manually
    });
  } else {
    locateUser(true); // Permissions API unavailable → just try
  }
}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

el.searchBtn.addEventListener('click', () => {
  const city = el.cityInput.value.trim();
  if (city) searchCity(city);
});

el.cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = el.cityInput.value.trim();
    if (city) {
      closeDropdown();
      searchCity(city);
    }
  }
  if (e.key === 'Escape') closeDropdown();
});

el.cityInput.addEventListener('input', handleAutocompleteInput);

el.cityInput.addEventListener('blur', () => {
  setTimeout(() => {
    if (!selectedFromDropdown) closeDropdown();
    selectedFromDropdown = false;
  }, 150);
});

el.locateBtn.addEventListener('click', () => locateUser(false));


/* ============================================================
   INIT
   ============================================================ */
initAutoLocation();