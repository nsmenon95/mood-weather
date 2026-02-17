export default async function handler(request, response) {
  const { city } = request.query;
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
  const data = await res.json();

  // This line is key! It tells the browser "I am sending DATA, not a webpage."
  return response.status(200).json(data); 
}