// 1. Setup your Vercel URL
const VERCEL_API_URL = 'https://mood-weather.vercel.app/api/weather';

// 2. DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherIcon = document.getElementById('weather-icon');
const tempEl = document.getElementById('temp');
const cityNameEl = document.getElementById('city-name');
const moodMessageEl = document.getElementById('mood-message');
const moodContainer = document.getElementById('mood-container');
const loader = document.getElementById('loader');
const locateBtn = document.getElementById('locate-btn');
const suggestionsBox = document.getElementById('suggestions');
const forecastContainer = document.getElementById('forecast-container');
const body = document.body;

// 3. Mood Mapping
const moodMap = {
    Clear: { gradient: 'from-yellow-400 via-orange-500 to-red-500', message: "Sun's out, shades on! Time for an iced coffee.", icon: "☀️" },
    Clouds: { gradient: 'from-gray-300 via-gray-400 to-gray-500', message: "A bit gray today. Perfect for a walk and some lo-fi beats.", icon: "☁️" },
    Rain: { gradient: 'from-blue-700 via-blue-800 to-gray-900', message: "Perfect weather for a cozy book and tea.", icon: "🌧️" },
    Snow: { gradient: 'from-blue-100 via-blue-200 to-white', message: "Bundle up! It's a winter wonderland out there.", icon: "❄️" },
    Thunderstorm: { gradient: 'from-gray-900 via-purple-900 to-black', message: "Stay inside and watch the lightning show.", icon: "⚡" },
    Drizzle: { gradient: 'from-blue-300 via-blue-400 to-blue-500', message: "Just a light sprinkle, enjoy the freshness.", icon: "🌦️" },
    Mist: { gradient: 'from-gray-200 via-gray-300 to-gray-400', message: "Visibility is low, drive safe!", icon: "🌫️" },
    Default: { gradient: 'from-blue-400 to-indigo-600', message: "Enter a city to find its mood.", icon: "🌍" }
};

// 4. API Functions (Calling Vercel)
async function fetchWeather(city) {
    try {
        loader.classList.remove('hidden');
        const response = await fetch(`${VERCEL_API_URL}?city=${encodeURIComponent(city)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'City not found');
        updateUI(data);
    } catch (error) {
        alert(error.message);
    } finally {
        loader.classList.add('hidden');
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        loader.classList.remove('hidden');
        const response = await fetch(`${VERCEL_API_URL}?lat=${lat}&lon=${lon}`);
        const data = await response.json();
        if (!response.ok) throw new Error('Location not found');
        updateUI(data);
    } catch (error) {
        alert(error.message);
    } finally {
        loader.classList.add('hidden');
    }
}

async function fetchForecast(lat, lon) {
    try {
        const response = await fetch(`${VERCEL_API_URL}?type=forecast&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        renderForecast(data.list);
    } catch (error) {
        console.error("Forecast error:", error);
    }
}

// 5. UI Functions
function updateUI(data) {
    cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    tempEl.textContent = `${Math.round(data.main.temp)}°`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    updateMood(data.weather[0].main);
    fetchForecast(data.coord.lat, data.coord.lon);
}

function renderForecast(list) {
    forecastContainer.innerHTML = '';
    const dailyData = list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);
    
    dailyData.forEach(day => {
        const dayName = new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        const card = document.createElement('div');
        card.className = "flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/5 shadow-sm";
        card.innerHTML = `
            <span class="text-xs font-medium opacity-80">${dayName}</span>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" class="w-8 h-8">
            <span class="text-sm font-bold">${Math.round(day.main.temp)}°</span>
        `;
        forecastContainer.appendChild(card);
    });
}

function updateMood(weatherMain) {
    const mood = moodMap[weatherMain] || moodMap.Default;
    moodMessageEl.textContent = mood.message;
    body.className = `min-h-screen flex items-center justify-center transition-all duration-1000 bg-gradient-to-br p-4 ${mood.gradient}`;
}

// 6. Event Listeners
searchBtn.addEventListener('click', () => {
    if (cityInput.value) fetchWeather(cityInput.value);
});

locateBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        });
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && cityInput.value) fetchWeather(cityInput.value);
});