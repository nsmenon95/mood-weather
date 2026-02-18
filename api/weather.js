export default async function handler(req, res) {
  const { city, lat, lon, type, q } = req.query;
  const key = process.env.OPENWEATHER_API_KEY;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let url = "";

    // 1️⃣ Autocomplete — Geocoding API
    if (q) {
      url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${key}`;
      const apiRes = await fetch(url);
      const data = await apiRes.json();
      return res.status(200).json(data); // returns array, no cod check needed
    }

    // 2️⃣ City weather
    else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`;
    }

    // 3️⃣ Coordinate weather
    else if (lat && lon && !type) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    }

    // 4️⃣ Forecast
    else if (lat && lon && type === "forecast") {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    }

    else {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const apiRes = await fetch(url);
    const data = await apiRes.json();

    // OpenWeather returns cod as number or string depending on endpoint
    const cod = Number(data.cod);
    if (!isNaN(cod) && cod !== 200) {
      return res.status(cod === 404 ? 404 : 400).json({ message: data.message });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}