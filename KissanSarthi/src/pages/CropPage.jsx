import React, { useState } from "react";
import axios from "axios";
import { COLORS } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { StatPill } from "../components/common/StatPill";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_API_KEY_HERE";

const CropPage = () => {
  const [form, setForm] = useState({ soil: "loamy", temp: 28, rainfall: 150, season: "kharif", nitrogen: 60, humidity: 70 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predict = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    const promptText = `
      You are an expert agronomist AI for the KissanSarthi application.
      Based on the following field parameters, recommend the best crop to maximize yield.
      
      Parameters:
      - Soil Type: ${form.soil}
      - Season: ${form.season}
      - Nitrogen Content: ${form.nitrogen} kg/ha
      - Average Temperature: ${form.temp} °C
      - Annual Rainfall: ${form.rainfall} mm
      
      Return ONLY a valid JSON object (without markdown block formatting) strictly following this exact structure:
      {
        "crop": "Name of the Crop",
        "icon": "One of: leafAlt, sparkles, wheat, rice, onion, tomato, potato, mustard",
        "yield": "Estimated yield e.g. 5-6 ton/ha",
        "confidence": 92, // number between 0 and 100
        "variety": "Specific high-yield varieties",
        "time": "Growth cycle e.g. 110-130 days",
        "tips": ["Tip 1", "Tip 2", "Tip 3"] // Exactly 3 short actionable agronomic tips
      }
    `;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0].content.parts[0].text) {
        const jsonText = response.data.candidates[0].content.parts[0].text;
        const parsedResult = JSON.parse(jsonText);
        setResult(parsedResult);
      } else {
        throw new Error("Invalid response from AI");
      }
    } catch (err) {
      console.error("Gemini API Error:", err);
      setError("Failed to get recommendation from AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, fontFamily: "Georgia, serif", margin: 0 }}>
          Crop Intelligence AI <span style={{fontSize: 16, color: COLORS.primary}}>⚡ Powered by Gemini</span>
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
          Our neural engine analyzes your soil and climate data to suggest high-yield crops.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }} className="grid-split">

        {/* ─── LEFT: PARAMETERS PANEL ───────────────────────────────────── */}
        <Card style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Icon name="admin" size={20} color={COLORS.primary} />
            <h3 style={{ margin: 0, fontSize: 18, color: COLORS.text }}>Field Parameters</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="form-group">
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 8 }}> Soil Environment </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <select value={form.soil} onChange={e => setForm({ ...form, soil: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: COLORS.bg, fontSize: 14, outline: "none" }}>
                  <option value="loamy">Loamy Soil</option>
                  <option value="sandy">Sandy Soil</option>
                  <option value="clay">Clay Soil</option>
                </select>
                <select value={form.season} onChange={e => setForm({ ...form, season: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: COLORS.bg, fontSize: 14, outline: "none" }}>
                  <option value="kharif">Kharif (Monsoon)</option>
                  <option value="rabi">Rabi (Winter)</option>
                  <option value="zaid">Zaid (Summer)</option>
                </select>
              </div>
            </div>

            {[
              { label: "Nitrogen Content (N)", key: "nitrogen", icon: "chem", unit: "kg/ha", min: 0, max: 200 },
              { label: "Avg. Temperature", key: "temp", icon: "sun", unit: "°C", min: 10, max: 50 },
              { label: "Annual Rainfall", key: "rainfall", icon: "drop", unit: "mm", min: 50, max: 1000 },
            ].map(item => (
              <div key={item.key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name={item.icon} size={16} color={COLORS.primary} /> {item.label}
                  </span>
                  <span style={{ color: COLORS.primary, fontWeight: 800 }}>{form[item.key]} {item.unit}</span>
                </div>
                <input type="range" min={item.min} max={item.max} value={form[item.key]}
                  onChange={e => setForm({ ...form, [item.key]: parseInt(e.target.value) })}
                  style={{ width: "100%", accentColor: COLORS.primary, cursor: "pointer" }} />
              </div>
            ))}
          </div>

          <button onClick={predict} disabled={loading}
            style={{ marginTop: 32, width: "100%", padding: "16px", background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`, color: "white", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: loading ? "wait" : "pointer", boxShadow: `0 8px 20px ${COLORS.primary}33`, transition: "all 0.2s" }}
            onMouseDown={e => { if(!loading) e.currentTarget.style.transform = "scale(0.98)"}}
            onMouseUp={e => { if(!loading) e.currentTarget.style.transform = "scale(1)"}}>
            {loading ? "Generative AI Analyzing..." : "Generate Pro Recommendation"}
          </button>
        </Card>

        {/* ─── RIGHT: RESULTS PANEL ──────────────────────────────────────── */}
        <div style={{ minHeight: 400 }}>
          {error && (
             <div style={{ padding: "16px", background: "#FFEBEE", border: "1px solid #FFCDD2", color: "#C62828", borderRadius: 12, marginBottom: 20 }}>
               <strong>Error:</strong> {error}
             </div>
          )}

          {result ? (
            <div style={{ animation: "fadeInUp 0.5s ease forwards" }}>
              <Card glow style={{ border: `1px solid ${COLORS.primary}44`, position: "relative", overflow: "hidden", marginBottom: 20 }}>
                {/* Visual Background Accent */}
                <div style={{ position: "absolute", top: -20, right: -20, opacity: 0.05 }}><Icon name={result.icon || "leafAlt"} size={200} color={COLORS.primary} /></div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
                  <div>
                    <Badge text="Best Match Optimized" color={COLORS.primary} />
                    <h2 style={{ fontSize: 36, fontWeight: 800, color: COLORS.primaryDark, margin: "12px 0 4px", fontFamily: "Georgia" }}>{result.crop}</h2>
                    <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Variety: <span style={{ color: COLORS.text, fontWeight: 600 }}>{result.variety}</span></p>
                  </div>
                  <div style={{ background: COLORS.bg, padding: 15, borderRadius: 20 }}>
                    <Icon name={result.icon || "leafAlt"} size={48} color={COLORS.primary} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "24px 0" }}>
                  <StatPill value={result.yield} label="Predicted Yield" icon="trend" color={COLORS.primary} />
                  <StatPill value={result.time} label="Growth Cycle" icon="refresh" color={COLORS.blue} />
                </div>

                <div style={{ background: COLORS.bg, borderRadius: 16, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>AI Confidence Score</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.primary }}>{result.confidence}%</span>
                  </div>
                  <div style={{ height: 10, background: "#e0e0e0", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${result.confidence}%`, background: `linear-gradient(90deg, ${COLORS.primaryLight}, ${COLORS.primary})`, borderRadius: 5, transition: "width 1s ease" }} />
                  </div>
                </div>
              </Card>

              <Card>
                <h4 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="check" size={18} color={COLORS.primary} /> Agronomic Expert Tips
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {result.tips && result.tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "12px", background: COLORS.bg, borderRadius: 12, borderLeft: `4px solid ${COLORS.primary}` }}>
                      <span style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.4 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : !loading && (
            <Card style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px dashed ${COLORS.border}`, background: "transparent" }}>
              <div style={{ opacity: 0.3, marginBottom: 16 }}><Icon name="leafAlt" size={80} color={COLORS.textMuted} /></div>
              <h3 style={{ color: COLORS.textMuted, margin: 0 }}>Awaiting Input Data</h3>
              <p style={{ color: COLORS.textMuted, fontSize: 14, textAlign: "center", maxWidth: 250, marginTop: 8 }}>Fill in your field details and click analyze to start the Gemini AI engine.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropPage;