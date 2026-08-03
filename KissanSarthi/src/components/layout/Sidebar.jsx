import React from "react";
import { useTranslation } from 'react-i18next';
import { COLORS, NAV_ITEMS } from "../../constants/theme";
import { Icon } from "../common/Icon";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ open }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      style={{
        position: "fixed",
        top: 62,
        bottom: 0,
        left: 0,
        width: open ? 220 : 0,
        overflow: "hidden",
        background: "linear-gradient(175deg, #1a3d1a 0%, #2d6b2d 45%, #1e5c1e 100%)",
        transition: "width 0.3s ease",
        zIndex: 150,
      }}
    >
      {/* Ambient orbs */}
      <div style={{
        position: "absolute", top: -50, right: -40,
        width: 130, height: 130, borderRadius: "50%",
        background: "rgba(180,230,120,0.07)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -40, left: -30,
        width: 110, height: 110, borderRadius: "50%",
        background: "rgba(100,200,80,0.06)", pointerEvents: "none",
      }} />

      <div style={{ padding: "16px 8px", position: "relative" }}>
        {NAV_ITEMS.map((item) => {
          const label = item.label;
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
                padding: "11px 12px",
                marginBottom: 4,
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                position: "relative",
                background: isActive ? "rgba(210,255,150,0.18)" : "transparent",
                boxShadow: isActive
                  ? "inset 0 0 0 0.5px rgba(180,240,100,0.25)"
                  : "none",
                color: isActive ? "#d4f7a0" : "rgba(255,255,255,0.65)",
                fontWeight: 500,
                fontSize: 14,
                transition: "all 0.18s ease",
              }}
            >
              {isActive && (
                <div style={{
                  position: "absolute", left: 0, top: "50%",
                  transform: "translateY(-50%)",
                  width: 3, height: 20,
                  borderRadius: "0 3px 3px 0",
                  background: "#a8e063",
                }} />
              )}
              <Icon
                name={item.icon}
                size={20}
                color={isActive ? "#d4f7a0" : "rgba(255,255,255,0.65)"}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;