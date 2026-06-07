import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const weatherIcon = (desc = '') => {
  const d = desc.toLowerCase();
  if (d.includes('sunny') || d.includes('clear')) return '☀️';
  if (d.includes('cloud') && d.includes('sun')) return '⛅';
  if (d.includes('cloud') || d.includes('overcast')) return '☁️';
  if (d.includes('rain') || d.includes('drizzle')) return '🌧️';
  if (d.includes('thunder') || d.includes('storm')) return '⛈️';
  if (d.includes('snow')) return '❄️';
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        position: 'relative',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
        London, UK
      </div>

      {loading ? (
        <motion.div animate={{ opacity: [0.3,0.6,0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
          style={{ height: 40, width: '60%', background: 'var(--border)', borderRadius: 4 }} />
      ) : !weather || weather.error ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>Unavailable</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>{weatherIcon(weather.description)}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {weather.temp_c}°
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                Feels {weather.feels_like_c}°
              </div>
            </div>
          </div>

          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
            {weather.description}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>
              💧 {weather.humidity}%
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>
              💨 {weather.wind_kmph}km/h
            </div>
          </div>

          {weather.forecast?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              {weather.forecast.slice(0, 3).map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', marginBottom: 3 }}>
                    {new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 14 }}>{weatherIcon(d.description)}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {d.max_c}° / {d.min_c}°
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
