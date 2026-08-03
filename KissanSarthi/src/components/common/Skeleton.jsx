import React from 'react';
import { COLORS } from '../../constants/theme';

export const Skeleton = ({ width, height, borderRadius = 8, style = {} }) => {
  return (
    <div
      style={{
        width: width || '100%',
        height: height || 20,
        borderRadius,
        background: `linear-gradient(90deg, ${COLORS.bg} 25%, #e0e0e0 50%, ${COLORS.bg} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
