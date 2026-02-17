export default async function handler(request, response) {
  const { city, lat, lon, type } = request.query;
  const key = process.env.OPENWEATHER_API_KEY;

  // Add CORS headers so your GitHub Pages can talk to Vercel
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET');

  let url = `https://api.openweathermap.org/data/2.5/weather?appid=${key}&units=metric`;

  if (type === 'forecast') {
    url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
  } else if (lat && lon) {
    url += `&lat=${lat}&lon=${lon}`;
  } else {
    url += `&q=${city}`;
  }

  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: "Backend failed to fetch" });
  }
}