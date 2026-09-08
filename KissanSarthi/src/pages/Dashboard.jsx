import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { StatPill } from "../components/common/StatPill";
import { LineChart } from "../components/charts/LineChart";
import { dashboardAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import toast from "react-hot-toast";

const REFRESH_MS = 30000;

const fallbackSummary = {
  user: { name: "Farmer", location: "Agricultural Field" },
  kpis: {
    temperature: { value: "28°C", trend: "Live", sub: "Farm Microclimate" },
    soilMoisture: { value: "64%", trend: "Normal", sub: "Field Node #01" },
    activeYield: { value: "12.5", trend: "Acres", sub: "Operational Area" },
    marketIndex: { value: "₹2,480", trend: "+3.2%", sub: "Regional Mandi" },
  },
  charts: {
    priceTrend: [2100, 2200, 2150, 2300, 2250, 2400, 2380, 2450, 2500, 2480, 2520, 2600],
    soilMoistureTrend: [72, 68, 74, 70, 75, 78, 73],
  },
  weather: { 
    temperature: 28, 
    condition: "Partly Cloudy", 
    location: "Farm Region",
    humidity: "45%",
    windSpeed: "12 km/h",
    feelsLike: "30°C",
    high: "32°C",
    low: "24°C",
    sunrise: "05:45 AM",
    sunset: "07:15 PM"
  },
  alerts: [
    { type: "info", text: "Optimal irrigation window based on humidity and soil probe", time: "1h ago" },
    { type: "success", text: "Soil nutrient levels optimal for current growth stage", time: "3h ago" },
  ],
  aiInsights: [
    { title: "Yield Strategy", description: "Apply micro-nutrients during flowering." },
    { title: "Hydration Advice", description: "Drip irrigation saves 40% water vs flood." },
    { title: "Pest Protection", description: "Monitor underside of foliage during high humidity." },
  ],
};

const alertStyles = {
  warning: { bg: "#FFF3E0", border: "#FFE0B2", icon: "drop", color: COLORS.orange },
  success: { bg: "#E8F5E9", border: "#C8E6C9", icon: "check", color: COLORS.primary },
  info: { bg: "#E3F2FD", border: "#BBDEFB", icon: "crop", color: COLORS.blue },
  error: { bg: "#FFEBEE", border: "#FFCDD2", icon: "bell", color: "#D32F2F" },
};

const coerceSeries = (series, fallback) => {
  const clean = Array.isArray(series) ? series.map(Number).filter(Number.isFinite) : [];
  return clean.length ? clean : fallback;
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [summary, setSummary] = useState(fallbackSummary);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  const { socket, connected } = useSocket();

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await dashboardAPI.getSummary();
      const liveSummary = response.data?.data;
      if (liveSummary) {
        setSummary((prev) => ({ ...prev, ...liveSummary }));
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.warn('Dashboard fetch initial error:', error);
    }
  }, []);

  // Fetch initial summary once on mount — live updates happen via Socket.IO
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Socket event listeners for real-time telemetry and alerts
  useEffect(() => {
    if (!socket) return;

    const handleSensorUpdate = (data) => {
      if (!data) return;
      setLastUpdated(new Date());

      setSummary((prev) => {
        const prevTrend = prev.charts?.soilMoistureTrend || [65, 68, 70];
        const newTrend = [...prevTrend.slice(-11), data.soilMoisture];

        return {
          ...prev,
          liveSensor: data,
          kpis: {
            ...prev.kpis,
            soilMoisture: {
              value: `${Math.round(data.soilMoisture)}%`,
              trend: "Live",
              sub: "Field Node #01",
            },
            temperature: {
              value: `${Math.round(data.temperature)}°C`,
              trend: "Live",
              sub: "Farm Microclimate",
            },
          },
          charts: {
            ...prev.charts,
            soilMoistureTrend: newTrend,
          },
        };
      });
    };

    const handleAlertNew = (newAlert) => {
      if (!newAlert) return;
      setLastUpdated(new Date());
      setUnreadAlerts((count) => count + 1);
      toast((t) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>Farm Alert:</strong> {newAlert.message || newAlert.text || 'New alert received'}
        </span>
      ), { icon: '⚠️' });

      setSummary((prev) => ({
        ...prev,
        alerts: [
          {
            id: newAlert._id || Date.now(),
            type: newAlert.type || "warning",
            text: newAlert.message || newAlert.text,
            time: "Just now",
          },
          ...(prev.alerts || []),
        ],
      }));
    };

    socket.on("sensor_update", handleSensorUpdate);
    socket.on("sensor:update", handleSensorUpdate);
    socket.on("alert_new", handleAlertNew);
    socket.on("alert:new", handleAlertNew);

    return () => {
      socket.off("sensor_update", handleSensorUpdate);
      socket.off("sensor:update", handleSensorUpdate);
      socket.off("alert_new", handleAlertNew);
      socket.off("alert:new", handleAlertNew);
    };
  }, [socket]);

  const displayName = user?.name || user?.displayName || summary.user?.name || fallbackSummary.user.name;
  const location = user?.city ? `${user.city}${user.state ? `, ${user.state}` : ''}` : (user?.location || summary.user?.location || fallbackSummary.user.location);
  
  const kpis = summary.kpis || fallbackSummary.kpis;
  const priceTrend = coerceSeries(summary.charts?.priceTrend, fallbackSummary.charts.priceTrend);
  const soilTrend = coerceSeries(summary.charts?.soilMoistureTrend, fallbackSummary.charts.soilMoistureTrend);
  const highestAsk = Math.max(...priceTrend);
  const currentWeather = summary.weather || fallbackSummary.weather;
  const latestMoisture = soilTrend.at(-1) ?? 0;
  const weatherTemp = Math.round(currentWeather.temperature ?? Number.parseFloat(kpis.temperature?.value) ?? 28);

  const statusBadge = useMemo(() => {
    if (connected) return { text: `🟢 ${t('dashboard.liveData', 'Live Telemetry')}`, color: COLORS.primary };
    return { text: `🟡 ${t('dashboard.reconnecting', 'Reconnecting...')}`, color: COLORS.accentDark };
  }, [connected, t]);

  const metricCards = [
    { icon: "sun", label: t('dashboard.temperature', 'Temperature'), color: COLORS.orange, ...kpis.temperature },
    { icon: "drop", label: t('dashboard.soilMoisture', 'Soil Moisture'), color: COLORS.blue, ...kpis.soilMoisture },
    { icon: "crop", label: t('dashboard.activeYield', 'Active Yield'), color: COLORS.primary, ...kpis.activeYield },
    { icon: "market", label: t('market.title', 'Market Index'), color: COLORS.accentDark, ...kpis.marketIndex },
  ];

  return (
    <div className="page-transition" style={{ paddingBottom: "40px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 28,
        background: "linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)",
        padding: "26px 30px",
        borderRadius: "24px",
        border: `1px solid ${COLORS.border}`,
        borderLeft: `6px solid ${COLORS.primary}`,
        boxShadow: "0 10px 25px -5px rgba(22, 101, 52, 0.06)",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.primary, background: `${COLORS.primary}18`, padding: "3px 10px", borderRadius: 20 }}>
              PRECISION AGRI DASHBOARD
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: COLORS.forest, fontFamily: "var(--font-display, Fraunces, Georgia, serif)", margin: "4px 0", letterSpacing: "-0.01em" }}>
            Namaste, {displayName} 👋
          </h1>
          <p style={{ color: COLORS.textMuted, margin: "6px 0 0", fontSize: 14.5, fontWeight: 500 }}>
            Farm Command Center &bull; <span style={{ color: COLORS.primaryDark, fontWeight: 700 }}>{location}</span> &bull; {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Badge text={statusBadge.text} color={statusBadge.color} />
          <span style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
            🌾 Kharif 2026 Cycle
          </span>
          {lastUpdated && (
            <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600, background: "white", padding: "4px 10px", borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
              Updated {lastUpdated.toLocaleTimeString("en-IN")}
            </span>
          )}
        </div>
      </div>

      <div className="grid-container" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(200px, 1fr))", gap: 20, marginBottom: 25 }}>
        {metricCards.map((s) => (
          <Card key={s.label} hoverable style={{ padding: "24px", position: "relative", overflow: "hidden", display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${s.color}25` }}>
                <Icon name={s.icon} size={24} color={s.color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: s.color, background: s.color + "15", padding: "5px 10px", borderRadius: 10, height: "fit-content", display: 'flex', alignItems: 'center', gap: 4 }}>
                {s.trend === "79% Goal" ? <Icon name="trend" size={12} color={s.color} /> : null}
                {s.trend}
              </span>
            </div>
            
            {s.label === "Active Yield" ? (
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.text, fontFamily: "var(--font-display, Fraunces, Georgia, serif)" }}>{s.value}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMuted }}>Tons</div>
                </div>
                <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3, marginTop: 12, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '79%', background: `linear-gradient(90deg, ${s.color}, #10B981)`, borderRadius: 3 }}></div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.text, fontFamily: "var(--font-display, Fraunces, Georgia, serif)" }}>{s.value}</div>
            )}
            
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, marginTop: 8 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="clock" size={12} color={COLORS.textMuted} />
                {s.sub}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 25 }} className="grid-split">
        <Card style={{ padding: "24px", display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>{t('dashboard.marketPriceTrend', 'Market Price Trend')}</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>Wheat market price trends over time</p>
            </div>
            <div style={{ textAlign: "right", background: COLORS.primary + "10", padding: "8px 16px", borderRadius: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.primary }}>&#8377;{highestAsk.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('dashboard.highestAsk', 'Highest Ask')}</div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 220 }}>
            <LineChart data={priceTrend} color={COLORS.primary} height="100%" showXAxis={true} />
          </div>
        </Card>

        <Card style={{ padding: "24px", display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>{t('dashboard.soilHealthMonitor', 'Soil Health Monitor')}</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>Field sensor report from your farm</p>
          </div>
          <div style={{ flex: 1, minHeight: 120, marginBottom: 20 }}>
            <LineChart data={soilTrend} color={COLORS.brown} height="100%" showXAxis={true} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: "auto" }}>
            <StatPill value={`${Math.round(latestMoisture)}%`} label={t('dashboard.soilMoisture', 'Moisture')} icon="drop" color={COLORS.blue} />
            <StatPill value={`${summary.liveSensor?.ph ?? "6.8"} pH`} label="Acidity" icon="leaf" color={COLORS.brown} />
            <StatPill value={summary.liveSensor?.nitrogen ? `${summary.liveSensor.nitrogen} N` : "Optimal"} label="Nitrogen" icon="trend" color={COLORS.primary} />
            <StatPill value={summary.liveSensor?.potassium ?? "Stable"} label="Potassium" icon="star" color={COLORS.orange} />
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <Card style={{
          background: `linear-gradient(135deg, ${COLORS.blue}, #1e40af)`,
          color: "white",
          border: "none",
          padding: "24px",
          boxShadow: `0 10px 30px ${COLORS.blue}44`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: "0 0 15px", fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="weather" size={20} color="white" />
              {t('dashboard.smartWeatherNode', 'Smart Weather Node')}
            </h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <div>
                <div style={{ fontSize: 58, fontWeight: 900, fontFamily: "Georgia", lineHeight: 1 }}>{weatherTemp}°C</div>
                <div style={{ fontSize: 16, opacity: 0.9, marginTop: 8, fontWeight: 500 }}>{currentWeather.condition}</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                  <Icon name="marker" size={12} color="rgba(255,255,255,0.7)" /> {currentWeather.location || location}
                </div>
              </div>
              <Icon name="sunny" size={72} color="rgba(255,255,255,0.9)" />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", padding: "10px 14px", borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="drop" size={16} color="white" />
                <div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{t('dashboard.humidity', 'Humidity')}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{currentWeather.humidity}</div>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.15)", padding: "10px 14px", borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="wind" size={16} color="white" />
                <div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{t('dashboard.wind', 'Wind')}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{currentWeather.windSpeed}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, background: "rgba(255,255,255,0.1)", padding: "16px", borderRadius: "18px", backdropFilter: "blur(10px)" }}>
            {["Now", "2h", "4h", "6h", "8h"].map((d, i) => (
              <div key={d} style={{ textAlign: "center" }}>
                <Icon name={i % 2 ? "weather" : "sun"} size={20} color="rgba(255,255,255,0.9)" />
                <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 700 }}>{d}</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{weatherTemp + (i % 3) - 1}°</div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: "24px" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="bell" size={20} color={COLORS.orange} />
              {t('dashboard.alerts', 'Critical System Alerts')}
              {unreadAlerts > 0 && (
                <span style={{ background: COLORS.red, color: 'white', fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 999 }}>
                  {unreadAlerts} new
                </span>
              )}
            </h3>
            {unreadAlerts > 0 && (
              <button type="button" onClick={() => setUnreadAlerts(0)} style={{ background: 'none', border: 'none', color: COLORS.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {t('dashboard.markAllRead', 'Mark all read')} ({unreadAlerts})
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {(summary.alerts?.length ? summary.alerts : fallbackSummary.alerts).map((a, i) => {
              const style = alertStyles[a.type] || alertStyles.info;
              return (
                <div key={a.id || i} style={{
                  display: "flex",
                  gap: 15,
                  padding: "16px",
                  borderRadius: 18,
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${style.border}80`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                >
                  <div style={{ marginTop: 2, background: 'white', borderRadius: '50%', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, flexShrink: 0, boxShadow: `0 2px 8px ${style.border}` }}>
                    <Icon name={a.icon || style.icon} size={16} color={style.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 800, lineHeight: 1.3 }}>{a.text}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="clock" size={10} color={COLORS.textMuted} />
                      {a.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="bulb" size={20} color={COLORS.primary} />
            Farming Tips
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(summary.aiInsights?.length ? summary.aiInsights : fallbackSummary.aiInsights).map((tip, i) => (
              <div key={`${tip.title}-${i}`} style={{
                padding: "16px",
                background: COLORS.bg,
                borderRadius: 16,
                borderLeft: `5px solid ${COLORS.primary}`,
                transition: "background 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.bg}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 }}>{tip.title}</div>
                <div style={{ fontSize: 14, color: COLORS.text, fontWeight: 500, lineHeight: 1.4 }}>{tip.description}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
