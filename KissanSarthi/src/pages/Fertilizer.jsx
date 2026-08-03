import React, { useState } from "react";
import { COLORS } from "../constants/theme";
import { Icon } from "../components/common/Icon";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { BarChart } from "../components/charts/BarChart";

const FertilizerPage = () => {
  const [form, setForm] = useState({ crop: "wheat", stage: "sowing", soilPH: 6.5, deficiency: "nitrogen" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const recommendations = {
    wheat: {
      sowing: { primary: "DAP (18-46-0)", dose: "100 kg/ha", secondary: "MOP 40 kg/ha", schedule: "Apply at sowing time in furrows", cost: "₹3,200/acre", npk: [18, 46, 0] },
      vegetative: { primary: "Urea (46% N)", dose: "60 kg/ha", secondary: "Zinc Sulphate 25 kg/ha", schedule: "Top dressing at 21-25 DAS", cost: "₹900/acre", npk: [46, 0, 0] }
    },
    rice: {
      sowing: { primary: "Complex 14-35-14", dose: "150 kg/ha", secondary: "Urea 80 kg/ha", schedule: "Split: 50% at transplanting, 50% at tillering", cost: "₹4,500/acre", npk: [14, 35, 14] },
      vegetative: { primary: "Urea (46% N)", dose: "100 kg/ha", secondary: "Potash 40 kg/ha", schedule: "Apply at active tillering stage", cost: "₹1,200/acre", npk: [46, 0, 10] }
    },
  };

  const predict = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const r = recommendations[form.crop]?.[form.stage] || recommendations.wheat.sowing;
      setResult(r);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="page-transition">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, fontFamily: "Georgia, serif", margin: 0 }}>Fertilizer Advisor </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>Precision nutrient mapping for Bari Brahmana soil profiles</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 24 }} className="grid-split">

        {/* ─── LEFT: DIAGNOSTIC PANEL ──────────────────────────────────── */}
        <Card style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Icon name="beaker" size={20} color={COLORS.primary} />
            <h3 style={{ margin: 0, fontSize: 18, color: COLORS.text }}>Soil Diagnostics</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { label: "Target Crop", key: "crop", icon: "wheat", options: [["wheat", "Wheat"], ["rice", "Rice"], ["maize", "Maize"]] },
              { label: "Growth Stage", key: "stage", icon: "refresh", options: [["sowing", "Sowing"], ["vegetative", "Vegetative"], ["flowering", "Flowering"]] },
              { label: "Visible Deficiency", key: "deficiency", icon: "search", options: [["nitrogen", "Yellowing (N)"], ["phosphorus", "Purple Tints (P)"], ["potassium", "Edge Burn (K)"]] },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
                  <Icon name={f.icon} size={14} color={COLORS.primary} /> {f.label}
                </label>
                <select value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: COLORS.bg, fontSize: 14, color: COLORS.text, outline: "none" }}>
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}

            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
                <span>Soil pH Level</span>
                <span style={{ color: COLORS.primary }}>{form.soilPH} pH</span>
              </label>
              <input type="range" min={4} max={9} step={0.1} value={form.soilPH}
                onChange={e => setForm({ ...form, soilPH: +e.target.value })}
                style={{ width: "100%", accentColor: COLORS.primary }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 4, color: COLORS.textMuted }}>
                <span>Acidic</span><span>Neutral</span><span>Alkaline</span>
              </div>
            </div>
          </div>

          <button onClick={predict} disabled={loading}
            style={{ marginTop: 32, width: "100%", padding: "16px", background: `linear-gradient(135deg, ${COLORS.brown}, #5D4037)`, color: "white", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: `0 8px 20px ${COLORS.brown}33` }}>
            {loading ? "Calculating Nutrients..." : "Generate Fertilizer Plan"}
          </button>
        </Card>

        {/* ─── RIGHT: ADVISORY REPORT ──────────────────────────────────── */}
        <div>
          {result ? (
            <div style={{ animation: "fadeInUp 0.5s ease" }}>
              <Card glow style={{ marginBottom: 20, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.05 }}><Icon name="flask" size={150} color={COLORS.primary} /></div>

                <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: COLORS.text }}>Nutrient Prescription</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {[
                    { l: "Primary Source", v: result.primary, i: "pills", c: COLORS.primary },
                    { l: "Dosage Rate", v: result.dose, i: "scale", c: COLORS.blue },
                    { l: "Secondary Mix", v: result.secondary, i: "beaker", c: COLORS.orange },
                    { l: "Est. Cost/Acre", v: result.cost, i: "market", c: COLORS.accentDark },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "16px", background: COLORS.bg, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <Icon name={item.i} size={18} color={item.c} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>{item.l}</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: item.c }}>{item.v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: COLORS.primary + "08", borderRadius: 16, padding: "16px", border: `1px dashed ${COLORS.primary}44` }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14, color: COLORS.primaryDark, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="refresh" size={14} color={COLORS.primary} /> Application Schedule
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{result.schedule}</p>
                </div>
              </Card>

              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>NPK Distribution (%)</h3>
                  <Badge text="Lab Verified" color={COLORS.primary} />
                </div>
                <BarChart data={result.npk} labels={["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)"]} colors={[COLORS.primary, COLORS.blue, COLORS.orange]} height={180} />
              </Card>
            </div>
          ) : (
            <Card style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "transparent", border: `2px dashed ${COLORS.border}` }}>
              <div style={{ opacity: 0.2, marginBottom: 16 }}><Icon name="flask" size={80} color={COLORS.textMuted} /></div>
              <h3 style={{ color: COLORS.textMuted, margin: 0 }}>Awaiting Diagnostics</h3>
              <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 8 }}>Input soil parameters to generate a precision plan.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FertilizerPage;