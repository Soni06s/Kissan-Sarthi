import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { COLORS } from '../../constants/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const PriceTrendChart = ({
  data = [],
  labels = [],
  commodity = 'Wheat',
  height = 240,
  color = COLORS.primary,
}) => {
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'

  const points = useMemo(() => {
    return Array.isArray(data) ? data.map(Number).filter(Number.isFinite) : [];
  }, [data]);

  const minPrice = useMemo(() => (points.length ? Math.min(...points) : 0), [points]);
  const maxPrice = useMemo(() => (points.length ? Math.max(...points) : 0), [points]);
  const avgPrice = useMemo(() => {
    return points.length ? Math.round(points.reduce((a, b) => a + b, 0) / points.length) : 0;
  }, [points]);

  const currentPrice = points[points.length - 1] || 0;
  const prevPrice = points[points.length - 2] || currentPrice;
  const deltaPrice = currentPrice - prevPrice;
  const deltaPct = prevPrice ? ((deltaPrice / prevPrice) * 100).toFixed(1) : '0.0';

  const chartData = useMemo(() => {
    return {
      labels: labels.length ? labels : points.map((_, i) => `Day ${i + 1}`),
      datasets: [
        {
          label: `${commodity} Price`,
          data: points,
          borderColor: color,
          borderWidth: chartType === 'area' ? 3 : 1.5,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height || 240);
            if (chartType === 'area') {
              gradient.addColorStop(0, `${color}40`); // 25% opacity
              gradient.addColorStop(0.6, `${color}15`);
              gradient.addColorStop(1, `${color}02`); // 0% opacity
            } else {
              gradient.addColorStop(0, `${color}E6`);
              gradient.addColorStop(1, `${color}66`);
            }
            return gradient;
          },
          fill: chartType === 'area',
          tension: 0.35,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: color,
          pointBorderWidth: 2,
          pointRadius: chartType === 'area' ? 4 : 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: '#FFFFFF',
          pointHoverBorderWidth: 2,
          borderRadius: chartType === 'bar' ? 6 : 0,
          barPercentage: 0.55,
        },
      ],
    };
  }, [points, labels, commodity, color, chartType]);

  const options = useMemo(() => {
    // Determine healthy y-axis bounds with padding
    const yPadding = rangeSpan(minPrice, maxPrice);
    const yMin = Math.max(0, Math.floor((minPrice - yPadding) / 50) * 50);
    const yMax = Math.ceil((maxPrice + yPadding) / 50) * 50;

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#FFFFFF',
          titleColor: '#1F2937',
          bodyColor: '#374151',
          borderColor: 'rgba(0,0,0,0.08)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          cornerRadius: 12,
          displayColors: false,
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (item) => `₹${Number(item.parsed.y).toLocaleString('en-IN')} / Quintal`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: '#64748B',
            font: { size: 11, weight: 600, family: "'Inter', sans-serif" },
            padding: 8,
          },
        },
        y: {
          min: yMin,
          max: yMax,
          border: { display: false },
          grid: {
            color: 'rgba(0, 0, 0, 0.04)',
            drawBorder: false,
          },
          ticks: {
            color: '#64748B',
            font: { size: 11, family: "'Inter', sans-serif" },
            padding: 10,
            maxTicksLimit: 5,
            callback: (val) => `₹${val.toLocaleString('en-IN')}`,
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    };
  }, [minPrice, maxPrice]);

  return (
    <div>
      {/* Metric summary bar above the canvas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: COLORS.text, fontFamily: 'Georgia, serif' }}>
            ₹{currentPrice.toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>/ Quintal</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              background: deltaPrice >= 0 ? `${COLORS.primary}15` : `${COLORS.red}15`,
              color: deltaPrice >= 0 ? COLORS.primary : COLORS.red,
            }}
          >
            {deltaPrice >= 0 ? '↑' : '↓'} {Math.abs(deltaPct)}% vs prev
          </span>
        </div>

        {/* View toggle (Area vs Bar) */}
        <div style={{ display: 'flex', background: COLORS.bg, padding: 3, borderRadius: 10, gap: 4 }}>
          <button
            type="button"
            onClick={() => setChartType('area')}
            style={{
              padding: '4px 10px',
              border: 'none',
              borderRadius: 8,
              background: chartType === 'area' ? 'white' : 'transparent',
              color: chartType === 'area' ? COLORS.primary : COLORS.textMuted,
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
              boxShadow: chartType === 'area' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Trend Area
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            style={{
              padding: '4px 10px',
              border: 'none',
              borderRadius: 8,
              background: chartType === 'bar' ? 'white' : 'transparent',
              color: chartType === 'bar' ? COLORS.primary : COLORS.textMuted,
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
              boxShadow: chartType === 'bar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            Daily Bars
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ height, width: '100%', position: 'relative' }}>
        {chartType === 'area' ? <Line data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
      </div>

      {/* High / Low / Avg pill strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}55`, fontSize: 12, color: COLORS.textMuted }}>
        <span>Min: <strong style={{ color: COLORS.text }}>₹{minPrice.toLocaleString('en-IN')}</strong></span>
        <span>Avg: <strong style={{ color: COLORS.text }}>₹{avgPrice.toLocaleString('en-IN')}</strong></span>
        <span>Max: <strong style={{ color: COLORS.text }}>₹{maxPrice.toLocaleString('en-IN')}</strong></span>
      </div>
    </div>
  );
};

function rangeSpan(min, max) {
  const span = max - min;
  if (span <= 0) return 100;
  return Math.max(span * 0.2, 50);
}

export default PriceTrendChart;
