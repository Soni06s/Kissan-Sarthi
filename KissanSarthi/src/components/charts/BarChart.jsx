import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { COLORS } from '../../constants/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const BarChart = ({ data, labels, colors, height = 200 }) => {
  const points = Array.isArray(data) ? data.map(Number) : [];
  
  const chartData = useMemo(() => {
    return {
      labels: labels || points.map((_, i) => `Item ${i+1}`),
      datasets: [
        {
          label: 'Value',
          data: points,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
            const color = colors?.[context.dataIndex] || COLORS.primary;
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, `${color}99`);
            return gradient;
          },
          borderRadius: 4,
          barPercentage: 0.7,
        },
      ],
    };
  }, [points, labels, colors]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#333333',
        bodyColor: '#666666',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => ` ${context.parsed.y.toLocaleString()}`
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      y: {
        border: { display: false },
        grid: {
          color: '#f1f5f9',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          maxTicksLimit: 5
        },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  }), []);

  if (!points.length) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data available</div>;
  }

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};