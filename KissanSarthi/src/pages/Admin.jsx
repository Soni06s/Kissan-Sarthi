import React from 'react';
import { motion } from 'framer-motion'; // 1. Import Framer Motion
import { COLORS } from '../constants/theme';
import { Icon } from '../components/common/Icon';

const stats = [
  { label: "Total Farmers", value: "12,847", trend: "↑ 4.2%", trendUp: true, sub: "Registered users", iconColor: "#3B6D11", bgColor: "#EAF3DE" },
  { label: "Queries Today", value: "849", trend: "↑ 12%", trendUp: true, sub: "vs yesterday", iconColor: "#854F0B", bgColor: "#FAEEDA" },
  { label: "Active Alerts", value: "3", trend: "Critical", trendUp: false, sub: "2 critical · 1 warn", iconColor: "#A32D2D", bgColor: "#FCEBEB" },
];

const users = [
  { name: "Ramesh Kumar", initials: "RK", location: "Samba, J&K", joined: "Today, 9:14 am", plan: "Pro", avatarBg: "#EAF3DE", avatarColor: "#27500A" },
  { name: "Ravi Singh", initials: "RS", location: "Kathua, J&K", joined: "Today, 8:52 am", plan: "Basic", avatarBg: "#E6F1FB", avatarColor: "#0C447C" },
  { name: "Priya Devi", initials: "PD", location: "Udhampur, J&K", joined: "Yesterday", plan: "Pro", avatarBg: "#FAEEDA", avatarColor: "#633806" },
  { name: "Mohan Joshi", initials: "MJ", location: "Reasi, J&K", joined: "Yesterday", plan: "New", avatarBg: "#EAF3DE", avatarColor: "#27500A" },
];

const planBadge = {
  Pro: { bg: "#EAF3DE", color: "#27500A" },
  Basic: { bg: "#F1EFE8", color: "#5F5E5A" },
  New: { bg: "#E6F1FB", color: "#0C447C" },
};

const systemItems = [
  { name: "AI Crop Advisor", sub: "99.9% uptime", status: "on", cpu: 38 },
  { name: "Market price feed", sub: "Live · 2s delay", status: "on", cpu: 55 },
  { name: "Weather API", sub: "Elevated latency", status: "warn", cpu: 78 },
  { name: "Push notifications", sub: "Operational", status: "on", cpu: 22 },
];

const dotColor = { on: "#639922", warn: "#f59e0b", off: "#E24B4A" };

const AdminPage = () => (
  // 2. Wrap the entire return in a motion.div for professional entry
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.5, ease: "easeOut" }}
    style={{ paddingBottom: 40 }}
  >

    {/* ─── HEADER — matches DashboardPage hero bar ─── */}
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 30,
      background: `linear-gradient(to right, white, ${COLORS.bg})`,
      padding: "24px",
      borderRadius: 24,
      borderLeft: `6px solid ${COLORS.primary}`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
    }}>
      <div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: COLORS.text, fontFamily: "Georgia, serif", margin: 0 }}>
          Admin Control Panel
        </h1>
        <p style={{ color: COLORS.textMuted, margin: "6px 0 0", fontSize: 16, fontWeight: 500 }}>
          Farm Command Center •{" "}
          <span style={{ color: COLORS.primary }}>AgriSmart Platform</span> •{" "}
          {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#fff3e0", border: "0.5px solid #f59e0b",
          borderRadius: 20, padding: "6px 12px",
          fontSize: 12, fontWeight: 800, color: "#854F0B",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          3 Active Alerts
        </div>
        <button style={{
          background: COLORS.primary, border: "none", borderRadius: 12,
          padding: "8px 18px", fontSize: 12, fontWeight: 800,
          color: "#fff", cursor: "pointer", letterSpacing: "0.02em",
        }}>
          Export Report
        </button>
      </div>
    </div>

    {/* ─── KPI STAT CARDS — matches DashboardPage KPI grid ─── */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 25 }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 20,
          padding: 24,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: s.bgColor,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={["community", "bot", "warning"][i]} size={26} color={s.iconColor} />
            </div>
            <span style={{
              fontSize: 12, fontWeight: 800, color: s.iconColor,
              background: s.bgColor, padding: "6px 12px", borderRadius: 12,
              alignSelf: "flex-start",
            }}>
              {s.trend}
            </span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, color: COLORS.text, fontFamily: "Georgia, serif" }}>
            {s.value}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textMuted, marginTop: 4 }}>
            {s.label}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2, opacity: 0.6 }}>
            {s.sub}
          </div>
        </div>
      ))}
    </div>

    {/* ─── BOTTOM GRID ─── */}
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>

      {/* Users Table */}
      <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Recent User Registrations</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>Latest farmer onboardings</p>
          </div>
          <button style={{
            fontSize: 12, fontWeight: 800, color: COLORS.primary,
            background: COLORS.bg, border: "none", borderRadius: 10,
            padding: "6px 14px", cursor: "pointer",
          }}>
            View all →
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["User", "Location", "Joined", "Plan"].map(h => (
                <th key={h} style={{
                  textAlign: "left", fontSize: 10, fontWeight: 800,
                  color: COLORS.textMuted, letterSpacing: "0.06em",
                  textTransform: "uppercase", padding: "0 10px 10px",
                  borderBottom: `1px solid ${COLORS.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i}>
                <td style={{ padding: 12, borderBottom: i < users.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: u.avatarBg, color: u.avatarColor,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800,
                    }}>{u.initials}</div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: COLORS.textMuted, padding: 12, borderBottom: i < users.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  {u.location}
                </td>
                <td style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, padding: 12, borderBottom: i < users.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  {u.joined}
                </td>
                <td style={{ padding: 12, borderBottom: i < users.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <span style={{
                    background: planBadge[u.plan].bg, color: planBadge[u.plan].color,
                    padding: "6px 12px", borderRadius: 12,
                    fontSize: 12, fontWeight: 800,
                  }}>{u.plan}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* System Health */}
      <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>System Health</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>Live service telemetry</p>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 800, color: "#3B6D11",
            background: "#EAF3DE", padding: "6px 12px", borderRadius: 12,
          }}>
            All Systems Up
          </span>
        </div>
        {systemItems.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: i < systemItems.length - 1 ? `1px solid ${COLORS.border}` : "none",
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor[s.status], display: "inline-block" }} />
                {s.name}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 15, marginTop: 2 }}>{s.sub}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted }}>CPU {s.cpu}%</div>
              <div style={{ height: 5, width: 80, background: COLORS.bg, borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.cpu}%`, background: s.status === "warn" ? "#f59e0b" : COLORS.primary, borderRadius: 3 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default AdminPage;