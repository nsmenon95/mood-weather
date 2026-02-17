export default async function handler(req, res) {
  const { city, lat, lon, type } = req.query;
  const key = process.env.OPENWEATHER_API_KEY;

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {

    let url = "";

    // 1️⃣ City weather
    if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=metric`;
    }

    // 2️⃣ Coordinate weather
    else if (lat && lon && !type) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    }

    // 3️⃣ Forecast
    else if (lat && lon && type === "forecast") {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    }

    else {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const apiRes = await fetch(url);
    const data = await apiRes.json();

    // 🔴 Handle OpenWeather errors properly
    if (data.cod != 200 && data.cod != "200") {
      return res.status(404).json({ message: data.message });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
