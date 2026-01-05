
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
  [FunctionType.PROPORTIONAL]: { label: '比例', desc: '原点を通る直線。aが傾きを表します。', hasB: false },
  [FunctionType.INVERSE]: { label: '反比例', desc: '双曲線。x=0では定義されません。', hasB: false },
  [FunctionType.LINEAR]: { label: '一次関数', desc: '直線。bはy切片を表します。', hasB: true },
  [FunctionType.QUADRATIC]: { label: '二次関数', desc: '放物線。aの正負で開く向きが決まります。', hasB: false }
};

// 分数表示のヘルパー
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
        <div className="flex flex-col items-center mx-1 scale-90">
          <span className="border-b-2 border-indigo-700 px-1 leading-none text-xl">{num}</span>
          <span className="px-1 leading-none text-xl">{den}</span>
        </div>
      ) : (
        (!isOne || forceShowOne || !variable) && <span className="mx-0.5 text-2xl">{num}</span>
      )}
      {variable && <span className="italic ml-0.5 text-2xl">{variable}</span>}
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
        for (let x = -10; x <= -0.2; x += 0.1) left.push({ x, y: a / x });
        for (let x = 0.2; x <= 10; x += 0.1) right.push({ x, y: a / x });
        datasets.push(
          { data: left.filter(p => Math.abs(p.y) <= 12), ...style },
          { data: right.filter(p => Math.abs(p.y) <= 12), ...style }
        );
      }
    } else {
      const points: any[] = [];
      for (let x = -10; x <= 10; x += 0.1) {
        let y = 0;
        if (type === FunctionType.PROPORTIONAL) y = a * x;
        else if (type === FunctionType.LINEAR) y = a * x + b;
        else if (type === FunctionType.QUADRATIC) y = a * x * x;
        points.push({ x, y });
      }
      datasets.push({ data: points.filter(p => Math.abs(p.y) <= 12), ...style });
    }
    return { datasets };
  }, [type, a, b]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator size={32} />
            <h1 className="text-2xl font-black">関数シミュレーター</h1>
          </div>
          <button onClick={reset} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all">
            <RotateCcw size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">関数の種類</h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(METADATA) as FunctionType[]).map(t => (
                <button 
                  key={t}
                  onClick={() => { setType(t); if(t === FunctionType.INVERSE) setA(Math.round(a)); }}
                  className={`py-3 rounded-2xl font-black text-sm transition-all border-2 ${type === t ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                  {METADATA[t].label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 text-center">
            <span className="text-[10px] font-black text-indigo-400 block mb-4 tracking-[0.3em]">方程式</span>
            <div className="flex justify-center items-center h-24">
              <span className="italic text-2xl font-bold text-indigo-700 mr-2">y =</span>
              {a === 0 && (!METADATA[type].hasB || b === 0) ? (
                <span className="text-2xl font-bold text-indigo-700">0</span>
              ) : type === FunctionType.INVERSE ? (
                <div className="flex items-center text-indigo-700 font-bold">
                  {a < 0 && <span className="text-2xl mr-1">−</span>}
                  <div className="flex flex-col items-center">
                    <span className="border-b-2 border-indigo-700 px-3 text-xl">{Math.abs(a)}</span>
                    <span className="italic text-xl">x</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-indigo-700 font-bold">
                  {type === FunctionType.LINEAR ? (
                    <>
                      {a !== 0 && <MathPart value={a} variable="x" />}
                      {a !== 0 && b !== 0 && <span className="mx-2 text-xl">{b > 0 ? '+' : '−'}</span>}
                      {b !== 0 && <MathPart value={a !== 0 ? Math.abs(b) : b} forceShowOne={true} />}
                    </>
                  ) : (
                    <MathPart value={a} variable={type === FunctionType.QUADRATIC ? 'x²' : 'x'} />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between font-black text-slate-700">
                <span>係数 a</span>
                <span className="font-mono text-indigo-600">{a}</span>
              </div>
              <input 
                type="range" min="-10" max="10" step={type === FunctionType.INVERSE ? 1 : 0.5} 
                value={a} onChange={e => setA(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            {METADATA[type].hasB && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between font-black text-slate-700">
                  <span>定数 b</span>
                  <span className="font-mono text-emerald-600">{b}</span>
                </div>
                <input 
                  type="range" min="-10" max="10" step="0.5" 
                  value={b} onChange={e => setB(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col">
          <h2 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
            <div className="w-2 h-5 bg-indigo-500 rounded-full" /> グラフ表示
          </h2>
          <div className="flex-grow min-h-[400px]">
            <Line 
              data={graphData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { type: 'linear', position: 'center', min: -10, max: 10, grid: { color: c => c.tick.value === 0 ? '#1e293b' : '#e2e8f0' } },
                  y: { type: 'linear', position: 'center', min: -10, max: 10, grid: { color: c => c.tick.value === 0 ? '#1e293b' : '#e2e8f0' } }
                },
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
