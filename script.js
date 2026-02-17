const API_KEY = 'Replaced_by_env_variable'; // Replace with a valid key for testing
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherIcon = document.getElementById('weather-icon');
const tempEl = document.getElementById('temp');
const cityNameEl = document.getElementById('city-name');
const moodMessageEl = document.getElementById('mood-message');
const moodContainer = document.getElementById('mood-container');
const loader = document.getElementById('loader');
const body = document.body;

// Map weather conditions to gradients and messages
const moodMap = {
    Clear: {
        gradient: 'from-yellow-400 via-orange-500 to-red-500',
        message: "Sun's out, shades on! Time for an iced coffee.",
        icon: "☀️"
    },
    Clouds: {
        gradient: 'from-gray-300 via-gray-400 to-gray-500',
        message: "A bit gray today. Perfect for a walk and some lo-fi beats.",
        icon: "☁️"
    },
    Rain: {
        gradient: 'from-blue-700 via-blue-800 to-gray-900',
        message: "Perfect weather for a cozy book and tea.",
        icon: "🌧️"
    },
    Snow: {
        gradient: 'from-blue-100 via-blue-200 to-white',
        message: "Bundle up! It's a winter wonderland out there.",
        icon: "❄️"
    },
    Thunderstorm: {
        gradient: 'from-gray-900 via-purple-900 to-black',
        message: "Stay inside and watch the lightning show.",
        icon: "⚡"
    },
    Drizzle: {
        gradient: 'from-blue-300 via-blue-400 to-blue-500',
        message: "Just a light sprinkle, enjoy the freshness.",
        icon: "🌦️"
    },
    Mist: {
        gradient: 'from-gray-200 via-gray-300 to-gray-400',
        message: "Visibility is low, drive safe!",
        icon: "🌫️"
    },
    Smoke: {
        gradient: 'from-gray-500 via-gray-600 to-gray-700',
        message: "Hazy skies today.",
        icon: "🌫️"
    },
    Haze: {
        gradient: 'from-orange-200 via-orange-300 to-orange-400',
        message: "A bit hazy, but still bright!",
        icon: "😶‍🌫️"
    },
    Fog: {
        gradient: 'from-gray-300 via-gray-400 to-gray-500',
        message: "Ideally mysterious fog.",
        icon: "🌫️"
    }
};

const defaultMood = {
    gradient: 'from-blue-400 to-indigo-600',
    message: "Enter a city to find its mood.",
    icon: "🌍"
};

const locateBtn = document.getElementById('locate-btn');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value;
    if (city) fetchWeather(city);
});

locateBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        loader.classList.remove('hidden'); // Show loader immediately
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                loader.classList.add('hidden');
                console.error("Geolocation error:", error);
                alert("Unable to retrieve your location. Please check your browser permissions.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value;
        if (city) fetchWeather(city);
    }
});

async function fetchWeatherByCoords(lat, lon) {
    if (API_KEY === 'YOUR_KEY_HERE') {
        alert('Please replace "YOUR_KEY_HERE" in script.js with your valid OpenWeatherMap API key!');
        loader.classList.add('hidden');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);

        if (!response.ok) {
            throw new Error('Weather data not found');
        }

        const data = await response.json();
        updateUI(data);
        // Clean up input and suggestions
        cityInput.value = '';
        suggestionsBox.classList.add('hidden');
    } catch (error) {
        console.error(error);
        alert(error.message);
    } finally {
        loader.classList.add('hidden');
    }
}

async function fetchWeather(city) {
    if (API_KEY === 'YOUR_KEY_HERE') {
        alert('Please replace "YOUR_KEY_HERE" in script.js with your valid OpenWeatherMap API key!');
        return; // Stop execution without a key
    }

    try {
        loader.classList.remove('hidden');
        const response = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`);

        if (!response.ok) {
            throw new Error('City not found');
        }

        const data = await response.json();
        updateUI(data);
    } catch (error) {
        console.error(error);
        alert(error.message);
        // Optional: Reset to default state on error
        updateMood('Default');
    } finally {
        loader.classList.add('hidden');
    }
}

// ... existing code ...

const forecastContainer = document.getElementById('forecast-container');

function updateUI(data) {
    // Update Text Content
    cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    tempEl.textContent = `${Math.round(data.main.temp)}°`;

    // Update Icon
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    weatherIcon.alt = data.weather[0].description;

    // Update Mood
    const weatherMain = data.weather[0].main;
    updateMood(weatherMain);

    // Fetch Forecast
    fetchForecast(data.coord.lat, data.coord.lon);
}

// ... existing code ...

async function fetchForecast(lat, lon) {
    if (API_KEY === 'YOUR_KEY_HERE') return;

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error('Forecast data not found');

        const data = await response.json();
        renderForecast(data.list);
    } catch (error) {
        console.error("Error fetching forecast:", error);
    }
}

function renderForecast(list) {
    forecastContainer.innerHTML = '';

    // Filter for one reading per day (e.g., 12:00:00)
    // Create a map to ensure unique days
    const dailyForecast = [];
    const seenDays = new Set();

    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();

        // Prefer 12:00 reading, but just taking the first one for each new day is also a decent simple strategy if we sort out today.
        // Better: Find the reading closest to noon for each day.
        // Simple approach requested: filter by "12:00:00".

        if (item.dt_txt.includes("12:00:00")) {
            if (!seenDays.has(dayKey)) {
                dailyForecast.push(item);
                seenDays.add(dayKey);
            }
        }
    });

    // Fallback if we don't get 5 days (e.g. late night search might miss today's noon)
    // Just take the first 5 unique days if strict filtering yields too few?
    // Let's stick to the prompt's request for "12:00:00" for now, usually sufficient. 
    // If list is small, we can just slice.

    dailyForecast.slice(0, 5).forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const iconCode = day.weather[0].icon;
        const temp = Math.round(day.main.temp);

        const card = document.createElement('div');
        card.className = "flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/5 shadow-sm";
        card.innerHTML = `
            <span class="text-xs font-medium opacity-80">${dayName}</span>
            <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="icon" class="w-8 h-8 my-1">
            <span class="text-sm font-bold">${temp}°</span>
        `;
        forecastContainer.appendChild(card);
    });
}


function updateMood(weatherMain) {
    const mood = moodMap[weatherMain] || defaultMood;

    // Update Message with animation
    moodMessageEl.style.opacity = '0';
    setTimeout(() => {
        moodMessageEl.textContent = mood.message;
        moodMessageEl.style.opacity = '1';
    }, 300);

    // Update Gradient
    // Remove all possible gradient classes first to ensure clean switch
    // Note: This is a bit brute-force. A cleaner way is to store current gradient classes.
    body.className = `min-h-screen flex items-center justify-center transition-colors duration-1000 ease-in-out bg-gradient-to-br p-4 ${mood.gradient}`;
}

// Search Suggestions Logic
const suggestionsBox = document.getElementById('suggestions');

const debounce = (func, delay) => {
    let debounceTimer;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
}

const handleInput = debounce(() => {
    const query = cityInput.value;
    if (query.length > 2) {
        fetchSuggestions(query);
    } else {
        suggestionsBox.classList.add('hidden');
    }
}, 500);

cityInput.addEventListener('input', handleInput);

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.add('hidden');
    }
});

async function fetchSuggestions(query) {
    if (API_KEY === 'YOUR_KEY_HERE') return;

    try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
        if (!response.ok) return;
        const cities = await response.json();
        renderSuggestions(cities);
    } catch (error) {
        console.error("Error fetching suggestions:", error);
    }
}

function renderSuggestions(cities) {
    suggestionsBox.innerHTML = '';
    if (cities.length === 0) {
        suggestionsBox.classList.add('hidden');
        return;
    }

    cities.forEach(city => {
        const li = document.createElement('li');
        li.className = "px-6 py-3 hover:bg-white/20 cursor-pointer transition-colors border-b border-white/10 last:border-none";
        li.innerHTML = `<span class="font-semibold">${city.name}</span>, <span class="text-sm opacity-80">${city.country}</span>`;
        li.onclick = () => {
            cityInput.value = city.name;
            suggestionsBox.classList.add('hidden');
            fetchWeather(city.name);
        };
        suggestionsBox.appendChild(li);
    });

    suggestionsBox.classList.remove('hidden');
}
