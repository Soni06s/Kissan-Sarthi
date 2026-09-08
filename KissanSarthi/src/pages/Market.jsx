import React, { useState, useEffect, useMemo } from "react";
import { COLORS } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Sparkline } from "../components/common/Sparkline";
import { PriceTrendChart } from "../components/charts/PriceTrendChart";
import { marketAPI } from "../services/api";

const initialCrops = [
  { name: "Wheat", icon: "wheat", price: 2480, prev: 2380, trend: "up", pctChange: 4.2, vol: "Low", history: [2300, 2320, 2350, 2380, 2410, 2450, 2480] },
  { name: "Rice", icon: "rice", price: 3200, prev: 3100, trend: "up", pctChange: 3.2, vol: "Low", history: [3050, 3080, 3100, 3120, 3150, 3180, 3200] },
  { name: "Onion", icon: "onion", price: 2800, prev: 2950, trend: "down", pctChange: -5.1, vol: "Med", history: [3100, 3050, 3000, 2980, 2950, 2900, 2800] },
  { name: "Tomato", icon: "tomato", price: 1450, prev: 1300, trend: "up", pctChange: 11.5, vol: "High", history: [1100, 1150, 1200, 1280, 1300, 1380, 1450] },
  { name: "Potato", icon: "potato", price: 1400, prev: 1350, trend: "up", pctChange: 3.7, vol: "Low", history: [1320, 1330, 1340, 1350, 1360, 1380, 1400] },
  { name: "Mustard", icon: "mustard", price: 5800, prev: 5600, trend: "up", pctChange: 3.6, vol: "Low", history: [5500, 5550, 5600, 5650, 5700, 5750, 5800] },
];

const MarketPage = () => {
  const [selected, setSelected] = useState("Wheat");
  const [marketCrops, setMarketCrops] = useState(initialCrops);
  const [historyData, setHistoryData] = useState([2300, 2320, 2350, 2380, 2410, 2450, 2480]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState({
    trend: "Bullish",
    topGainer: "Tomato (+11.5%)",
    priceIndex: "↑ 3.8%",
    mandiStatus: "Trading Active",
  });
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Generate real human-readable date labels for the past 7 days
  const dateLabels = useMemo(() => {
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (i === 0) labels.push("Today");
      else if (i === 1) labels.push("Yesterday");
      else labels.push(d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
    }
    return labels;
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await marketAPI.getPrices({});
      const summaryData = res.data?.data?.summary;
      const sentimentData = res.data?.data?.sentiment;

      if (summaryData && summaryData.length > 0) {
        const mapped = summaryData.map((s) => ({
          name: s.name,
          icon: s.name.toLowerCase().includes("wheat")
            ? "wheat"
            : s.name.toLowerCase().includes("rice")
            ? "rice"
            : s.name.toLowerCase().includes("onion")
            ? "onion"
            : s.name.toLowerCase().includes("tomato")
            ? "tomato"
            : s.name.toLowerCase().includes("mustard")
            ? "mustard"
            : s.name.toLowerCase().includes("maize")
            ? "maize"
            : s.name.toLowerCase().includes("soy")
            ? "soybean"
            : "potato",
          price: s.price,
          prev: s.prev,
          trend: s.trend,
          pctChange: s.pctChange !== undefined ? s.pctChange : (s.prev ? Number((((s.price - s.prev) / s.prev) * 100).toFixed(1)) : 0),
          vol: s.vol || "Moderate",
          history: s.history && s.history.length > 1 ? s.history : [s.prev || s.price * 0.98, s.price],
        }));
        setMarketCrops(mapped);

        // If the selected commodity exists in the updated summary, sync its history
        const activeCrop = mapped.find(c => c.name.toLowerCase() === selected.toLowerCase());
        if (activeCrop && activeCrop.history?.length) {
          setHistoryData(activeCrop.history);
        }

        if (sentimentData) {
          setSentiment({
            trend: sentimentData.trend || "Bullish",
            topGainer: sentimentData.topGainer || "Tomato (+11.5%)",
            priceIndex: sentimentData.priceIndex || "↑ 3.8%",
            mandiStatus: sentimentData.mandiStatus === "Open" ? "Trading Active" : (sentimentData.mandiStatus || "Trading Active"),
          });
        }
        setLastUpdated(new Date());
        setSecondsAgo(0);
      }
    } catch (err) {
      console.warn("Using market price view fallback", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedHistory = async (cropName) => {
    // Check if we already have it in marketCrops
    const found = marketCrops.find(c => c.name.toLowerCase() === cropName.toLowerCase());
    if (found?.history?.length > 1) {
      setHistoryData(found.history);
      return;
    }

    try {
      const res = await marketAPI.getPrices({ commodity: cropName });
      const h = res.data?.data?.history;
      if (h && h.length > 0) {
        setHistoryData(h);
      }
    } catch (err) {
      console.warn("Market history fallback", err);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchSelectedHistory(selected);
  }, [selected]);

  // Dynamically sort top movers by absolute percentage change
  const topMovers = useMemo(() => {
    return [...marketCrops]
      .sort((a, b) => Math.abs(b.pctChange || 0) - Math.abs(a.pctChange || 0))
      .slice(0, 4);
  }, [marketCrops]);

  return (
    <div className="page-transition">
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, fontFamily: "Georgia, serif", margin: 0 }}>
              Market Analytics Hub
            </h1>
            <span style={{ fontSize: 11, background: `${COLORS.primary}15`, color: COLORS.primaryDark, padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>
              Live Ticker
            </span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>
            Real-time commodity arrivals across regulated Mandis •{" "}
            <span style={{ color: COLORS.text, fontWeight: 600 }}>
              {secondsAgo < 5 ? "Synced just now" : `Synced ${secondsAgo}s ago`}
            </span>
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: COLORS.primary, fontWeight: 700 }}>15s Live Sync</span>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 20,
            background: "#EAF3DE",
            border: "1px solid #C5E1A5",
            color: "#27500A",
            fontSize: 12,
            fontWeight: 700
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#3B6D11",
              boxShadow: "0 0 8px rgba(59, 109, 17, 0.4)",
              display: "inline-block"
            }} />
            Live Feed
          </div>
        </div>
      </div>

      {/* ─── MARKET SENTIMENT STRIP ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { l: "Market Sentiment", v: sentiment.trend, i: "trend", c: sentiment.trend === "Bearish" ? COLORS.red : COLORS.primary, bg: sentiment.trend === "Bearish" ? "#FCEBEB" : "#EAF3DE" },
          { l: "Top Mover Today", v: sentiment.topGainer, i: "star", c: COLORS.orange, bg: "#FFF3E0" },
          { l: "Commodity Price Index", v: sentiment.priceIndex, i: "trend", c: COLORS.primaryDark, bg: "#E8F5E9" },
          { l: "Mandi Trading Session", v: sentiment.mandiStatus, i: "check", c: COLORS.blue, bg: "#E6F1FB" },
        ].map((s, idx) => (
          <div
            key={idx}
            style={{
              background: "white",
              padding: "18px 20px",
              borderRadius: 18,
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.03)";
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={s.i} size={22} color={s.c} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {s.l}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: s.c, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.v}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── CHARTS & TOP MOVERS SPLIT ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 24 }} className="grid-split">
        {/* ─── INTERACTIVE PRICE CHART ─────────────────────────────── */}
        <Card style={{ padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>
                {selected} Price Trend (7 Days)
              </h3>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: COLORS.textMuted }}>
                Verified arrival averages from regional APMC terminal
              </p>
            </div>
            {/* Commodity filter pills */}
            <div style={{ display: "flex", background: COLORS.bg, padding: 4, borderRadius: 12, flexWrap: "wrap", gap: 4, border: `1px solid ${COLORS.border}` }}>
              {["Wheat", "Rice", "Onion", "Tomato", "Mustard"].map((c) => {
                const isActive = selected.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelected(c)}
                    style={{
                      padding: "6px 14px",
                      border: "none",
                      borderRadius: 9,
                      background: isActive ? "white" : "transparent",
                      color: isActive ? COLORS.primaryDark : COLORS.textMuted,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                      boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.primary, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: 600 }}>Loading 7-day price trajectory...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <PriceTrendChart
              data={historyData.slice(-7)}
              labels={dateLabels}
              commodity={selected}
              color={COLORS.primary}
              height={220}
            />
          )}
        </Card>

        {/* ─── QUICK WATCHLIST: TOP MOVERS ───────────────────────────── */}
        <Card style={{ padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>Top Movers Today</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textMuted }}>Ranked by 24h price swing</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.primary, background: `${COLORS.primary}12`, padding: "3px 8px", borderRadius: 8 }}>
              Active APMC
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topMovers.map((crop, i) => {
              const isUp = crop.pctChange >= 0;
              return (
                <div
                  key={i}
                  onClick={() => setSelected(crop.name)}
                  style={{
                    padding: "12px 14px",
                    border: `1px solid ${crop.name.toLowerCase() === selected.toLowerCase() ? COLORS.primary : COLORS.border}`,
                    borderRadius: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    background: crop.name.toLowerCase() === selected.toLowerCase() ? `${COLORS.primary}06` : "white",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = COLORS.primary;
                    e.currentTarget.style.background = "#fafcfa";
                  }}
                  onMouseLeave={e => {
                    const selectedMatch = crop.name.toLowerCase() === selected.toLowerCase();
                    e.currentTarget.style.borderColor = selectedMatch ? COLORS.primary : COLORS.border;
                    e.currentTarget.style.background = selectedMatch ? `${COLORS.primary}06` : "white";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name={crop.icon} size={22} color={COLORS.primary} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.text }}>{crop.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>Regional Mandi</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.text }}>
                      ₹{crop.price.toLocaleString("en-IN")}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: isUp ? COLORS.primary : COLORS.red,
                        fontWeight: 700,
                        marginTop: 2,
                      }}
                    >
                      {isUp ? "↑ +" : "↓ "}{Math.abs(crop.pctChange)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ─── COMMODITY EXCHANGE TERMINAL TABLE ───────────────────────── */}
      <Card style={{ padding: 0, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>Regional Mandi Prices</h3>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Verified APMC trading prices & 7-day sparkline momentum</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>
            {marketCrops.length} Commodities Monitored
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={{ padding: "14px 24px", textAlign: "left", fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Commodity</th>
                <th style={{ padding: "14px 24px", textAlign: "right", fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Price (₹/Q)</th>
                <th style={{ padding: "14px 24px", textAlign: "right", fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>24h Change</th>
                <th style={{ padding: "14px 24px", textAlign: "center", fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>7D Trend</th>
                <th style={{ padding: "14px 24px", textAlign: "center", fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Volatility</th>
                <th style={{ padding: "14px 24px", textAlign: "right", fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "16px 24px" }}><div style={{ width: 120, height: 18, background: "#f1f5f9", borderRadius: 6 }} /></td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}><div style={{ width: 70, height: 18, background: "#f1f5f9", borderRadius: 6, marginLeft: "auto" }} /></td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}><div style={{ width: 60, height: 18, background: "#f1f5f9", borderRadius: 6, marginLeft: "auto" }} /></td>
                    <td style={{ padding: "16px 24px", textAlign: "center" }}><div style={{ width: 80, height: 24, background: "#f1f5f9", borderRadius: 6, margin: "0 auto" }} /></td>
                    <td style={{ padding: "16px 24px", textAlign: "center" }}><div style={{ width: 60, height: 18, background: "#f1f5f9", borderRadius: 6, margin: "0 auto" }} /></td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}><div style={{ width: 90, height: 22, background: "#f1f5f9", borderRadius: 12, marginLeft: "auto" }} /></td>
                  </tr>
                ))
              ) : (
                marketCrops.map((crop, i) => {
                  const isUp = crop.pctChange >= 0;
                  const sparklineData = crop.history && crop.history.length > 1
                    ? crop.history
                    : (isUp ? [crop.prev || crop.price * 0.98, crop.price] : [crop.prev || crop.price * 1.02, crop.price]);

                  return (
                    <tr
                      key={i}
                      onClick={() => setSelected(crop.name)}
                      style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                        background: i % 2 === 1 ? "#FAFCFA" : "#FFFFFF",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F8F1")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? "#FAFCFA" : "#FFFFFF")}
                    >
                      {/* Commodity Name & Icon */}
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ background: COLORS.bg, padding: 8, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name={crop.icon} size={20} color={COLORS.primary} />
                          </div>
                          <div>
                            <span style={{ fontWeight: 800, color: COLORS.text, fontSize: 14 }}>{crop.name}</span>
                            <span style={{ display: "block", fontSize: 11, color: COLORS.textMuted }}>Standard Grade</span>
                          </div>
                        </div>
                      </td>

                      {/* Right-aligned Price */}
                      <td style={{ padding: "16px 24px", textAlign: "right", fontWeight: 800, fontSize: 16, color: COLORS.text, fontFamily: "Georgia, serif" }}>
                        ₹{crop.price.toLocaleString("en-IN")}
                      </td>

                      {/* Right-aligned 24h Change */}
                      <td style={{ padding: "16px 24px", textAlign: "right" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            display: "inline-block",
                            background: isUp ? `${COLORS.primary}18` : `${COLORS.red}18`,
                            color: isUp ? COLORS.primaryDark : COLORS.red,
                          }}
                        >
                          {isUp ? "+" : ""}{crop.pctChange}%
                        </span>
                      </td>

                      {/* Centered Hand-rolled SVG Sparkline */}
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <Sparkline
                          data={sparklineData}
                          color={isUp ? COLORS.primary : COLORS.red}
                          width={84}
                          height={28}
                          strokeWidth={2}
                          fill={true}
                        />
                      </td>

                      {/* Centered Volatility Pill */}
                      <td style={{ padding: "16px 24px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: crop.vol === "High" ? COLORS.orange : COLORS.textMuted,
                            background: crop.vol === "High" ? "#FFF3E0" : COLORS.bg,
                            padding: "3px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {crop.vol}
                        </span>
                      </td>

                      {/* Right-aligned Status Badge */}
                      <td style={{ padding: "16px 24px", textAlign: "right" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 12px",
                            borderRadius: 20,
                            background: "#EAF3DE",
                            border: "1px solid #C5E1A5",
                            color: "#27500A",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#3B6D11",
                              boxShadow: "0 0 8px rgba(59, 109, 17, 0.4)",
                              display: "inline-block",
                            }}
                          />
                          Trading Active
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default MarketPage;