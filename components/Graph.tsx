
import React, { useMemo, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FunctionType, FunctionConfig, Point } from '../types';
import { X_RANGE, Y_RANGE, STEP } from '../constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface GraphProps {
  type: FunctionType;
  config: FunctionConfig;
}

const Graph: React.FC<GraphProps> = ({ type, config }) => {
  const chartRef = useRef<any>(null);

  const calculateData = useMemo(() => {
    const { a, b } = config;
    const datasets: { label: string; data: Point[]; borderColor: string; showLine: boolean; pointRadius: number; borderDash?: number[] }[] = [];

    if (type === FunctionType.INVERSE) {
      // For inverse, we need two segments to avoid the x=0 discontinuity
      const leftSegment: Point[] = [];
      const rightSegment: Point[] = [];
      
      for (let x = X_RANGE.min; x <= -0.1; x += STEP) {
        leftSegment.push({ x: Number(x.toFixed(1)), y: a / x });
      }
      for (let x = 0.1; x <= X_RANGE.max; x += STEP) {
        rightSegment.push({ x: Number(x.toFixed(1)), y: a / x });
      }

      datasets.push(
        {
          label: '左側曲線',
          data: leftSegment.filter(p => Math.abs(p.y) <= Y_RANGE.max * 2),
          borderColor: '#4f46e5',
          showLine: true,
          pointRadius: 0,
        },
        {
          label: '右側曲線',
          data: rightSegment.filter(p => Math.abs(p.y) <= Y_RANGE.max * 2),
          borderColor: '#4f46e5',
          showLine: true,
          pointRadius: 0,
        }
      );
    } else {
      const points: Point[] = [];
      for (let x = X_RANGE.min; x <= X_RANGE.max; x += STEP) {
        const roundedX = Number(x.toFixed(1));
        let y = 0;
        switch (type) {
          case FunctionType.PROPORTIONAL: y = a * roundedX; break;
          case FunctionType.LINEAR: y = a * roundedX + b; break;
          case FunctionType.QUADRATIC: y = a * Math.pow(roundedX, 2); break;
        }
        points.push({ x: roundedX, y: y });
      }
      
      datasets.push({
        label: 'グラフ',
        data: points.filter(p => p.y >= Y_RANGE.min - 5 && p.y <= Y_RANGE.max + 5),
        borderColor: '#4f46e5',
        showLine: true,
        pointRadius: 0,
      });
    }

    return { datasets };
  }, [type, config]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    scales: {
      x: {
        type: 'linear',
        position: 'center',
        min: X_RANGE.min,
        max: X_RANGE.max,
        grid: {
          color: (context) => (context.tick.value === 0 ? '#64748b' : '#e2e8f0'),
          lineWidth: (context) => (context.tick.value === 0 ? 2 : 1),
        },
        ticks: {
          stepSize: 1,
          font: { size: 10 },
          color: '#94a3b8'
        }
      },
      y: {
        type: 'linear',
        position: 'center',
        min: Y_RANGE.min,
        max: Y_RANGE.max,
        grid: {
          color: (context) => (context.tick.value === 0 ? '#64748b' : '#e2e8f0'),
          lineWidth: (context) => (context.tick.value === 0 ? 2 : 1),
        },
        ticks: {
          stepSize: 1,
          font: { size: 10 },
          color: '#94a3b8'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (item: any) => `x: ${item.parsed.x.toFixed(1)}, y: ${item.parsed.y.toFixed(1)}`
        }
      }
    }
  };

  return <Line ref={chartRef} options={options} data={calculateData as any} />;
};

export default Graph;
