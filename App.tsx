
import React, { useState, useMemo } from 'react';
import { Calculator, Info } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// --- Internal Types & Constants ---
enum FunctionType {
  PROPORTIONAL = 'proportional',
  INVERSE = 'inverse',
  LINEAR = 'linear',
  QUADRATIC = 'quadratic'
}

interface FunctionConfig {
  a: number;
  b: number;
}

const X_RANGE = { min: -10, max: 10 };
const Y_RANGE = { min: -10, max: 10 };
const STEP = 0.1;

const FUNCTION_METADATA = {
  [FunctionType.PROPORTIONAL]: {
    label: '比例',
    description: '原点を通る直線。aが変化すると傾きが変わります。',
    hasB: false
  },
  [FunctionType.INVERSE]: {
    label: '反比例',
    description: '双曲線。xが0に近づくと値が急激に変化します。',
    hasB: false
  },
  [FunctionType.LINEAR]: {
    label: '一次関数',
    description: '直線。aは傾き、bは切片（y軸との交点）を表します。',
    hasB: true
  },
  [FunctionType.QUADRATIC]: {
    label: '二次関数',
    description: '放物線。aの正負で向きが変わり、絶対値で開き具合が変わります。',
    hasB: false
  }
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- Helpers ---

/**
 * 小数を分数形式の数値に変換する
 */
const getFraction = (val: number): { num: number; den: number; isFraction: boolean } => {
  if (Number.isInteger(val)) return { num: Math.abs(val), den: 1, isFraction: false };
  
  const abs = Math.abs(val);
  // よく使われる分数を優先的に判定
  if (Math.abs(abs - 0.5) < 0.001) return { num: 1, den: 2, isFraction: true };
  if (Math.abs(abs - 0.25) < 0.001) return { num: 1, den: 4, isFraction: true };
  if (Math.abs(abs - 0.75) < 0.001) return { num: 3, den: 4, isFraction: true };
  if (Math.abs(abs - 0.2) < 0.001) return { num: 1, den: 5, isFraction: true };
  if (Math.abs(abs - 0.4) < 0.001) return { num: 2, den: 5, isFraction: true };
  if (Math.abs(abs - 0.6) < 0.001) return { num: 3, den: 5, isFraction: true };
  if (Math.abs(abs - 0.8) < 0.001) return { num: 4, den: 5, isFraction: true };
  if (Math.abs(abs - 1.5) < 0.001) return { num: 3, den: 2, isFraction: true };
  if (Math.abs(abs - 2.5) < 0.001) return { num: 5, den: 2, isFraction: true };

  // それ以外の小数は10を分母にして約分
  const den = 10;
  const num = Math.round(abs * 10);
  const common = (a: number, b: number): number => b ? common(b, a % b) : a;
  const divisor = common(num, den);
  return { num: num / divisor, den: den / divisor, isFraction: true };
};

// --- Sub-Components ---

/**
 * 数式のパーツを描画するコンポーネント
 */
const MathPart: React.FC<{ value: number; showOne?: boolean; variable?: string }> = ({ value, showOne = false, variable = "" }) => {
  if (value === 0 && variable) return null;
  const { num, den, isFraction } = getFraction(value);
  const isNegative = value < 0;
  const isOne = num === 1 && den === 1;

  return (
    <div className="flex items-center">
      {isNegative && <span className="mr-0.5">−</span>}
      {isFraction ? (
        <div className="flex flex-col items-center mx-1 scale-90 sm:scale-100">
          <span className="border-b-2 border-indigo-700 px-1 leading-tight text-center min-w-[1rem]">{num}</span>
          <span className="px-1 leading-tight text-center min-w-[1rem]">{den}</span>
        </div>
      ) : (
        (!isOne || showOne || !variable) && <span className="mx-0.5">{num}</span>
      )}
      {variable && <span className="italic">{variable}</span>}
    </div>
  );
};

const GraphComponent: React.FC<{ type: FunctionType; config: FunctionConfig }> = ({ type, config }) => {
  const calculateData = useMemo(() => {
    const { a, b } = config;
    const datasets: any[] = [];

    if (type === FunctionType.INVERSE) {
      if (a === 0) {
        datasets.push({
          data: [{ x: X_RANGE.min, y: 0 }, { x: X_RANGE.max, y: 0 }],
          borderColor: '#4f46e5',
          showLine: true,
          pointRadius: 0,
        });
      } else {
        const leftSegment: { x: number, y: number }[] = [];
        const rightSegment: { x: number, y: number }[] = [];
        // x=0付近での不連続性を考慮して2つのセグメントに分ける
        for (let x = X_RANGE.min; x <= -0.1; x += STEP) {
          leftSegment.push({ x: Number(x.toFixed(1)), y: a / x });
        }
        for (let x = 0.1; x <= X_RANGE.max; x += STEP) {
          rightSegment.push({ x: Number(x.toFixed(1)), y: a / x });
        }
        datasets.push(
          {
            data: leftSegment.filter(p => Math.abs(p.y) <= 20),
            borderColor: '#4f46e5',
            showLine: true,
            pointRadius: 0,
            borderWidth: 3,
            tension: 0.1
          },
          {
            data: rightSegment.filter(p => Math.abs(p.y) <= 20),
            borderColor: '#4f46e5',
            showLine: true,
            pointRadius: 0,
            borderWidth: 3,
            tension: 0.1
          }
        );
      }
    } else {
      const points: { x: number, y: number }[] = [];
      for (let x = X_RANGE.min; x <= X_RANGE.max; x += STEP) {
        let y = 0;
        const rx = Number(x.toFixed(1));
        if (type === FunctionType.PROPORTIONAL) y = a * rx;
        else if (type === FunctionType.LINEAR) y = a * rx + b;
        else if (type === FunctionType.QUADRATIC) y = a * rx * rx;
        points.push({ x: rx, y: y });
      }
      datasets.push({
        data: points.filter(p => Math.abs(p.y) <= 20),
        borderColor: '#4f46e5',
        showLine: true,
        pointRadius: 0,
        borderWidth: 3,
        tension: 0.1
      });
    }
    return { datasets };
  }, [type, config]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      x: {
        type: 'linear',
        position: 'center',
        min: -10,
        max: 10,
        grid: {
          color: (c) => c.tick.value === 0 ? '#475569' : '#e2e8f0',
          lineWidth: (c) => c.tick.value === 0 ? 2 : 1
        },
        ticks: { stepSize: 1, font: { size: 10 } }
      },
      y: {
        type: 'linear',
        position: 'center',
        min: -10,
        max: 10,
        grid: {
          color: (c) => c.tick.value === 0 ? '#475569' : '#e2e8f0',
          lineWidth: (c) => c.tick.value === 0 ? 2 : 1
        },
        ticks: { stepSize: 1, font: { size: 10 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        callbacks: {
          label: (context) => `x: ${context.parsed.x.toFixed(1)}, y: ${context.parsed.y.toFixed(1)}`
        }
      }
    }
  };

  return <Line options={options} data={calculateData} />;
};

const ControlPanelComponent: React.FC<{ type: FunctionType, config: FunctionConfig, onChange: (c: Partial<FunctionConfig>) => void }> = ({ type, config, onChange }) => {
  const isInverse = type === FunctionType.INVERSE;
  const aStep = isInverse ? 1 : 0.5;
  const hasB = type === FunctionType.LINEAR;

  return (
    <div className="space-y-8">
      {/* a係数 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-mono text-sm border border-indigo-200">a</span>
            係数 a
          </label>
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
             <input
              type="number"
              value={config.a}
              step={aStep}
              onChange={(e) => onChange({ a: parseFloat(e.target.value) || 0 })}
              className="w-16 bg-transparent border-none text-right text-sm font-bold font-mono focus:ring-0"
            />
          </div>
        </div>
        <input
          type="range"
          min="-10"
          max="10"
          step={aStep}
          value={config.a}
          onChange={(e) => onChange({ a: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
          <span>-10</span>
          <span>0</span>
          <span>10</span>
        </div>
      </div>

      {/* b定数 (一次関数のみ) */}
      {hasB && (
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-mono text-sm border border-emerald-200">b</span>
              定数 b
            </label>
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <input
                type="number"
                value={config.b}
                step="0.5"
                onChange={(e) => onChange({ b: parseFloat(e.target.value) || 0 })}
                className="w-16 bg-transparent border-none text-right text-sm font-bold font-mono focus:ring-0"
              />
            </div>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={config.b}
            onChange={(e) => onChange({ b: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
            <span>-10</span>
            <span>0</span>
            <span>10</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [type, setType] = useState<FunctionType>(FunctionType.PROPORTIONAL);
  const [config, setConfig] = useState<FunctionConfig>({ a: 1, b: 0 });

  const handleConfigChange = (newConfig: Partial<FunctionConfig>) => {
    let updated = { ...newConfig };
    // 反比例の場合はaを整数に制限
    if (type === FunctionType.INVERSE && updated.a !== undefined) {
      updated.a = Math.round(updated.a);
    }
    setConfig(prev => ({ ...prev, ...updated }));
  };

  const handleTypeChange = (newType: FunctionType) => {
    setType(newType);
    // 反比例に切り替えた時にaを整数にする
    if (newType === FunctionType.INVERSE) {
      setConfig(prev => ({ ...prev, a: Math.round(prev.a) }));
    }
  };

  const renderFormula = () => {
    const { a, b } = config;
    
    // y = 0 のケース
    const isZero = (type === FunctionType.LINEAR) ? (a === 0 && b === 0) : (a === 0);
    if (isZero) {
      return (
        <div className="flex items-center text-3xl font-bold text-indigo-700 font-mono">
          <span className="italic">y</span><span className="mx-2">=</span><span>0</span>
        </div>
      );
    }

    // 反比例
    if (type === FunctionType.INVERSE) {
      const isNegative = a < 0;
      const absA = Math.abs(a);
      return (
        <div className="flex items-center text-3xl font-bold text-indigo-700 font-mono">
          <span className="italic">y</span><span className="mx-2">=</span>
          {isNegative && <span className="mx-1">−</span>}
          <div className="flex flex-col items-center">
            <span className="border-b-2 border-indigo-700 px-3 min-w-[2rem] text-center leading-none pb-1">{absA}</span>
            <span className="px-2 leading-none pt-1 italic">x</span>
          </div>
        </div>
      );
    }

    // それ以外 (比例, 一次, 二次)
    return (
      <div className="flex items-center text-3xl font-bold text-indigo-700 font-mono">
        <span className="italic">y</span><span className="mx-2">=</span>
        <div className="flex items-center">
          {type === FunctionType.LINEAR ? (
            <>
              {a !== 0 && <MathPart value={a} variable="x" />}
              {a !== 0 && b !== 0 && <span className="mx-2">{b > 0 ? '+' : '−'}</span>}
              {b !== 0 && <MathPart value={a !== 0 ? Math.abs(b) : b} showOne={true} />}
            </>
          ) : (
            <MathPart value={a} variable={type === FunctionType.QUADRATIC ? 'x²' : 'x'} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-indigo-600 text-white shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl w-fit">
            <Calculator size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">関数シミュレーター</h1>
            <p className="text-indigo-100 text-sm mt-1 opacity-90 font-medium tracking-wide">
              中学校数学・関数の特性を視覚的に理解しよう
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* コントロールパネル */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                関数の種類
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {(Object.keys(FUNCTION_METADATA) as FunctionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
                    type === t
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm scale-[1.02]'
                      : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  {FUNCTION_METADATA[t].label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-8">
            <div className="flex flex-col items-center justify-center p-8 bg-indigo-50/50 rounded-2xl border border-indigo-100 min-h-[180px] shadow-inner">
              <span className="text-xs font-bold text-indigo-400 mb-4 uppercase tracking-[0.2em]">方程式</span>
              {renderFormula()}
            </div>

            <ControlPanelComponent type={type} config={config} onChange={handleConfigChange} />

            <div className="bg-amber-50 rounded-2xl p-5 flex gap-4 border border-amber-100">
              <div className="bg-amber-200/50 p-2 rounded-xl h-fit">
                <Info className="text-amber-600" size={20} />
              </div>
              <p className="text-sm text-amber-900 leading-relaxed font-medium italic">
                {FUNCTION_METADATA[type].description}
              </p>
            </div>
          </section>
        </div>

        {/* グラフエリア */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <div className="w-1.5 h-5 bg-indigo-500 rounded-full"></div>
                グラフ
              </h2>
              <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> y = f(x)</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div> grid</span>
              </div>
            </div>
            <div className="flex-grow w-full h-[450px] sm:h-[550px]">
              <GraphComponent type={type} config={config} />
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 text-center">
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
          &copy; 2024 数学インタラクティブ学習ツール ・ 楽しみながら学ぼう
        </p>
      </footer>
    </div>
  );
}
