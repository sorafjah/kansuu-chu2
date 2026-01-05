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

// ChartJS 登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

enum FunctionType {
  PROPORTIONAL = 'proportional',
  INVERSE = 'inverse',
  LINEAR = 'linear',
  QUADRATIC = 'quadratic'
}

const METADATA = {
  [FunctionType.PROPORTIONAL]: { label: '比例', desc: 'y = ax の形。原点を通る直線です。', hasB: false },
  [FunctionType.INVERSE]: { label: '反比例', desc: 'y = a/x の形。xが0の時は値がありません。', hasB: false },
  [FunctionType.LINEAR]: { label: '一次関数', desc: 'y = ax + b の形。直線になります。', hasB: true },
  [FunctionType.QUADRATIC]: { label: '二次関数', desc: 'y = ax² の形。放物線を描きます。', hasB: false }
};

const getFraction = (val: number) => {
  const abs = Math.abs(val);
  if (Number.isInteger(abs)) return { num: abs, den: 1, isFraction: false };
  const common = [{ n: 1, d: 2, v: 0.5 }, { n: 1, d: 4, v: 0.25 }, { n: 3, d: 4, v: 0.75 }];
  for (const f of common) if (Math.abs(abs - f.v) < 0.001) return { num: f.n, den: f.d, isFraction: true };
  return { num: Math.round(abs * 10), den: 10, isFraction: true };
};

const MathPart: React.FC<{ value: number; variable?: string; forceShowOne?: boolean }> = ({ value, variable = "", forceShowOne = false }) => {
  if (value === 0 && variable) return null;
  const { num, den, isFraction } = getFraction(value);
  const isNegative = value < 0;
  const isOne = num === 1 && den === 1;

  return (
    <div className="flex items-center">
      {isNegative && <span className="mr-0.5 text-2xl">−</span>}
      {isFraction ? (
        <div className="flex flex-col items-center mx-1 scale-90 sm:scale-100">
          <span className="border-b-2 border-indigo-700 px-1 leading-none text-xl text-center min-w-[1.2rem] pb-0.5 font-bold">{num}</span>
          <span className="px-1 leading-none text-xl text-center min-w-[1.2rem] pt-0.5 font-bold">{den}</span>
        </div>
      ) : (
        (!isOne || forceShowOne || !variable) && <span className="mx-0.5 text-2xl font-bold">{num}</span>
      )}
      {variable && <span className="italic ml-0.5 text-2xl font-bold">{variable}</span>}
    </div>
  );
};

export default function App() {
  const [type, setType] = useState<FunctionType>(FunctionType.PROPORTIONAL);
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);

  const reset = () => { setA(1); setB(0); };

  const graphData = useMemo(() => {
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
        points.push({ x: rx, y });
      }
      datasets.push({ data: points.filter(p => Math.abs(p.y) <= 15), ...style });
    }
    return { datasets };
  }, [type, a, b]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        type: 'linear', position: 'center', min: -10, max: 10,
        grid: { color: c => c.tick.value === 0 ? '#1e293b' : '#e2e8f0', lineWidth: c => c.tick.value === 0 ? 2 : 1 }
      },
      y: { 
        type: 'linear', position: 'center', min: -10, max: 10,
        grid: { color: c => c.tick.value === 0 ? '#1e293b' : '#e2e8f0', lineWidth: c => c.tick.value === 0 ? 2 : 1 }
      }
    },
    plugins: { legend: { display: false } }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-indigo-600 text-white p-6 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl"><Calculator size={32} /></div>
            <h1 className="text-2xl font-black tracking-tight">関数シミュレーター</h1>
          </div>
          <button onClick={reset} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all font-bold flex items-center gap-2">
            <RotateCcw size={20} /> <span className="hidden sm:inline">リセット</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">関数の種類</h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(METADATA) as FunctionType[]).map(t => (
                <button 
                  key={t}
                  onClick={() => { setType(t); if(t === FunctionType.INVERSE) setA(Math.round(a)); }}
                  className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${type === t ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-md scale-[1.02]' : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                  {METADATA[t].label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 text-center relative overflow-hidden group">
            <span className="text-[10px] font-black text-indigo-400 block mb-6 tracking-[0.4em] relative z-10">方程式</span>
            <div className="flex justify-center items-center h-28 relative z-10">
              <span className="italic text-3xl font-bold text-indigo-700 mr-3">y =</span>
              {a === 0 && (!METADATA[type].hasB || b === 0) ? (
                <span className="text-3xl font-bold text-indigo-700">0</span>
              ) : type === FunctionType.INVERSE ? (
                <div className="flex items-center text-indigo-700 font-bold">
                  {a < 0 && <span className="text-3xl mr-1">−</span>}
                  <div className="flex flex-col items-center">
                    <span className="border-b-2 border-indigo-700 px-5 text-2xl pb-1">{Math.abs(a)}</span>
                    <span className="italic text-2xl pt-1">x</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-indigo-700 font-bold">
                  {type === FunctionType.LINEAR ? (
                    <>
                      {a !== 0 && <MathPart value={a} variable="x" />}
                      {a !== 0 && b !== 0 && <span className="mx-3 text-2xl">{b > 0 ? '+' : '−'}</span>}
                      {b !== 0 && <MathPart value={a !== 0 ? Math.abs(b) : b} forceShowOne={true} />}
                    </>
                  ) : (
                    <MathPart value={a} variable={type === FunctionType.QUADRATIC ? 'x²' : 'x'} />
                  )}
                </div>
              )}
            </div>
            <div className="absolute -bottom-6 -right-6 text-slate-50 text-9xl font-black italic select-none group-hover:scale-110 transition-transform duration-700">f(x)</div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-10">
            <div className="space-y-5">
              <div className="flex justify-between font-black text-slate-700">
                <span className="flex items-center gap-2">係数 <span className="text-indigo-600 bg-indigo-50 px-2 rounded">a</span></span>
                <span className="font-mono text-indigo-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{a}</span>
              </div>
              <input 
                type="range" min="-10" max="10" step={type === FunctionType.INVERSE ? 1 : 0.5} 
                value={a} onChange={e => setA(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            {METADATA[type].hasB && (
              <div className="space-y-5 pt-8 border-t border-slate-100">
                <div className="flex justify-between font-black text-slate-700">
                  <span className="flex items-center gap-2">定数 <span className="text-emerald-600 bg-emerald-50 px-2 rounded">b</span></span>
                  <span className="font-mono text-emerald-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{b}</span>
                </div>
                <input 
                  type="range" min="-10" max="10" step="0.5" 
                  value={b} onChange={e => setB(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}
            <div className="bg-slate-50 p-4 rounded-2xl flex gap-4 border border-slate-100">
              <Info className="text-indigo-400 shrink-0" size={20} />
              <p className="text-xs text-slate-500 font-bold leading-relaxed">{METADATA[type].desc}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-slate-800 text-xl flex items-center gap-3 uppercase tracking-tighter">
              <div className="w-2 h-6 bg-indigo-500 rounded-full" /> グラフ
            </h2>
            <div className="flex gap-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Plot</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-100 border" /> Grid</span>
            </div>
          </div>
          <div className="flex-grow w-full">
            <Line data={graphData} options={options} />
          </div>
        </div>
      </main>

      <footer className="py-12 text-center text-slate-400">
        <p className="text-[10px] font-black tracking-[0.4em] uppercase opacity-50">&copy; 2024 数学インタラクティブ学習ツール</p>
      </footer>
    </div>
  );
}