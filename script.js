/* ---------------- CONFIG ---------------- */

const API_URL = "https://api.openweathermap.org/data/2.5/weather";


/* ---------------- DOM ---------------- */

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
    body: document.body
};


/* ---------------- MOOD MAP ---------------- */

const moodMap = {
    Clear: { gradient: 'from-yellow-400 via-orange-500 to-red-500', message: "Sun's out, shades on! Time for an iced coffee." },
    Clouds: { gradient: 'from-gray-300 via-gray-400 to-gray-500', message: "A bit gray today. Perfect for a walk and lo-fi beats." },
    Rain: { gradient: 'from-blue-700 via-blue-800 to-gray-900', message: "Perfect weather for a cozy book and tea." },
    Snow: { gradient: 'from-blue-100 via-blue-200 to-white', message: "Bundle up! It's a winter wonderland." },
    Thunderstorm: { gradient: 'from-gray-900 via-purple-900 to-black', message: "Stay inside and watch lightning show." },
    Drizzle: { gradient: 'from-blue-300 via-blue-400 to-blue-500', message: "Light sprinkle. Fresh air day." },
    Mist: { gradient: 'from-gray-200 via-gray-300 to-gray-400', message: "Low visibility — travel safe." },
    Default: { gradient: 'from-blue-400 to-indigo-600', message: "Search a city to discover its mood." }
};


/* ---------------- NETWORK CORE ---------------- */

/**
 * Safe fetch:
 * Handles HTML responses, Vercel errors, invalid JSON, backend errors
 */
async function safeFetch(url) {

    const res = await fetch(url);

    const text = await res.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Weather service temporarily unavailable");
    }

    if (!res.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}


/* ---------------- WEATHER API ---------------- */

async function getWeatherByCity(city) {
    if (!city.trim()) throw new Error("Enter a city name");
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
        return []; // forecast failure should never break UI
    }
}


/* ---------------- UI ---------------- */

function setLoading(state) {
    el.loader.classList.toggle('hidden', !state);
    el.searchBtn.disabled = state;
    el.locateBtn.disabled = state;
}

function applyMood(weatherMain) {
    const mood = moodMap[weatherMain] || moodMap.Default;

    el.moodMessage.textContent = mood.message;
    el.body.className = `min-h-screen flex items-center justify-center transition-all duration-1000 bg-gradient-to-br p-4 ${mood.gradient}`;
}

function renderCurrent(data) {
    el.cityName.textContent = `${data.name}, ${data.sys.country}`;
    el.temp.textContent = `${Math.round(data.main.temp)}°`;
    el.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

    applyMood(data.weather[0].main);
}

function renderForecast(list) {

    el.forecast.innerHTML = '';

    const days = list
        .filter(i => i.dt_txt.includes("12:00:00"))
        .slice(0, 5);

    for (const day of days) {

        const dayName = new Date(day.dt * 1000)
            .toLocaleDateString('en-US', { weekday: 'short' });

        const card = document.createElement('div');
        card.className = "flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/5 shadow-sm";

        card.innerHTML = `
            <span class="text-xs opacity-80">${dayName}</span>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" class="w-8 h-8">
            <span class="text-sm font-bold">${Math.round(day.main.temp)}°</span>
        `;

        el.forecast.appendChild(card);
    }
}


/* ---------------- CONTROLLERS ---------------- */

async function searchCity(city) {

    try {
        setLoading(true);

        const data = await getWeatherByCity(city);
        renderCurrent(data);

        const forecast = await getForecast(data.coord.lat, data.coord.lon);
        renderForecast(forecast);

    } catch (err) {
        alert(err.message);
    } finally {
        setLoading(false);
    }
}

async function locateUser() {

    if (!navigator.geolocation)
        return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(async (pos) => {

        try {
            setLoading(true);

            const data = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
            renderCurrent(data);

            const forecast = await getForecast(data.coord.lat, data.coord.lon);
            renderForecast(forecast);

        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    });
}


/* ---------------- EVENTS ---------------- */

el.searchBtn.addEventListener('click', () => searchCity(el.cityInput.value));

el.cityInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchCity(el.cityInput.value);
});

el.locateBtn.addEventListener('click', locateUser);
