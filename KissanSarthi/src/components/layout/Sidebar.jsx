import React from "react";
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { COLORS, NAV_ITEMS } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ open }) => {
  const { t } = useTranslation();
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentRole = role || user?.role || 'farmer';
  const visibleItems = NAV_ITEMS.filter((item) => item.id !== 'admin' || currentRole === 'admin');

  return (
    <aside
      style={{
        position: "fixed",
        top: 72,
        bottom: 0,
        left: 0,
        width: open ? 240 : 0,
        overflow: "hidden",
        background: "linear-gradient(180deg, #0A2416 0%, #143A26 50%, #0B2215 100%)",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 150,
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: open ? "4px 0 24px rgba(0,0,0,0.12)" : "none"
      }}
    >
      {/* Ambient glowing radial orbs */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -50, left: -40,
        width: 180, height: 180, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(5, 150, 105, 0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ padding: "18px 12px", position: "relative" }}>
        <div style={{ 
          fontSize: 10, 
          fontWeight: 800, 
          letterSpacing: "0.08em", 
          textTransform: "uppercase", 
          color: "rgba(255,255,255,0.4)", 
          padding: "0 12px 10px",
          margin: 0
        }}>
          Farm Management
        </div>

        {visibleItems.map((item) => {
          const label = t(`sidebar.${item.id}`, item.label);
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 14px",
                marginBottom: 4,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                position: "relative",
                background: "transparent",
                color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.68)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 13.5,
                transition: "color 0.2s ease",
                textAlign: "left",
                outline: "none"
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.68)";
              }}
            >
              {/* Framer motion animated sliding active pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActivePill"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 12,
                    background: "linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)",
                    border: "1px solid rgba(110, 231, 183, 0.35)",
                    boxShadow: "0 4px 14px rgba(5, 150, 105, 0.2), inset 0 0 12px rgba(16, 185, 129, 0.1)",
                    zIndex: 0
                  }}
                />
              )}

              {isActive && (
                <div style={{
                  position: "absolute", left: -6, top: "25%",
                  bottom: "25%", width: 4,
                  borderRadius: "0 4px 4px 0",
                  background: "#34D399",
                  boxShadow: "0 0 8px #34D399",
                  zIndex: 2
                }} />
              )}

              <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center" }}>
                <Icon
                  name={item.icon}
                  size={19}
                  color={isActive ? "#34D399" : "rgba(255,255,255,0.65)"}
                />
              </span>
              <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;