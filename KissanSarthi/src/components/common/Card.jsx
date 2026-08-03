import React from 'react';
import { COLORS } from '../../constants/theme';

export const Card = ({ children, style = {}, glow = false, title }) => (
  <div style={{
    background: COLORS.cardBg, 
    borderRadius: 20, 
    padding: 24,
    boxShadow: glow ? `0 8px 32px ${COLORS.primary}22` : "0 4px 20px rgba(0,0,0,0.03)",
    border: `1px solid ${COLORS.border}80`, 
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
    ...style,
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = glow ? `0 12px 40px ${COLORS.primary}33` : "0 12px 30px rgba(0,0,0,0.06)";
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = glow ? `0 8px 32px ${COLORS.primary}22` : "0 4px 20px rgba(0,0,0,0.03)";
  }}
  title={title}>
    {children}
  </div>
);