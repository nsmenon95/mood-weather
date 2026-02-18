export default async function handler(req, res) {
  const { city, lat, lon, type, q } = req.query;
  const key = process.env.OPENWEATHER_API_KEY;

  // Allow your GitHub Pages frontend to communicate with this Vercel backend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    let url = "";

    // 1️⃣ Mode: Suggestions (Geocoding)
    if (type === "suggest") {
      url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${key}`;
    } 
    // 2️⃣ Mode: 5-Day Forecast
    else if (type === "forecast") {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    } 
    // 3️⃣ Mode: Weather by Coordinates
    else if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    } 
    // 4️⃣ Mode: Weather by City Name
    else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`;
    } 
    else {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const apiRes = await fetch(url);
    const data = await apiRes.json();

    // Standard OpenWeather error handling
    if (data.cod && data.cod != 200 && data.cod != "200") {
      return res.status(404).json({ message: data.message });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ message: "Backend error" });
  }
}