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
  lowLabel = null,
  highLabel = null,
  accentColor = COLORS.primary,
  color = null,
}) => {
  const finalColor = color || accentColor || COLORS.primary;
  const finalMinLabel = minLabel || lowLabel;
  const finalMaxLabel = maxLabel || highLabel;

  // Runtime dev assertion to prevent SyntheticEvent or objects from ever being stored as slider value
  if (process.env.NODE_ENV !== 'production') {
    console.assert(
      typeof value !== 'object' || value === null,
      `[RangeSlider] Value for "${label}" should be a primitive number, received object:`,
      value
    );
  }

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(null);

  const safeNumericValue = typeof value === 'number' ? value : Number(value) || min;
  const activeValue = dragValue !== null ? dragValue : safeNumericValue;
  const percentage = Math.max(0, Math.min(100, ((activeValue - min) / (max - min)) * 100));
  const showTooltip = isDragging || isHovered;

  const handleInputChange = (e) => {
    const rawVal = e?.target ? e.target.value : e;
    const numericVal = Number(rawVal);
    setDragValue(numericVal);
    if (onChange) {
      onChange(e);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragValue(null);
  };

  return (
    <div
      style={{ marginBottom: 18, position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isDragging) setDragValue(null);
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 7 }}>
          {icon && <Icon name={icon} size={16} color={finalColor} />}
          <span>{label}</span>
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: finalColor,
            background: 'rgba(21, 128, 61, 0.08)',
            padding: '2px 9px',
            borderRadius: 8,
            transition: 'all 0.15s ease',
            boxShadow: isHovered ? '0 2px 6px rgba(21, 128, 61, 0.15)' : 'none',
          }}
        >
          {safeNumericValue} {unit}
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', padding: '6px 0' }}>
        {/* Floating Live Dragging Tooltip */}
        {showTooltip && (
          <div
            style={{
              position: 'absolute',
              left: `calc(${percentage}% + ${(0.5 - percentage / 100) * 22}px)`,
              top: -28,
              transform: 'translateX(-50%)',
              background: finalColor,
              color: '#FFFFFF',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              transition: isDragging ? 'none' : 'left 0.1s ease',
            }}
          >
            <span>{activeValue}</span>
            {unit && <span style={{ opacity: 0.85, fontSize: 10 }}>{unit}</span>}
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: `4px solid ${finalColor}`,
              }}
            />
          </div>
        )}

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeNumericValue}
          onChange={handleInputChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleDragEnd}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleDragEnd}
          className="modern-slider"
          style={{
            background: `linear-gradient(to right, ${finalColor} 0%, ${finalColor} ${percentage}%, #E2E8F0 ${percentage}%, #E2E8F0 100%)`,
          }}
        />
      </div>

      {(finalMinLabel || finalMaxLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: 500 }}>
          <span>{finalMinLabel}</span>
          <span>{finalMaxLabel}</span>
        </div>
      )}
    </div>
  );
};

export default RangeSlider;
