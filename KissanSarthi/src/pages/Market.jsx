import React, { useState, useEffect } from "react";
import axios from "axios";
import { COLORS } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { BarChart } from "../components/charts/BarChart";
import { LineChart } from "../components/charts/LineChart";

const initialCrops = [
  { name: "Wheat", icon: "wheat", price: 2480, prev: 2380, trend: "up", vol: "Low" },
  { name: "Rice", icon: "rice", price: 3200, prev: 3100, trend: "up", vol: "Low" },
  { name: "Onion", icon: "onion", price: 2800, prev: 3200, trend: "down", vol: "Med" },
  { name: "Tomato", icon: "tomato", price: 1200, prev: 900, trend: "up", vol: "High" },
  { name: "Potato", icon: "potato", price: 1400, prev: 1350, trend: "up", vol: "Low" },
  { name: "Mustard", icon: "mustard", price: 5800, prev: 5600, trend: "up", vol: "Low" },
];

const MarketPage = () => {
  const [selected, setSelected] = useState("Wheat");
  const [marketCrops, setMarketCrops] = useState(initialCrops);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const weekData = {
    Wheat: [2200, 2280, 2350, 2300, 2420, 2450, 2480],
    Rice: [3000, 3050, 3100, 3080, 3150, 3200, 3200],
    Onion: [3500, 3400, 3300, 3200, 3000, 2900, 2800]
  };

  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOV_API_KEY || "YOUR_API_KEY_HERE";
        
        // If no real API key is provided, we simulate the live feed for demonstration purposes
        if (apiKey === "YOUR_API_KEY_HERE") {
          setMarketCrops(prevCrops => 
            prevCrops.map(crop => {
              const change = (Math.random() - 0.5) * 50; // Random fluctuation between -25 and +25
              const newPrice = Math.round(crop.price + change);
              return {
                ...crop,
                prev: crop.price,
                price: newPrice,
                trend: newPrice >= crop.price ? "up" : "down"
              };
            })
          );
          setLastUpdated(new Date());
          return;
        }

        // Actual API Fetch (Government Mandi API)
        const response = await axios.get(
          `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=50`
        );
        
        if (response.data && response.data.records) {
          const records = response.data.records;
          
          setMarketCrops(prevCrops => 
            prevCrops.map(crop => {
              // Find matching commodity in the API response (case insensitive)
              const record = records.find(r => 
                r.commodity.toLowerCase().includes(crop.name.toLowerCase())
              );
              
              if (record && record.modal_price) {
                const newPrice = parseInt(record.modal_price);
                return {
                  ...crop,
                  prev: crop.price,
                  price: newPrice,
                  trend: newPrice >= crop.price ? "up" : "down"
                };
              }
              return crop;
            })
          );
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch live mandi prices:", error);
      }
    };

    // Fetch immediately on mount
    fetchLivePrices();

    // Poll every 5 seconds
    const interval = setInterval(fetchLivePrices, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-transition">
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, fontFamily: "Georgia, serif", margin: 0 }}>Market Analytics Hub </h1>
          <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
            Real-time commodity terminal for Mandis (Updated: {lastUpdated.toLocaleTimeString()})
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: COLORS.primary, fontWeight: "bold" }}>Updating every 5s</span>
          <Badge text="Live Feed" color={COLORS.primary} />
        </div>
      </div>

      {/* ─── MARKET SENTIMENT STRIP ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { l: "Market Trend", v: "Bullish", i: "trend", c: COLORS.primary },
          { l: "Top Gainer", v: "Tomato (+33%)", i: "tomato", c: COLORS.orange },
          { l: "Price Index", v: "↑ 5.2%", i: "star", c: COLORS.primaryDark },
          { l: "Mandi Status", v: "Open", i: "check", c: COLORS.blue },
        ].map((s, idx) => (
          <Card key={idx} style={{ padding: "16px", borderLeft: `4px solid ${s.c}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Icon name={s.i} size={20} color={s.c} />
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>{s.l}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 24 }} className="grid-split">
        {/* ─── INTERACTIVE PRICE CHART ─────────────────────────────── */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Weekly Price Trend</h3>
            <div style={{ display: "flex", background: COLORS.bg, padding: 4, borderRadius: 10 }}>
              {["Wheat", "Rice", "Onion"].map(c => (
                <button key={c} onClick={() => setSelected(c)} style={{ padding: "6px 14px", border: "none", borderRadius: 8, background: selected === c ? "white" : "transparent", color: selected === c ? COLORS.primary : COLORS.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 700, boxShadow: selected === c ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>{c}</button>
              ))}
            </div>
          </div>
          <BarChart data={weekData[selected]} labels={["M", "T", "W", "T", "F", "S", "S"]} colors={Array(7).fill(COLORS.primary)} height={220} />
        </Card>

        {/* ─── QUICK WATCHLIST ───────────────────────────────────────── */}
        <Card>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Top Movers</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {marketCrops.slice(0, 4).map((crop, i) => (
              <div key={i} style={{ padding: "12px", border: `1px solid ${COLORS.border}`, borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Icon name={crop.icon} size={24} color={COLORS.primary} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{crop.name}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}> </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800 }}>₹{crop.price}</div>
                  <div style={{ fontSize: 11, color: crop.trend === "up" ? COLORS.primary : COLORS.red, fontWeight: 700 }}>
                    {crop.trend === "up" ? "↑" : "↓"} {Math.abs(((crop.price - crop.prev) / crop.prev) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── COMMODITY EXCHANGE TERMINAL ────────────────────────────── */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Regional Mandi Prices</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {["Commodity", "Price (₹/Q)", "Change", "7D Trend", "Volatility", "Status"].map(h => (
                  <th key={h} style={{ padding: "16px 24px", textAlign: "left", fontSize: 12, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marketCrops.map((crop, i) => {
                const isUp = crop.trend === "up";
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}`, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#fafcfa"}>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ background: COLORS.bg, padding: 8, borderRadius: 10 }}>
                          <Icon name={crop.icon} size={20} color={COLORS.primary} />
                        </div>
                        <span style={{ fontWeight: 700, color: COLORS.text }}>{crop.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", fontWeight: 800, fontSize: 16 }}>₹{crop.price.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: isUp ? COLORS.primary + "15" : COLORS.red + "15", color: isUp ? COLORS.primary : COLORS.red }}>
                        {isUp ? "+" : "-"}{Math.abs(((crop.price - crop.prev) / (crop.prev || 1)) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ width: 80, height: 30 }}>
                        <LineChart data={isUp ? [80, 85, 82, 90, 95] : [95, 90, 92, 85, 80]} color={isUp ? COLORS.primary : COLORS.red} height={30} fill={false} />
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 13, color: COLORS.textMuted }}>{crop.vol}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.primary }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>Active</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default MarketPage;