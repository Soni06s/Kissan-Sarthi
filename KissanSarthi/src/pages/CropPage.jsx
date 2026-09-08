import React, { useState } from "react";
import { COLORS } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { StatPill } from "../components/common/StatPill";
import EmptyState from "../components/common/EmptyState";
import RangeSlider from "../components/common/RangeSlider";
import { cropAPI } from "../services/api";
import toast from "react-hot-toast";

const mapCropIcon = (cropName) => {
  const c = (cropName || "").toLowerCase();
  if (c.includes("wheat") || c.includes("गेहूं")) return "wheat";
  if (c.includes("rice") || c.includes("paddy") || c.includes("धान")) return "rice";
  if (c.includes("maize") || c.includes("corn") || c.includes("मक्का")) return "maize";
  if (c.includes("mustard") || c.includes("सरसों")) return "mustard";
  if (c.includes("potato") || c.includes("आलू")) return "potato";
  if (c.includes("onion") || c.includes("प्याज")) return "onion";
  if (c.includes("tomato") || c.includes("टमाटर")) return "tomato";
  if (c.includes("soy") || c.includes("सोयाबीन")) return "soybean";
  if (c.includes("sugar") || c.includes("गन्ना")) return "sugarcane";
  if (c.includes("cotton") || c.includes("कपास")) return "cotton";
  return "crop";
};

const CropPage = () => {
  const [form, setForm] = useState({ soil: "loamy", temp: 28, rainfall: 150, season: "kharif", nitrogen: 60, humidity: 70 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const predict = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await cropAPI.recommend({
        soilType: form.soil,
        season: form.season,
        nitrogen: Number(form.nitrogen),
        temperature: Number(form.temp),
        rainfall: Number(form.rainfall),
      });

      const data = response.data?.data;
      if (data) {
        const cropName = data.crop || data.recommendedCrop || "Wheat";
        setResult({
          id: data.id || data._id,
          crop: cropName,
          icon: mapCropIcon(cropName),
          yield: data.yield || "4-5 ton/ha",
          confidence: data.confidence || 92,
          variety: data.variety || "HD-2967, PBW-343",
          time: data.time || "120-150 days",
          tips: data.tips || ["Apply micro-nutrients during flowering.", "Maintain proper soil moisture."],
        });
      } else {
        setError("Gemini advisory service did not return recommendation data.");
      }
    } catch (err) {
      console.error("Crop Recommendation API Error:", err);
      setError(err.response?.data?.message || "Failed to fetch recommendation from Gemini engine. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result?.id) {
      toast.error('No recommendation report ID available');
      return;
    }
    try {
      setDownloading(true);
      const res = await cropAPI.downloadPdf(result.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KissanSarthi-CropAdvisory-${result.crop}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Advisory PDF report downloaded successfully!');
    } catch (err) {
      console.error('Failed to download crop PDF:', err);
      toast.error('Failed to download PDF report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page-transition">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.primary, background: `${COLORS.primary}15`, padding: "4px 10px", borderRadius: 20 }}>
            NEURAL AGRONOMY ENGINE
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.amber, display: "inline-flex", alignItems: "center", gap: 4 }}>
            ⚡ Gemini Pro AI
          </span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: COLORS.text, fontFamily: "var(--font-display, Fraunces, Georgia, serif)", margin: 0, letterSpacing: "-0.02em" }}>
          Crop Intelligence Advisor
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 15, marginTop: 6, maxWidth: 650 }}>
          High-precision multi-factor advisory engine evaluating soil chemistry, seasonal climatology, and regional variety benchmarks.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr", gap: 28 }} className="grid-split">

        {/* ─── LEFT: PARAMETERS PANEL ───────────────────────────────────── */}
        <Card style={{ padding: "26px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, paddingBottom: 14, borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${COLORS.primary}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="settings" size={18} color={COLORS.primary} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.text }}>Field Parameters</h3>
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>Specify soil & local weather conditions</span>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.primary, background: `${COLORS.primary}12`, padding: "3px 8px", borderRadius: 6 }}>
              5 Factors
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="form-group">
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                SOIL & CROPPING SEASON
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>Soil Type</span>
                  <select 
                    value={form.soil} 
                    onChange={e => setForm({ ...form, soil: e.target.value })}
                    style={{ 
                      width: "100%", 
                      padding: "11px 14px", 
                      borderRadius: 12, 
                      border: `1.5px solid ${COLORS.border}`, 
                      background: COLORS.bg, 
                      fontSize: 14, 
                      fontWeight: 600,
                      color: COLORS.text,
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="loamy">Loamy Soil (Balanced)</option>
                    <option value="sandy">Sandy Soil (High Drainage)</option>
                    <option value="clay">Clay Soil (High Retention)</option>
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 4, fontWeight: 600 }}>Season Cycle</span>
                  <select 
                    value={form.season} 
                    onChange={e => setForm({ ...form, season: e.target.value })}
                    style={{ 
                      width: "100%", 
                      padding: "11px 14px", 
                      borderRadius: 12, 
                      border: `1.5px solid ${COLORS.border}`, 
                      background: COLORS.bg, 
                      fontSize: 14, 
                      fontWeight: 600,
                      color: COLORS.text,
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="kharif">Kharif (Monsoon / Autumn)</option>
                    <option value="rabi">Rabi (Winter / Spring)</option>
                    <option value="zaid">Zaid (Summer)</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: `${COLORS.border}88`, margin: "4px 0" }} />

            <RangeSlider
              label="Nitrogen Content (N)"
              icon="chem"
              unit="kg/ha"
              min={0}
              max={200}
              step={1}
              value={form.nitrogen}
              onChange={val => setForm({ ...form, nitrogen: val })}
              color={COLORS.primary}
              lowLabel="0 (Deficient)"
              highLabel="200 (Enriched)"
            />

            <RangeSlider
              label="Average Temperature"
              icon="sun"
              unit="°C"
              min={10}
              max={50}
              step={1}
              value={form.temp}
              onChange={val => setForm({ ...form, temp: val })}
              color="#E65100"
              lowLabel="10°C (Cold)"
              highLabel="50°C (Torrid)"
            />

            <RangeSlider
              label="Expected Rainfall"
              icon="drop"
              unit="mm"
              min={50}
              max={1000}
              step={10}
              value={form.rainfall}
              onChange={val => setForm({ ...form, rainfall: val })}
              color="#1976D2"
              lowLabel="50 mm (Arid)"
              highLabel="1000 mm (Heavy)"
            />
          </div>

          <button 
            onClick={predict} 
            disabled={loading}
            className="btn-primary"
            style={{ 
              marginTop: 28, 
              width: "100%", 
              padding: "15px", 
              borderRadius: 14, 
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round" opacity="0.3"/>
                  <path d="M12 2 A 10 10 0 0 1 22 12" strokeLinecap="round"/>
                </svg>
                <span>Generative AI Analyzing Field...</span>
              </>
            ) : (
              <>
                <Icon name="sparkles" size={18} />
                <span>Generate Pro Recommendation</span>
              </>
            )}
          </button>
        </Card>

        {/* ─── RIGHT: RESULTS PANEL ──────────────────────────────────────── */}
        <div style={{ minHeight: 450, display: "flex", flexDirection: "column" }}>
          {error && (
             <div style={{
               padding: "16px 20px", background: "#FEF2F2", border: "1.5px solid #FCA5A5",
               color: "#B91C1C", borderRadius: 16, marginBottom: 20,
               display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
               boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)"
             }}>
               <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                 <Icon name="warning" size={20} color="#B91C1C" />
                 <span style={{ fontSize: 13, fontWeight: 600 }}>{error}</span>
               </div>
               <button
                 onClick={predict}
                 style={{
                   background: "#B91C1C", color: "white", border: "none",
                   borderRadius: 10, padding: "8px 16px", fontWeight: 700,
                   fontSize: 12, cursor: "pointer", flexShrink: 0
                 }}
               >
                 Retry
               </button>
             </div>
          )}

          {result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "fadeInUp 0.4s ease forwards" }}>
              <Card glow style={{ border: `1.5px solid ${COLORS.primary}44`, position: "relative", overflow: "hidden" }}>
                {/* Visual Background Accent */}
                <div style={{ position: "absolute", top: -30, right: -30, opacity: 0.04, pointerEvents: "none" }}>
                  <Icon name={result.icon || "leafAlt"} size={220} color={COLORS.primary} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
                  <div>
                    <span style={{ 
                      fontSize: 11, 
                      fontWeight: 800, 
                      textTransform: "uppercase", 
                      letterSpacing: "0.06em",
                      color: COLORS.primaryDark,
                      background: `${COLORS.primary}20`,
                      padding: "4px 12px",
                      borderRadius: 20,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5
                    }}>
                      <Icon name="check" size={12} color={COLORS.primaryDark} /> Best Match Optimized
                    </span>
                    <h2 style={{ fontSize: 34, fontWeight: 800, color: COLORS.forest, margin: "14px 0 4px", fontFamily: "var(--font-display, Fraunces, Georgia, serif)", letterSpacing: "-0.01em" }}>
                      {result.crop}
                    </h2>
                    <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>
                      Recommended Variety: <span style={{ color: COLORS.text, fontWeight: 700 }}>{result.variety}</span>
                    </p>
                  </div>
                  <div style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 20, 
                    background: `linear-gradient(135deg, ${COLORS.primaryLight}30, ${COLORS.primary}20)`, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    border: `1px solid ${COLORS.primary}33`,
                    boxShadow: "0 6px 16px rgba(22, 101, 52, 0.08)"
                  }}>
                    <Icon name={result.icon || "leafAlt"} size={36} color={COLORS.primary} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "22px 0 18px" }}>
                  <div style={{ padding: "14px", borderRadius: 14, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLORS.primary}` }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Expected Yield</span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.primaryDark, marginTop: 4 }}>{result.yield}</div>
                  </div>
                  <div style={{ padding: "14px", borderRadius: 14, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid #1976D2` }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Growth Cycle</span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1565C0", marginTop: 4 }}>{result.time}</div>
                  </div>
                </div>

                <div style={{ background: COLORS.bg, borderRadius: 14, padding: "14px 18px", border: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>AI Predictive Confidence</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.primary, background: `${COLORS.primary}18`, padding: "2px 8px", borderRadius: 6 }}>
                      {result.confidence}% Match
                    </span>
                  </div>
                  <div style={{ height: 9, background: "#E2E8F0", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ 
                      height: "100%", 
                      width: `${result.confidence}%`, 
                      background: `linear-gradient(90deg, #10B981, #059669)`, 
                      borderRadius: 6, 
                      transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" 
                    }} />
                  </div>
                </div>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "linear-gradient(135deg, #0F766E, #0D9488)",
                      color: "#fff",
                      border: "none",
                      padding: "12px 22px",
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: downloading ? "wait" : "pointer",
                      boxShadow: "0 6px 18px rgba(13, 148, 136, 0.25)",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <Icon name="download" size={16} />
                    {downloading ? "Compiling Official PDF..." : "Download Official PDF Advisory"}
                  </button>
                </div>
              </Card>

              <Card style={{ padding: "22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${COLORS.amber}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="sparkles" size={16} color={COLORS.amber} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: COLORS.text }}>
                    Agronomic Field Recommendations
                  </h4>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.tips && result.tips.map((tip, i) => (
                    <div key={i} style={{ 
                      display: "flex", 
                      gap: 12, 
                      padding: "12px 14px", 
                      background: COLORS.bg, 
                      borderRadius: 12, 
                      borderLeft: `4px solid ${i === 0 ? COLORS.primary : COLORS.amber}`,
                      border: `1px solid ${COLORS.border}`,
                      borderLeftWidth: 4
                    }}>
                      <span style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5, fontWeight: 500 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : !loading && (
            <EmptyState
              type="crop"
              title="Your AI Recommendation Will Appear Here"
              subtitle="Our neural agronomy engine analyzes soil composition and seasonal climate to predict maximum yield cultivars."
              hint="Adjust soil & climate parameters on the left to analyze"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CropPage;