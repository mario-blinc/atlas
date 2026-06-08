module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const city = req.query.city || 'London';
  try {
    const r = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await r.json();
    const current = data.current_condition?.[0];
    res.json({
      city,
      temp_c: current?.temp_C,
      feels_like_c: current?.FeelsLikeC,
      description: current?.weatherDesc?.[0]?.value,
      humidity: current?.humidity,
      wind_kmph: current?.windspeedKmph,
    });
  } catch {
    res.status(500).json({ error: 'Weather unavailable' });
  }
};
