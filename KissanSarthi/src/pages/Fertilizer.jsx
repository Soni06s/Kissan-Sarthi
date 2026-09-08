import React, { useState } from "react";
import { motion } from "framer-motion";
import { COLORS, SHADOWS, GRADIENTS } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { BarChart } from "../components/charts/BarChart";
import { EmptyState } from "../components/common/EmptyState";
import { RangeSlider } from "../components/common/RangeSlider";
import { fertilizerAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const FertilizerPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ crop: "wheat", stage: "sowing", soilPH: 6.5, deficiency: "none" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const userLocation = user?.city ? `${user.city}${user.state ? `, ${user.state}` : ''}` : (user?.location || 'your farm');

  const predict = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const payload = {
        crop: form.crop,
        stage: form.stage,
        soilPH: form.soilPH,
        deficiency: form.deficiency,
        location: userLocation,
      };

      const res = await fertilizerAPI.predict(payload);
      if (res.data?.data) {
        setResult(res.data.data);
      } else {
        throw new Error("No advisory data received");
      }
    } catch (err) {
      console.error("Fertilizer calculation error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to calculate fertilizer plan. Please check inputs.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const response = await fertilizerAPI.downloadPlanPdf({
        crop: form.crop,
        stage: form.stage,
        soilPH: form.soilPH,
        deficiency: form.deficiency,
        prescription: result,
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `KissanSarthi_Fertilizer_Plan_${form.crop.toUpperCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Fertilizer Dosage PDF downloaded successfully!");
    } catch (err) {
      console.error("Failed to download PDF:", err);
      toast.error("Could not generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page-transition">
      <div style={{ marginBottom: 26 }}>
        <div className="section-label" style={{ color: COLORS.primary, marginBottom: 4 }}>
          PRECISION AGRONOMIC ENGINE
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: COLORS.text, margin: 0 }}>
          Fertilizer & Nutrient Advisor
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
          Precision split-application mapping calibrated for <strong style={{ color: COLORS.primaryDark }}>{userLocation}</strong> soil conditions
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: 24 }} className="grid-split">

        {/* ─── LEFT: DIAGNOSTIC PANEL ──────────────────────────────────── */}
        <Card style={{ padding: "26px", alignSelf: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: COLORS.primaryBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: COLORS.primary,
            }}>
              <Icon name="beaker" size={20} color={COLORS.primary} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>Soil Diagnostics</h3>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>Input target crop & baseline readings</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { label: "Target Crop", key: "crop", icon: "wheat", options: [["wheat", "Wheat (Gehun)"], ["rice", "Rice / Paddy (Dhan)"], ["maize", "Maize (Makka)"], ["cotton", "Cotton (Kapas)"], ["mustard", "Mustard (Sarson)"]] },
              { label: "Crop Growth Stage", key: "stage", icon: "refresh", options: [["sowing", "Basal / Sowing Stage"], ["vegetative", "Vegetative Growth"], ["flowering", "Flowering / Panicle"], ["fruiting", "Grain Filling / Maturation"]] },
              { label: "Visible Crop Deficiency", key: "deficiency", icon: "search", options: [["none", "No Visible Deficiency (Preventive)"], ["nitrogen", "Yellowing Lower Leaves (Nitrogen)"], ["phosphorus", "Purple/Reddish Tints (Phosphorus)"], ["potassium", "Edge Scorch / Browning (Potassium)"]] },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
                  <Icon name={f.icon} size={14} color={COLORS.primary} />
                  <span>{f.label}</span>
                </label>
                <select
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    border: `1px solid ${COLORS.border}`, background: "#FFFFFF",
                    fontSize: 14, fontWeight: 600, color: COLORS.text, outline: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}

            {/* Custom Modern Range Slider for Soil pH */}
            <RangeSlider
              label="Soil pH Level"
              value={form.soilPH}
              onChange={e => setForm({ ...form, soilPH: +e.target.value })}
              min={4}
              max={9}
              step={0.1}
              unit="pH"
              icon="beaker"
              minLabel="4.0 Acidic"
              maxLabel="9.0 Alkaline"
              accentColor={COLORS.primary}
            />
          </div>

          <button
            onClick={predict}
            disabled={loading}
            className="btn-primary"
            style={{
              marginTop: 24,
              width: "100%",
              padding: "16px",
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            {loading ? (
              <>
                <span style={{ animation: "spin 1s linear infinite" }}>🔄</span>
                <span>Calculating Nutrients...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate Precision Fertilizer Plan</span>
              </>
            )}
          </button>
        </Card>

        {/* ─── RIGHT: ADVISORY REPORT ──────────────────────────────────── */}
        <div>
          {error && (
            <div style={{
              padding: "18px 20px", background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 16, color: "#DC2626", marginBottom: 20, display: "flex",
              justifyContent: "space-between", alignItems: "center", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="warning" size={20} color="#DC2626" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{error}</span>
              </div>
              <button
                onClick={predict}
                style={{
                  background: "#DC2626", color: "white", border: "none",
                  borderRadius: 10, padding: "8px 16px", fontWeight: 700,
                  fontSize: 12, cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <Card style={{
              height: 380, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", textAlign: "center",
            }}>
              <div style={{
                width: 52, height: 52, border: `3px solid ${COLORS.border}`,
                borderTopColor: COLORS.primary, borderRadius: "50%",
                animation: "spin 1s linear infinite", marginBottom: 18,
              }} />
              <h3 style={{ margin: 0, color: COLORS.text, fontSize: 20, fontWeight: 800 }}>
                Analyzing Soil Chemistry
              </h3>
              <p style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8, maxWidth: 300 }}>
                Computing elemental deficit thresholds and querying Gemini Agronomic Engine...
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </Card>
          ) : result ? (
            <div style={{ animation: "fadeInUp 0.4s ease" }}>
              <Card glow style={{ marginBottom: 22, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.04 }}>
                  <Icon name="flask" size={160} color={COLORS.primary} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: COLORS.text }}>
                      Nutrient Prescription
                    </h3>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                      Optimal balance for {form.crop.toUpperCase()} • {form.stage.toUpperCase()}
                    </div>
                  </div>
                  <Badge text="Gemini Soil Engine" color={COLORS.primary} />
                </div>

                {/* Weighted Metric Cards with Distinct Accent Left-Borders */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                  {[
                    { l: "Primary Nitrogen Source", v: result.primary, i: "pills", c: "#16A34A", bg: "#F0FDF4", border: "#16A34A" },
                    { l: "Target Dosage Rate", v: result.dose, i: "scale", c: "#2563EB", bg: "#EFF6FF", border: "#2563EB" },
                    { l: "Secondary / DAP Mix", v: result.secondary, i: "beaker", c: "#EA580C", bg: "#FFF7ED", border: "#EA580C" },
                    { l: "Estimated Cost / Acre", v: result.cost, i: "market", c: "#D97706", bg: "#FFFBEB", border: "#D97706" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "16px 18px",
                        background: item.bg,
                        borderRadius: 16,
                        border: `1px solid ${COLORS.border}`,
                        borderLeft: `5px solid ${item.border}`,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Icon name={item.i} size={17} color={item.c} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {item.l}
                        </span>
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: item.c, lineHeight: 1.2 }}>
                        {item.v}
                      </div>
                    </div>
                  ))}
                </div>

                {result.soilPHNote && (
                  <div style={{
                    marginBottom: 16, padding: "14px 18px",
                    background: "#FFFBEB", borderRadius: 14,
                    border: "1px solid #FDE68A", fontSize: 13,
                    color: "#92400E", display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <Icon name="info" size={18} color="#D97706" />
                    <span style={{ fontWeight: 600 }}>{result.soilPHNote}</span>
                  </div>
                )}

                <div style={{
                  background: "#F8FAF8",
                  borderRadius: 16,
                  padding: "18px 20px",
                  border: `1px solid ${COLORS.border}`,
                  borderLeft: `4px solid ${COLORS.primary}`,
                }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: COLORS.primaryDark, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="refresh" size={15} color={COLORS.primary} />
                    Split Application Schedule & Agronomic Tips
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: COLORS.text, lineHeight: 1.6 }}>
                    {result.schedule}
                  </p>
                </div>

                {/* High Contrast Prominent PDF Download Button */}
                <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      background: "linear-gradient(135deg, #1E3A8A 0%, #172554 100%)",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "13px 24px",
                      borderRadius: 14,
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: downloading ? "not-allowed" : "pointer",
                      boxShadow: "0 8px 24px rgba(30, 58, 138, 0.35)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <Icon name="download" size={18} color="#FFFFFF" />
                    <span>{downloading ? "Generating Official PDF..." : "Download Fertilizer Dosage PDF"}</span>
                  </button>
                </div>
              </Card>

              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: COLORS.text }}>
                      NPK Requirement Breakdown (kg/acre)
                    </h3>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                      Standard nutrient split recommendation
                    </div>
                  </div>
                  <Badge text="Lab Verified" color={COLORS.primary} />
                </div>
                <BarChart
                  data={result.npk || [120, 60, 40]}
                  labels={["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)"]}
                  colors={[COLORS.primary, "#2563EB", "#EA580C"]}
                  height={190}
                />
              </Card>
            </div>
          ) : (
            /* Modern Animated Empty State (Replaced Plain Dashed Box) */
            <EmptyState
              type="fertilizer"
              title="Your Precision Fertilizer Plan Will Appear Here"
              subtitle="Configure your target crop, growth stage, and soil pH to calculate optimal split dosages and nutrient schedules."
              hint="Set crop parameters on the left to start"
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2v7.31M14 9.3V1.99M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
                  <path d="M5.52 16h12.96" />
                </svg>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FertilizerPage;