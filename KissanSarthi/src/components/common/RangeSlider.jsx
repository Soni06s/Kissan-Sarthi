import React, { useState } from 'react';
import { COLORS } from '../../constants/theme';
import { Icon } from './Icon';

export const RangeSlider = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  icon = null,
  minLabel = null,
  maxLabel = null,
  accentColor = COLORS.primary,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div style={{ marginBottom: 18 }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 7 }}>
          {icon && <Icon name={icon} size={16} color={accentColor} />}
          <span>{label}</span>
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: accentColor,
            background: 'rgba(21, 128, 61, 0.08)',
            padding: '2px 9px',
            borderRadius: 8,
            transition: 'all 0.15s ease',
            boxShadow: isHovered ? '0 2px 6px rgba(21, 128, 61, 0.15)' : 'none',
          }}
        >
          {value} {unit}
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', padding: '4px 0' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="modern-slider"
          style={{
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${percentage}%, #E2E8F0 ${percentage}%, #E2E8F0 100%)`,
          }}
        />
      </div>

      {(minLabel || maxLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: 500 }}>
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
};

export default RangeSlider;
