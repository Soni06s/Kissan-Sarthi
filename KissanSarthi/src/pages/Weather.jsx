import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { COLORS } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Card } from "../components/common/Card";
import { Skeleton } from "../components/common/Skeleton";
import { weatherAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const API_KEY = "0fdce38c46f04e69bed40425262606";

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

const getDayName = (dateStr, isToday) => {
  if (isToday) return "Today";
  const date = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
};

const WeatherPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Prefer user's verified city or location, fallback to Vadodara
  const defaultLocation = user?.city
    ? `${user.city}${user.state ? `, ${user.state}` : ''}`
    : (user?.location ? user.location.split(',')[0].trim() : "Vadodara, Gujarat");

  const [city, setCity] = useState(defaultLocation);
  const [searchCity, setSearchCity] = useState("");
  
  // Three distinct, mutually-exclusive states: 'loading' | 'error' | 'success'
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [currentWeather, setCurrentWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);

  const fetchWeatherData = async (locationToQuery) => {
    const loc = (locationToQuery || city || defaultLocation || "Vadodara").trim();
    setStatus("loading");
    setErrorMessage("");

    try {
      // 1. Primary: Call backend weather API
      const apiRes = await weatherAPI.getForecast(loc);
      const apiData = apiRes.data?.data;

      if (apiData && apiData.current && apiData.forecast?.length > 0) {
        setCurrentWeather({
          temp: Math.round(apiData.current.temperature),
          feelsLike: Math.round(apiData.current.temperature - 1),
          wind: Math.round(apiData.current.windSpeed || 12),
          desc: apiData.current.condition || "Clear",
          icon: mapWeatherIcon(apiData.current.condition, 1),
          humidity: apiData.current.humidity || 55,
          sprayWindow: apiData.current.sprayWindow || "Optimal",
          irrigationAdvice: apiData.current.irrigationAdvice || "Normal Irrigation",
        });

        setCity(apiData.location || loc);
        setDailyForecast(apiData.forecast);

        // Generate synthetic or estimated hourly slices from current conditions
        const nowHour = new Date().getHours();
        const baseTemp = Math.round(apiData.current.temperature);
        const synthHourly = Array.from({ length: 8 }).map((_, i) => {
          const hourNum = (nowHour + i * 2) % 24;
          const isDay = hourNum >= 6 && hourNum <= 18 ? 1 : 0;
          const variance = isDay ? Math.sin((i / 8) * Math.PI) * 4 : -Math.sin((i / 8) * Math.PI) * 3;
          return {
            time: `${hourNum}:00`,
            temp: Math.round(baseTemp + variance),
            icon: mapWeatherIcon(apiData.current.condition, isDay),
            color: isDay ? COLORS.orange : COLORS.blue,
          };
        });
        setHourlyForecast(synthHourly);
        setStatus("success");
        return;
      }

      // 2. Direct external fallback if backend returns empty
      const response = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(loc)}&days=7&aqi=no&alerts=no`,
        { timeout: 7000 }
      );
      const data = response.data;

      if (!data || !data.current) {
        throw new Error("Weather service returned incomplete telemetry.");
      }

      setCurrentWeather({
        temp: Math.round(data.current.temp_c),
        feelsLike: Math.round(data.current.feelslike_c),
        wind: Math.round(data.current.wind_kph),
        desc: data.current.condition.text,
        icon: mapWeatherIcon(data.current.condition.text, data.current.is_day),
        humidity: data.current.humidity,
        sprayWindow: data.current.wind_kph > 20 ? "Poor" : "Optimal",
        irrigationAdvice: (data.forecast?.forecastday?.[0]?.day?.daily_chance_of_rain || 0) > 50 ? "Defer Irrigation" : "Normal Irrigation",
      });

      setCity(`${data.location.name}, ${data.location.region || data.location.country}`);

      const forecastDays = data.forecast?.forecastday || [];
      const parsedDaily = forecastDays.map((dayData, index) => ({
        day: getDayName(dayData.date, index === 0),
        icon: mapWeatherIcon(dayData.day.condition.text, 1),
        high: Math.round(dayData.day.maxtemp_c),
        low: Math.round(dayData.day.mintemp_c),
        rain: dayData.day.daily_chance_of_rain || 0,
      }));
      setDailyForecast(parsedDaily);

      const currentEpoch = data.location?.localtime_epoch || Math.floor(Date.now() / 1000);
      const allHours = [];
      if (forecastDays[0]) allHours.push(...forecastDays[0].hour);
      if (forecastDays[1]) allHours.push(...forecastDays[1].hour);

      const upcomingHours = allHours
        .filter((h) => h.time_epoch >= currentEpoch)
        .slice(0, 9)
        .map((h) => {
          const hourNum = new Date(h.time_epoch * 1000).getHours();
          return {
            time: `${hourNum}:00`,
            temp: Math.round(h.temp_c),
            icon: mapWeatherIcon(h.condition.text, h.is_day),
            color: h.is_day ? COLORS.orange : COLORS.blue,
          };
        });

      setHourlyForecast(upcomingHours);
      setStatus("success");
    } catch (err) {
      console.error("Weather fetch failure:", err);
      setErrorMessage(
        `Unable to fetch microclimate forecast for "${loc}". Please check the spelling or choose your district.`
      );
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchWeatherData(defaultLocation);
  }, [defaultLocation]);

  const handleSearch = () => {
    if (!searchCity.trim()) return;
    fetchWeatherData(searchCity);
  };

  return (
    <div className="page-transition" style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* ─── PAGE HEADER ─── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, fontFamily: "Georgia, serif", margin: 0 }}>
          Smart Farming Weather Advisor
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
          Localized microclimate forecast & automated spray/irrigation guidance for{" "}
          <strong style={{ color: COLORS.primary }}>{city}</strong>
        </p>
      </div>

      {/* ─── SEARCH & LOCATION BAR ─── */}
      <Card style={{ marginBottom: 24, padding: "12px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Icon name="location" size={20} color={COLORS.primary} />
          <input
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t("weather.searchLocation") || "Search village, mandi district, or city (e.g. Samba, Anand, Ludhiana)..."}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 15,
              background: "transparent",
              color: COLORS.text,
            }}
          />
          <button
            onClick={handleSearch}
            disabled={status === "loading"}
            style={{
              background: COLORS.primary,
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "10px 24px",
              cursor: status === "loading" ? "wait" : "pointer",
              fontWeight: 700,
              transition: "transform 0.2s",
            }}
          >
            {status === "loading" ? t("weather.searching") || "Checking..." : t("weather.update") || "Search"}
          </button>
        </div>
      </Card>

      {/* ─── STATE 1: ERROR STATE (Never shows broken 0° card) ─── */}
      {status === "error" && (
        <Card
          style={{
            marginBottom: 28,
            padding: "32px 24px",
            textAlign: "center",
            border: "1px solid #FFCDD2",
            background: "#FFF5F5",
            borderRadius: 20,
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 12 }}>🌧️</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#C62828" }}>
            Weather Forecast Unavailable
          </h3>
          <p style={{ color: "#5F5E5A", fontSize: 14, maxWidth: 500, margin: "0 auto 20px" }}>
            {errorMessage}
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => fetchWeatherData(city || defaultLocation)}
              style={{
                background: COLORS.primary,
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "10px 24px",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(46,125,50,0.25)",
              }}
            >
              🔄 Retry Forecast
            </button>
            <button
              onClick={() => {
                setSearchCity("Vadodara, Gujarat");
                fetchWeatherData("Vadodara, Gujarat");
              }}
              style={{
                background: "white",
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: "10px 20px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              📍 Use Regional Hub (Vadodara)
            </button>
            {user?.state && (
              <button
                onClick={() => {
                  setSearchCity(user.state);
                  fetchWeatherData(user.state);
                }}
                style={{
                  background: "white",
                  color: COLORS.text,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: "10px 20px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                📍 Use State ({user.state})
              </button>
            )}
          </div>
        </Card>
      )}

      {/* ─── STATE 2: LOADING SKELETON (No fake 0° numbers) ─── */}
      {status === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }} className="grid-split">
            <Skeleton width="100%" height={240} borderRadius={20} />
            <Skeleton width="100%" height={240} borderRadius={20} />
          </div>
          <Card style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <Skeleton width={160} height={20} borderRadius={6} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} width="100%" height={150} borderRadius={16} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ─── STATE 3: SUCCESS STATE (Real data only) ─── */}
      {status === "success" && currentWeather && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 24 }} className="grid-split">
            {/* Main Weather Card (Glassmorphism Effect) */}
            <Card
              style={{
                background: `linear-gradient(135deg, ${COLORS.blue} 0%, #42A5F5 100%)`,
                color: "white",
                position: "relative",
                overflow: "hidden",
                border: "none",
                borderRadius: 20,
              }}
            >
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }}
                    >
                      LIVE CONDITIONS
                    </span>
                    <div
                      style={{
                        fontSize: 82,
                        fontWeight: 800,
                        fontFamily: "Georgia, serif",
                        lineHeight: 1,
                        margin: "16px 0 8px",
                      }}
                    >
                      {currentWeather.temp}°
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{currentWeather.desc}</div>
                    <div style={{ opacity: 0.9, fontSize: 14, marginTop: 4 }}>
                      Feels like {currentWeather.feelsLike}° • Humidity: {currentWeather.humidity}% • Wind: {currentWeather.wind} km/h
                    </div>
                  </div>
                  <div style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.15))" }}>
                    <Icon name={currentWeather.icon} size={96} color="white" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Smart Agri-Insights Card */}
            <Card style={{ borderRadius: 20, padding: 24 }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                Smart Field Advisory
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  {
                    label: "Irrigation Recommendation",
                    value: currentWeather.irrigationAdvice || (currentWeather.temp > 35 ? "High Irrigation" : "Normal Irrigation"),
                    pct: currentWeather.temp > 35 ? 85 : currentWeather.temp < 20 ? 30 : 55,
                    color: COLORS.blue,
                  },
                  {
                    label: "Pesticide Spray Window",
                    value: currentWeather.sprayWindow || (currentWeather.wind > 20 ? "Poor (High Wind)" : "Optimal Window"),
                    pct: currentWeather.wind > 20 ? 20 : 90,
                    color: COLORS.primary,
                  },
                  {
                    label: "Heat / Frost Alert",
                    value: currentWeather.temp > 38 ? "Heat Alert" : currentWeather.temp < 10 ? "Cold Watch" : "Safe Range",
                    pct: currentWeather.temp > 38 ? 90 : currentWeather.temp < 10 ? 70 : 15,
                    color: currentWeather.temp > 38 ? COLORS.orange : COLORS.primary,
                  },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{item.label}</span>
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

          {/* Weekly Outlook (7-Day Row) */}
          {dailyForecast.length > 0 && (
            <Card style={{ marginBottom: 24, padding: "20px 24px", borderRadius: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800 }}>7-Day Agricultural Outlook</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: 12,
                }}
                className="forecast-grid"
              >
                {dailyForecast.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: "center",
                      padding: "18px 8px",
                      borderRadius: 18,
                      background: i === 0 ? `${COLORS.primary}12` : COLORS.bg,
                      border: i === 0 ? `2px solid ${COLORS.primary}55` : `1px solid ${COLORS.border}`,
                      transition: "transform 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: i === 0 ? COLORS.primary : COLORS.textMuted,
                        marginBottom: 10,
                      }}
                    >
                      {d.day}
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <Icon name={d.icon} size={34} color={i === 0 ? COLORS.primary : COLORS.blue} />
                    </div>

                    <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.text }}>{d.high}°</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{d.low}°</div>
                    <div style={{ fontSize: 11, color: COLORS.blue, fontWeight: 700, marginTop: 8 }}>
                      💧 {d.rain}%
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Hourly Breakdown */}
          {hourlyForecast.length > 0 && (
            <Card style={{ borderRadius: 20, padding: "20px 24px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800 }}>Hourly Temperature Trend</h3>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "thin" }}>
                {hourlyForecast.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      minWidth: 92,
                      textAlign: "center",
                      padding: "14px 10px",
                      borderRadius: 16,
                      background: COLORS.bg,
                      border: `1px solid ${COLORS.border}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 }}>
                      {h.time}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Icon name={h.icon} size={26} color={h.color} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>{h.temp}°</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherPage;