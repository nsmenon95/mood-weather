export default async function handler(req, res) {
    const { city, lat, lon, type } = req.query;
    const key = process.env.OPENWEATHER_API_KEY;
    
    let url = `https://api.openweathermap.org/data/2.5/weather?appid=${key}&units=metric`;
    
    if (type === 'forecast') {
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    } else if (lat && lon) {
        url += `&lat=${lat}&lon=${lon}`;
    } else {
        url += `&q=${city}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
}