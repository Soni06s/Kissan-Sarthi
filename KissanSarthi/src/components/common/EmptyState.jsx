import React from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../../constants/theme';

export const EmptyState = ({
  type = 'crop', // 'crop' | 'fertilizer' | 'general'
  title = 'Your AI Recommendation Will Appear Here',
  subtitle = 'Adjust parameters on the left and click generate to calculate precision agronomic insights.',
  hint = 'Fill in field parameters on the left',
  icon = null,
  actionLabel = null,
  onAction = null,
}) => {
  return (
    <div
      style={{
        height: '100%',
        minHeight: 380,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAF8 100%)',
        borderRadius: 22,
        border: `2px dashed rgba(21, 128, 61, 0.22)`,
        padding: '36px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Ambient background soft glow */}
      <div
        style={{
          position: 'absolute',
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, rgba(240, 253, 244, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Animated Graphic Centerpiece */}
      <div style={{ position: 'relative', marginBottom: 22 }}>
        {/* Outer pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            inset: -14,
            borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.15)',
            filter: 'blur(4px)',
          }}
        />

        {/* Inner Circle with Sprout Illustration */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(21, 128, 61, 0.15)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {icon || (
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 20h10" />
              <path d="M10 20c0-6 4-8 4-13" />
              <path d="M14 7c0-4-3-4-3-4s0 4 3 4z" />
              <path d="M10 14c-3 0-5-2-5-5 0 0 3-1 5 1z" />
            </svg>
          )}
        </div>
      </div>

      {/* Typography */}
      <h3
        style={{
          margin: '0 0 8px',
          fontSize: 20,
          fontWeight: 800,
          color: COLORS.text,
          fontFamily: "'Fraunces', Georgia, serif",
          maxWidth: 320,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: COLORS.textMuted,
          maxWidth: 300,
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </p>

      {/* Interactive Guide Hint Pill */}
      <div
        style={{
          marginTop: 20,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#FFFFFF',
          border: '1px solid rgba(22, 163, 74, 0.25)',
          padding: '6px 14px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          color: COLORS.primary,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <span style={{ fontSize: 13 }}>👈</span>
        <span>{hint}</span>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary"
          style={{
            marginTop: 18,
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
