import React from 'react';

/**
 * Lightweight, high-performance SVG Sparkline for inline table cells.
 * Renders an anti-aliased curved SVG polyline with subtle gradient area fill.
 */
export const Sparkline = ({
  data = [],
  color = '#2E7D32',
  width = 84,
  height = 30,
  strokeWidth = 2,
  fill = true,
}) => {
  const points = (Array.isArray(data) ? data : [])
    .map(Number)
    .filter(Number.isFinite);

  if (points.length < 2) {
    const singleVal = points[0] || 0;
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: '#9E9E9E', fontWeight: 600 }}>₹{singleVal}</span>
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  // Generate SVG coordinate points
  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  });

  // SVG polyline coordinates
  const polylinePoints = coords.map((p) => `${p.x},${p.y}`).join(' ');

  // SVG smooth area path underneath the curve
  const areaPath = `M ${coords[0].x},${coords[0].y} ` +
    coords.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${coords[coords.length - 1].x},${height} L ${coords[0].x},${height} Z`;

  const gradientId = `spark-grad-${Math.abs(points.reduce((acc, v) => acc + v, 0))}-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div style={{ width, height, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        {fill && <path d={areaPath} fill={`url(#${gradientId})`} />}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePoints}
        />
        {/* Highlight latest price point dot */}
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r={2.5}
          fill={color}
          stroke="#ffffff"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
};

export default Sparkline;
