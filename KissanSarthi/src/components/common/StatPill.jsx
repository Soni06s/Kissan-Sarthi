import React from 'react';
import { COLORS } from '../../constants/theme';
import { Icon } from './Icon';

export const StatPill = ({ value, label, color = COLORS.primary, icon }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, background: color + "14", borderRadius: 12, padding: "10px 14px" }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon name={icon} size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "Georgia, serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);