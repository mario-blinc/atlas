import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const weatherIcon = (desc = '') => {
  const d = desc.toLowerCase();
  if (d.includes('sunny') || d.includes('clear')) return '☀️';
  if (d.includes('cloud') && (d.includes('sun') || d.includes('part'))) return '⛅';
  if (d.includes('overcast') || d.includes('cloud')) return '☁️';
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return '🌧️';
  if (d.includes('thunder') || d.includes('storm')) return '⛈️';
  if (d.includes('snow') || d.includes('sleet')) return '❄️';
  if (d.includes('fog') || d.includes('mist')) return '🌫️';
  return '🌤️';
};

export default function WeatherCard({ delay = 0 }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/weather?city=London')
      .then(r => r.json())
      .then(d => { setWeather(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', height: '100%',
      }}
    >
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
        London, UK
      </div>

      {loading ? (
        <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 1.5, repeat: Infinity }}
          style={{ height: 40, width: '70%', background: 'var(--border-bright)', borderRadius: 4 }} />
      ) : !weather || weather.error ? (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>Unavailable</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{weatherIcon(weather.description)}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1 }}>
                {weather.temp_c}°<span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>C</span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>
                {weather.description}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>💧 {weather.humidity}%</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>💨 {weather.wind_kmph}km/h</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
