
import React, { useState, useMemo } from 'react';
import { Calculator, Info, RotateCcw } from 'lucide-react';
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

// --- ChartJS Registration ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- Constants & Metadata ---
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

const METADATA = {
  [FunctionType.PROPORTIONAL]: {
    label: '比例',
    formula: 'y = ax',
    desc: '原点(0,0)を通る直線です。aの値が大きくなると傾きが急になります。',
    hasB: false
  },
  [FunctionType.INVERSE]: {
    label: '反比例',
    formula: 'y = a/x',
    desc: '双曲線と呼ばれる曲線になります。x=0のときは値が存在しません。',
    hasB: false
  },
  [FunctionType.LINEAR]: {
    label: '一次関数',
    formula: 'y = ax + b',
    desc: '直線のグラフです。aは傾き、bはy軸との交点（切片）を表します。',
    hasB: true
  },
  [FunctionType.QUADRATIC]: {
    label: '二次関数',
    formula: 'y = ax²',
    desc: '放物線と呼ばれる曲線です。aがプラスなら上に開き、マイナスなら下に開きます。',
    hasB: false
  }
};

// --- Helpers ---
const getFraction = (val: number): { num: number; den: number; isFraction: boolean } => {
  const abs = Math.abs(val);
  if (Number.isInteger(abs)) return { num: abs, den: 1, isFraction: false };
  
  const common = [
    { n: 1, d: 2, v: 0.5 }, { n: 1, d: 4, v: 0.25 }, { n: 3, d: 4, v: 0.75 },
    { n: 1, d: 5, v: 0.2 }, { n: 2, d: 5, v: 0.4 }, { n: 3, d: 5, v: 0.6 }, { n: 4, d: 5, v: 0.8 }
  ];
  for (const f of common) if (Math.abs(abs - f.v) < 0.001) return { num: f.n, den: f.d, isFraction: true };

  const den = 10;
  const num = Math.round(abs * 10);
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const d = gcd(num, den);
  return { num: num / d, den: den / d, isFraction: true };
};

// --- Math Display Components ---
const MathPart: React.FC<{ value: number; variable?: string; forceShowOne?: boolean }> = ({ value, variable = "", forceShowOne = false }) => {
  if (value === 0 && variable) return null;
  const { num, den, isFraction } = getFraction(value);
  const isNegative = value < 0;
  const isOne = num === 1 && den === 1;

  return (
    <div className="flex items-center">
      {isNegative && <span className="mr-0.5">−</span>}
      {isFraction ? (
        <div className="flex flex-col items-center mx-1 scale-90 sm:scale-100">
          <span className="border-b-2 border-indigo-700 px-1 leading-none text-center min-w-[1rem] pb-0.5 text-xl">{num}</span>
          <span className="px-1 leading-none text-center min-w-[1rem] pt-0.5 text-xl">{den}</span>
        </div>
      ) : (
        (!isOne || forceShowOne || !variable) && <span className="mx-0.5 text-2xl">{num}</span>
      )}
      {variable && <span className="italic ml-0.5 text-2xl">{variable}</span>}
    </div>
  );
};

const FormulaDisplay: React.FC<{ type: FunctionType; a: number; b: number }> = ({ type, a, b }) => {
  const isZero = type === FunctionType.LINEAR ? (a === 0 && b === 0) : a === 0;

  if (isZero) {
    return (
      <div className="flex items-center text-3xl font-bold text-indigo-700 font-mono">
        <span className="italic">y</span><span className="mx-2 text-2xl">=</span><span>0</span>
      </div>
    );
  }

  if (type === FunctionType.INVERSE) {
    const isNegative = a < 0;
    const absA = Math.abs(a);
    return (
      <div className="flex items-center text-3xl font-bold text-indigo-700 font-mono">
        <span className="italic">y</span><span className="mx-2 text-2xl">=</span>
        {isNegative && <span className="mx-1">−</span>}
        <div className="flex flex-col items-center">
          <span className="border-b-2 border-indigo-700 px-4 min-w-[2.5rem] text-center leading-none pb-1">{absA}</span>
          <span className="px-2 leading-none pt-1 italic">x</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center text-3xl font-bold text-indigo-700 font-mono">
      <span className="italic">y</span><span className="mx-2 text-2xl">=</span>
      <div className="flex items-center">
        {type === FunctionType.LINEAR ? (
          <>
            {a !== 0 && <MathPart value={a} variable="x" />}
            {a !== 0 && b !== 0 && <span className="mx-2 text-2xl font-normal">{b > 0 ? '+' : '−'}</span>}
            {b !== 0 && <MathPart value={a !== 0 ? Math.abs(b) : b} forceShowOne={true} />}
          </>
        ) : (
          <MathPart value={a} variable={type === FunctionType.QUADRATIC ? 'x²' : 'x'} />
        )}
      </div>
    </div>
  );
};

// --- Main Application ---
export default function App() {
  const [type, setType] = useState<FunctionType>(FunctionType.PROPORTIONAL);
  const [config, setConfig] = useState<FunctionConfig>({ a: 1, b: 0 });

  const reset = () => setConfig({ a: 1, b: 0 });

  const handleAChange = (val: number) => {
    const finalVal = type === FunctionType.INVERSE ? Math.round(val) : val;
    setConfig(prev => ({ ...prev, a: finalVal }));
  };

  const graphData = useMemo(() => {
    const { a, b } = config;
    const datasets: any[] = [];
    const style = { borderColor: '#4f46e5', showLine: true, pointRadius: 0, borderWidth: 4, tension: 0.1 };

    if (type === FunctionType.INVERSE) {
      if (a === 0) {
        datasets.push({ data: [{ x: -10, y: 0 }, { x: 10, y: 0 }], ...style });
      } else {
        const left: any[] = [], right: any[] = [];
        for (let x = -10; x <= -0.11; x += 0.1) left.push({ x: Number(x.toFixed(2)), y: a / x });
        for (let x = 0.11; x <= 10; x += 0.1) right.push({ x: Number(x.toFixed(2)), y: a / x });
        datasets.push(
          { data: left.filter(p => Math.abs(p.y) <= 15), ...style },
          { data: right.filter(p => Math.abs(p.y) <= 15), ...style }
        );
      }
    } else {
      const points: any[] = [];
      for (let x = -10; x <= 10; x += 0.1) {
        let y = 0;
        const rx = Number(x.toFixed(1));
        if (type === FunctionType.PROPORTIONAL) y = a * rx;
        else if (type === FunctionType.LINEAR) y = a * rx + b;
        else if (type === FunctionType.QUADRATIC) y = a * rx * rx;
        points.push({ x: rx, y: y });
      }
      datasets.push({ data: points.filter(p => Math.abs(p.y) <= 15), ...style });
    }
    return { datasets };
  }, [type, config]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    scales: {
      x: {
        type: 'linear', position: 'center', min: -10, max: 10,
        grid: { color: (c) => c.tick.value === 0 ? '#1e293b' : '#e2e8f0', lineWidth: (c) => c.tick.value === 0 ? 2 : 1 },
        ticks: { stepSize: 1, font: { size: 10, weight: 'bold' } }
      },
      y: {
        type: 'linear', position: 'center', min: -10, max: 10,
        grid: { color: (c) => c.tick.value === 0 ? '#1e293b' : '#e2e8f0', lineWidth: (c) => c.tick.value === 0 ? 2 : 1 },
        ticks: { stepSize: 1, font: { size: 10, weight: 'bold' } }
      }
    },
    plugins: { legend: { display: false }, tooltip: { enabled: true } }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-indigo-600 text-white shadow-xl mb-10">
        <div className="max-w-6xl mx-auto px-6 py-8 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/20 rounded-3xl shadow-inner"><Calculator size={36} /></div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">関数シミュレーター</h1>
              <p className="text-indigo-100 text-sm sm:text-base font-medium opacity-80 mt-1">グラフの形がどう変わるか、実験してみよう！</p>
            </div>
          </div>
          <button onClick={reset} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl transition-all font-black text-sm border-2 border-white/20 active:scale-95 shadow-lg">
            <RotateCcw size={20} />
            <span>リセット</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-700 uppercase tracking-widest text-xs flex items-center gap-2">
                <div className="w-2 h-4 bg-indigo-500 rounded-full"></div>
                関数の種類を選ぶ
              </h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {(Object.keys(METADATA) as FunctionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setType(t); if (t === FunctionType.INVERSE) handleAChange(config.a); }}
                  className={`px-4 py-5 rounded-3xl text-sm font-black transition-all border-2 ${
                    type === t ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-md scale-[1.03]' : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  {METADATA[t].label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 space-y-10">
            <div className="flex flex-col items-center justify-center py-12 bg-indigo-50/50 rounded-3xl border border-indigo-100 shadow-inner relative overflow-hidden">
              <span className="text-[11px] font-black text-indigo-400 mb-6 uppercase tracking-[0.4em] z-10">現在の方程式</span>
              <div className="z-10"><FormulaDisplay type={type} a={config.a} b={config.b} /></div>
              <div className="absolute -bottom-10 -right-10 opacity-5 text-indigo-900 font-black text-8xl italic">f(x)</div>
            </div>

            <div className="space-y-10">
              <div className="space-y-5">
                <div className="flex justify-between items-center font-black text-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-mono text-lg border border-indigo-200 shadow-sm">a</span>
                    <span>係数 a</span>
                  </div>
                  <input type="number" value={config.a} step={type === FunctionType.INVERSE ? 1 : 0.5} onChange={(e) => handleAChange(parseFloat(e.target.value) || 0)} className="w-24 px-4 py-2 bg-slate-50 rounded-xl text-right font-mono text-base font-bold focus:ring-4 focus:ring-indigo-200 border border-slate-200" />
                </div>
                <input type="range" min="-10" max="10" step={type === FunctionType.INVERSE ? 1 : 0.5} value={config.a} onChange={(e) => handleAChange(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer" />
                <div className="flex justify-between text-[10px] text-slate-400 font-black font-mono px-2 uppercase tracking-tighter">
                  <span>-10.0</span><span>0</span><span>10.0</span>
                </div>
              </div>

              {METADATA[type].hasB && (
                <div className="space-y-5 pt-10 border-t-2 border-slate-50">
                  <div className="flex justify-between items-center font-black text-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-mono text-lg border border-emerald-200 shadow-sm">b</span>
                      <span>定数 b</span>
                    </div>
                    <input type="number" value={config.b} step="0.5" onChange={(e) => setConfig(p => ({ ...p, b: parseFloat(e.target.value) || 0 }))} className="w-24 px-4 py-2 bg-slate-50 rounded-xl text-right font-mono text-base font-bold focus:ring-4 focus:ring-emerald-200 border border-slate-200" />
                  </div>
                  <input type="range" min="-10" max="10" step="0.5" value={config.b} onChange={(e) => setConfig(p => ({ ...p, b: parseFloat(e.target.value) }))} className="w-full accent-emerald-500" />
                  <div className="flex justify-between text-[10px] text-slate-400 font-black font-mono px-2 uppercase tracking-tighter">
                    <span>-10.0</span><span>0</span><span>10.0</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex gap-5">
              <div className="p-3 bg-amber-200/50 rounded-2xl h-fit shadow-sm"><Info className="text-amber-600" size={24} /></div>
              <p className="text-sm text-amber-900 leading-relaxed font-bold italic opacity-90">{METADATA[type].desc}</p>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-8 sm:p-12 chart-container flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-black text-slate-800 text-xl flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                グラフ
              </h2>
              <div className="flex gap-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></div> Y-AXIS</div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div> GRID</div>
              </div>
            </div>
            <div className="flex-grow w-full pb-10">
              <Line options={options} data={graphData} />
            </div>
          </div>
        </div>
      </main>

      <footer className="py-16 text-center">
        <p className="text-slate-400 text-xs font-black tracking-[0.3em] uppercase opacity-60">
          &copy; 2024 数学インタラクティブ学習 ・ 未来の天才を育てる
        </p>
      </footer>
    </div>
  );
}
