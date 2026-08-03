import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { COLORS } from '../../constants/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const LineChart = ({ data, color = COLORS.primary, height = 150, showXAxis = false }) => {
  const points = Array.isArray(data) ? data.map(Number).filter(Number.isFinite) : [];
  
  const chartData = useMemo(() => {
    // Generate dummy labels based on data length (e.g. months or days)
    const labels = points.map((_, i) => {
      if (points.length <= 7) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days[i % 7];
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[i % 12];
    });

    return {
      labels,
      datasets: [
        {
          label: 'Performance',
          data: points,
          borderColor: color,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height);
            gradient.addColorStop(0, `${color}40`); // 25% opacity
            gradient.addColorStop(1, `${color}00`); // 0% opacity
            return gradient;
          },
          borderWidth: 3,
          tension: 0.4, // Smooth curves
          fill: true,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: color,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [points, color]);

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
        display: showXAxis,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7
        },
        title: {
          display: showXAxis,
          text: 'Time Period',
          color: '#94a3b8',
          font: {
            size: 10,
            weight: 600
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
        beginAtZero: false,
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
      <Line data={chartData} options={options} />
    </div>
  );
};
