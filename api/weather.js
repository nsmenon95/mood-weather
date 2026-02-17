export default async function handler(req, res) {
  const { city } = req.query;
  const key = process.env.OPENWEATHER_API_KEY;

  // This header allows your frontend to talk to this backend
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const apiRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=metric`);
    const data = await apiRes.json();
    
    // This tells the browser: "I am sending JSON, not a webpage!"
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}