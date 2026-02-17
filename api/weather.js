// api/weather.js
export default async function handler(request, response) {
  const { city, lat, lon, type } = request.query;
  const API_KEY = process.env.OPENWEATHER_API_KEY; // Hidden on Vercel

  let url = '';
  if (type === 'forecast') {
    url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  } else if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  } else {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
  }

  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: "Failed to fetch weather" });
  }
}