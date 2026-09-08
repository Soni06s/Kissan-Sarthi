import React from 'react';
import { COLORS, SHADOWS } from '../../constants/theme';

export const Card = ({
  children,
  style = {},
  glow = false,
  glass = false,
  hoverable = false,
  title,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: glass
          ? 'rgba(255, 255, 255, 0.85)'
          : COLORS.cardBg,
        backdropFilter: glass ? 'blur(16px)' : undefined,
        WebkitBackdropFilter: glass ? 'blur(16px)' : undefined,
        borderRadius: 20,
        padding: 24,
        boxShadow: glow
          ? SHADOWS.glow
          : SHADOWS.md,
        border: glow
          ? `1px solid rgba(21, 128, 61, 0.25)`
          : `1px solid ${COLORS.border}`,
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease',
        cursor: onClick || hoverable ? 'pointer' : 'default',
        position: 'relative',
        ...style,
      }}
      onMouseEnter={e => {
        if (hoverable || onClick) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = glow
            ? '0 0 32px rgba(34, 197, 94, 0.35)'
            : SHADOWS.lg;
          e.currentTarget.style.borderColor = 'rgba(21, 128, 61, 0.25)';
        }
      }}
      onMouseLeave={e => {
        if (hoverable || onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = glow ? SHADOWS.glow : SHADOWS.md;
          e.currentTarget.style.borderColor = glow ? 'rgba(21, 128, 61, 0.25)' : COLORS.border;
        }
      }}
      title={title}
    >
      {children}
    </div>
  );
};