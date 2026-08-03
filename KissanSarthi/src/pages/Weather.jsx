import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { COLORS } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Card } from "../components/common/Card";
import { Skeleton } from "../components/common/Skeleton";

const API_KEY = "0fdce38c46f04e69bed40425262606"; // New WeatherAPI.com Key

// Helper to map WeatherAPI condition text to our internal Icon names
const mapWeatherIcon = (conditionText, isDay = 1) => {
  if (!conditionText) return isDay ? "sunny" : "night";
  const t = conditionText.toLowerCase();
  
  if (t.includes("thunder") || t.includes("lightning")) return "thunder";
  if (t.includes("heavy rain") || t.includes("torrential")) return "hRain";
  if (t.includes("rain") || t.includes("drizzle") || t.includes("shower")) return "showers";
  if (t.includes("partly")) return "pCloudy";
  if (t.includes("cloud") || t.includes("overcast")) return "pCloudy";
  if (t.includes("snow") || t.includes("sleet") || t.includes("ice") || t.includes("blizzard")) return "pCloudy";
  if (t.includes("mist") || t.includes("fog")) return "pCloudy";
  if (t.includes("sunny") || t.includes("clear")) return isDay ? "sunny" : "night";
  
  return isDay ? "sunny" : "night";
};

// Map date string to short day name
const getDayName = (dateStr, isToday) => {
  if (isToday) return "Today";
  const date = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
};

const WeatherPage = () => {
  const { t } = useTranslation();
  const [city, setCity] = useState("Vadodara");
  const [searchCity, setSearchCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentWeather, setCurrentWeather] = useState({
    temp: 0,
    feelsLike: 0,
    wind: 0,
    desc: "Loading...",
    icon: "sunny"
  });
  
  const [dailyForecast, setDailyForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);

  const fetchWeatherData = async (location) => {
    setLoading(true);
    setError("");
    
    try {
      // Single API call for both current and 7-day forecast
      const response = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=7&aqi=no&alerts=no`
      );
      
      const data = response.data;
      
      // 1. Current Weather
      setCurrentWeather({
        temp: Math.round(data.current.temp_c),
        feelsLike: Math.round(data.current.feelslike_c),
        wind: Math.round(data.current.wind_kph),
        desc: data.current.condition.text,
        icon: mapWeatherIcon(data.current.condition.text, data.current.is_day)
      });
      
      setCity(`${data.location.name}, ${data.location.region || data.location.country}`);

      // 2. Weekly Outlook (Daily Forecast)
      const forecastDays = data.forecast.forecastday;
      const parsedDaily = forecastDays.map((dayData, index) => {
        return {
          day: getDayName(dayData.date, index === 0),
          icon: mapWeatherIcon(dayData.day.condition.text, 1), // assume day icon for daily summary
          high: Math.round(dayData.day.maxtemp_c),
          low: Math.round(dayData.day.mintemp_c),
          rain: dayData.day.daily_chance_of_rain
        };
      });
      setDailyForecast(parsedDaily);

      // 3. Hourly Breakdown (Next 9 hours)
      // Combine today's and tomorrow's hours to handle wrap-around past midnight
      const allHours = [];
      if (forecastDays[0]) allHours.push(...forecastDays[0].hour);
      if (forecastDays[1]) allHours.push(...forecastDays[1].hour);
      
      const currentEpoch = data.location.localtime_epoch;
      
      // Filter hours to only those in the future, then take the next 9
      const upcomingHours = allHours
        .filter(hourObj => hourObj.time_epoch >= currentEpoch)
        .slice(0, 9);
        
      const parsedHourly = upcomingHours.map(hourObj => {
        const date = new Date(hourObj.time_epoch * 1000);
        const hourNum = date.getHours();
        
        return {
          time: `${hourNum}:00`,
          temp: Math.round(hourObj.temp_c),
          icon: mapWeatherIcon(hourObj.condition.text, hourObj.is_day),
          color: hourObj.is_day ? COLORS.orange : COLORS.blue
        };
      });
      setHourlyForecast(parsedHourly);

    } catch (err) {
      console.error("Weather fetch error:", err);
      setError("Failed to fetch weather data. Please check the city name.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch on mount
    fetchWeatherData("Vadodara");
  }, []);

  const handleSearch = () => {
    if (!searchCity.trim()) return;
    fetchWeatherData(searchCity);
  };

  return (
    <div className="page-transition">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, fontFamily: "Georgia, serif", margin: 0 }}>
          Weather Forecast
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
          Precise environmental data for smart agricultural decisions in <strong style={{color: COLORS.primary}}>{city}</strong>
        </p>
      </div>

      {/* ─── SEARCH & LOCATION ────────────────────────────────────────── */}
      <Card style={{ marginBottom: 24, padding: "12px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Icon name="location" size={20} color={COLORS.primary} />
          <input
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t('weather.searchLocation')}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, background: "transparent", color: COLORS.text }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ background: COLORS.primary, color: "white", border: "none", borderRadius: 12, padding: "10px 24px", cursor: loading ? "wait" : "pointer", fontWeight: 700, transition: "transform 0.2s" }}
          >
            {loading ? t('weather.searching') : t('weather.update')}
          </button>
        </div>
      </Card>
      
      {error && (
        <div style={{ padding: "12px 20px", marginBottom: 24, background: "#ffebee", color: "#c62828", borderRadius: 12, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 24 }} className="grid-split">
        {/* ─── MAIN WEATHER (Glassmorphism Effect) ─────────────────────── */}
        {loading && currentWeather.temp === 0 ? (
          <Skeleton width="100%" height={240} borderRadius={20} />
        ) : (
        <Card style={{ background: `linear-gradient(135deg, ${COLORS.blue} 0%, #42A5F5 100%)`, color: "white", position: "relative", overflow: "hidden", border: "none" }} >
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  CURRENT CONDITIONS
                </span>
                <div style={{ fontSize: 82, fontWeight: 800, fontFamily: "Georgia", lineHeight: 1, margin: "16px 0 8px" }}>
                  {currentWeather.temp}°
                </div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{currentWeather.desc}</div>
                <div style={{ opacity: 0.8, fontSize: 14 }}>Feels like {currentWeather.feelsLike}° • Wind: {currentWeather.wind} km/h</div>
              </div>
              <div style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.1))" }}>
                <Icon name={currentWeather.icon} size={100} color="white" />
              </div>
            </div>
          </div>
        </Card>
        )}

        {/* ─── SMART AGRI INSIGHTS ────────────────────────────────────── */}
        <Card>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: COLORS.text }}>
            Smart Agri-Insights
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { label: "Irrigation Requirement", value: currentWeather.temp > 35 ? "High" : currentWeather.temp < 20 ? "Low" : "Moderate", pct: currentWeather.temp > 35 ? 90 : currentWeather.temp < 20 ? 20 : 50, color: COLORS.blue },
              { label: "Pesticide Spray Window", value: currentWeather.wind > 20 ? "Poor" : "Excellent", pct: currentWeather.wind > 20 ? 10 : 90, color: COLORS.primary },
              { label: "Heat Stress Alert", value: currentWeather.temp > 40 ? "Severe" : currentWeather.temp > 33 ? "Moderate" : "Low", pct: currentWeather.temp > 40 ? 95 : currentWeather.temp > 33 ? 50 : 10, color: COLORS.orange },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
                <div style={{ height: 8, background: COLORS.bg, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── WEEKLY FORECAST (Refined Cards) ───────────────────────────── */}
      {dailyForecast.length > 0 && (
        <Card style={{ marginBottom: 24, padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Weekly Outlook</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 12 }} className="forecast-grid">
            {dailyForecast.map((d, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "20px 8px",
                  borderRadius: 20,
                  background: i === 0 ? COLORS.primary + "10" : COLORS.bg,
                  border: i === 0 ? `2px solid ${COLORS.primary}44` : `1px solid ${COLORS.border}`,
                  transition: "transform 0.2s",
                  display: "flex", flexDirection: "column", alignItems: "center"
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? COLORS.primary : COLORS.textMuted, marginBottom: 12 }}>{d.day}</div>

                <div style={{ marginBottom: 12 }}>
                  <Icon name={d.icon} size={36} color={i === 0 ? COLORS.primary : COLORS.blue} />
                </div>

                <div style={{ fontWeight: 800, fontSize: 18 }}>{d.high}°</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{d.low}°</div>
                <div style={{ fontSize: 10, color: COLORS.blue, fontWeight: 700, marginTop: 8 }}>💧 {d.rain}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── HOURLY TEMPERATURE (Refined Scroll) ───────────────────────── */}
      {hourlyForecast.length > 0 && (
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Hourly Breakdown</h3>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
            {hourlyForecast.map((h, i) => (
              <div
                key={i}
                style={{
                  minWidth: 90,
                  textAlign: "center",
                  padding: "16px 12px",
                  borderRadius: 18,
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  display: "flex", flexDirection: "column", alignItems: "center"
                }}
              >
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>{h.time}</div>
                <div style={{ marginBottom: 8 }}>
                  <Icon name={h.icon} size={28} color={h.color} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>{h.temp}°</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default WeatherPage;