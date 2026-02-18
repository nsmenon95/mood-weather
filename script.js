/* ---------------- CONFIG ---------------- */
const API_URL = "https://mood-weather.vercel.app/api/weather";

const el = {
    cityInput: document.getElementById('city-input'),
    searchBtn: document.getElementById('search-btn'),
    locateBtn: document.getElementById('locate-btn'),
    loader: document.getElementById('loader'),
    weatherIcon: document.getElementById('weather-icon'),
    temp: document.getElementById('temp'),
    cityName: document.getElementById('city-name'),
    moodMessage: document.getElementById('mood-message'),
    forecast: document.getElementById('forecast-container'),
    suggestions: document.getElementById('suggestions'), // Ensure this ID exists in HTML
    body: document.body
};

/* ---------------- HELPERS ---------------- */
// Prevents API spam by waiting until user stops typing
const debounce = (func, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
};

async function safeFetch(url) {
    const res = await fetch(url);
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Service temporarily unavailable");
    }
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

/* ---------------- WEATHER LOGIC ---------------- */
async function searchCity(city) {
    try {
        setLoading(true);
        const data = await safeFetch(`${API_URL}?city=${encodeURIComponent(city)}`);
        updateUI(data);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
}

async function fetchByCoords(lat, lon) {
    try {
        setLoading(true);
        const data = await safeFetch(`${API_URL}?lat=${lat}&lon=${lon}`);
        updateUI(data);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
}

async function updateUI(data) {
    el.cityName.textContent = `${data.name}, ${data.sys.country}`;
    el.temp.textContent = `${Math.round(data.main.temp)}°`;
    el.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    
    // Update Mood
    const mood = moodMap[data.weather[0].main] || moodMap.Default;
    el.moodMessage.textContent = mood.message;
    el.body.className = `min-h-screen flex items-center justify-center transition-all duration-1000 bg-gradient-to-br p-4 ${mood.gradient}`;

    // Fetch Forecast
    const forecastData = await safeFetch(`${API_URL}?type=forecast&lat=${data.coord.lat}&lon=${data.coord.lon}`);
    renderForecast(forecastData.list);
}

/* ---------------- SUGGESTIONS ---------------- */
const handleInput = debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length < 3) {
        el.suggestions.classList.add('hidden');
        return;
    }
    try {
        const cities = await safeFetch(`${API_URL}?type=suggest&q=${encodeURIComponent(query)}`);
        renderSuggestions(cities);
    } catch (err) { console.error("Suggestion error:", err); }
}, 500);

function renderSuggestions(cities) {
    el.suggestions.innerHTML = '';
    if (!cities.length) return el.suggestions.classList.add('hidden');

    cities.forEach(city => {
        const li = document.createElement('li');
        li.className = "px-4 py-2 hover:bg-white/20 cursor-pointer border-b border-white/10 text-white";
        li.innerHTML = `<strong>${city.name}</strong>, ${city.country}`;
        li.onclick = () => {
            el.cityInput.value = city.name;
            el.suggestions.classList.add('hidden');
            searchCity(city.name);
        };
        el.suggestions.appendChild(li);
    });
    el.suggestions.classList.remove('hidden');
}

/* ---------------- INITIALIZATION ---------------- */
function setLoading(state) {
    el.loader.classList.toggle('hidden', !state);
}

// Auto-load on startup
window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
            () => searchCity("Chennai") // Default city if location denied
        );
    } else {
        searchCity("Chennai");
    }
});

/* ---------------- EVENTS ---------------- */
el.searchBtn.addEventListener('click', () => searchCity(el.cityInput.value));
el.cityInput.addEventListener('input', handleInput);
el.locateBtn.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(pos => fetchByCoords(pos.coords.latitude, pos.coords.longitude));
});