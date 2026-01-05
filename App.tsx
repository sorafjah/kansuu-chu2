
import React, { useState } from 'react';
import { FunctionType, FunctionConfig } from './types';
import { FUNCTION_METADATA } from './constants';
import Graph from './components/Graph';
import ControlPanel from './components/ControlPanel';
import { Calculator, Info } from 'lucide-react';

// 小数を分数形式のパーツに変換するヘルパー
const getFraction = (val: number): { num: number; den: number; isFraction: boolean } => {
  if (Number.isInteger(val)) return { num: Math.abs(val), den: 1, isFraction: false };
  const abs = Math.abs(val);
  
  // よく使われる小数を分数にマッピング
  if (Math.abs(abs - 0.5) < 0.01) return { num: 1, den: 2, isFraction: true };
  if (Math.abs(abs - 0.25) < 0.01) return { num: 1, den: 4, isFraction: true };
  if (Math.abs(abs - 0.75) < 0.01) return { num: 3, den: 4, isFraction: true };
  
  // それ以外は10分のn形式を約分
  const den = 10;
  const num = Math.round(abs * 10);
  const common = (a: number, b: number): number => b ? common(b, a % b) : a;
  const divisor = common(num, den);
  return { num: num / divisor, den: den / divisor, isFraction: true };
};

const MathPart: React.FC<{ value: number; showOne?: boolean; variable?: string }> = ({ value, showOne = false, variable = "" }) => {
  if (value === 0 && variable) return null;
  const { num, den, isFraction } = getFraction(value);
  const isNegative = value < 0;
  const isOne = num === 1 && den === 1;

  return (
    <div className="flex items-center">
      {isNegative && <span className="mr-0.5">−</span>}
      {isFraction ? (
        <div className="flex flex-col items-center mx-1 scale-90">
          <span className="border-b-2 border-current px-1 leading-tight">{num}</span>
          <span className="px-1 leading-tight">{den}</span>
        </div>
      ) : (
        (!isOne || showOne || !variable) && <span className="mx-0.5">{num}</span>
      )}
      {variable && <span>{variable}</span>}
    </div>
  );
};

const App: React.FC = () => {
  const [type, setType] = useState<FunctionType>(FunctionType.PROPORTIONAL);
  const [config, setConfig] = useState<FunctionConfig>({ a: 1, b: 0 });

  const handleConfigChange = (newConfig: Partial<FunctionConfig>) => {
    // 反比例の場合はaを整数に強制
    if (type === FunctionType.INVERSE && newConfig.a !== undefined) {
      newConfig.a = Math.round(newConfig.a);
    }
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleTypeChange = (newType: FunctionType) => {
    setType(newType);
    // タイプ切り替え時に反比例なら現在のaを整数に丸める
    if (newType === FunctionType.INVERSE) {
      setConfig(prev => ({ ...prev, a: Math.round(prev.a) }));
    }
  };

  const metadata = FUNCTION_METADATA[type];

  const renderFormula = () => {
    const { a, b } = config;
    
    // y = 0 のケースを一括処理
    const isZero = (type === FunctionType.LINEAR) ? (a === 0 && b === 0) : (a === 0);
    if (isZero) {
      return <div className="text-3xl font-bold text-indigo-700 font-mono italic">y = 0</div>;
    }

    if (type === FunctionType.INVERSE) {
      const isNegative = a < 0;
      const absA = Math.abs(a);
      return (
        <div className="flex items-center gap-1 text-3xl font-bold text-indigo-700 font-mono italic">
          <span>y =</span>
          {isNegative && <span className="mx-1">−</span>}
          <div className="flex flex-col items-center">
            <span className="border-b-2 border-indigo-700 px-3 min-w-[1.5rem] text-center leading-tight">{absA}</span>
            <span className="px-2 leading-tight">x</span>
          </div>
        </div>
      );
    }

    if (type === FunctionType.PROPORTIONAL) {
      return (
        <div className="flex items-center text-3xl font-bold text-indigo-700 font-mono italic">
          <span>y =</span>
          <div className="ml-2 flex items-center">
            <MathPart value={a} variable="x" />
          </div>
        </div>
      );
    }

    if (type === FunctionType.QUADRATIC) {
      return (
        <div className="flex items-center text-3xl font-bold text-indigo-700 font-mono italic">
          <span>y =</span>
          <div className="ml-2 flex items-center">
            <MathPart value={a} variable="x²" />
          </div>
        </div>
      );
    }

    if (type === FunctionType.LINEAR) {
      const hasA = a !== 0;
      const hasB = b !== 0;
      return (
        <div className="flex items-center text-3xl font-bold text-indigo-700 font-mono italic">
          <span>y =</span>
          <div className="ml-2 flex items-center">
            {hasA && <MathPart value={a} variable="x" />}
            {hasA && hasB && <span className="mx-2">{b > 0 ? '+' : '−'}</span>}
            {hasB && <MathPart value={hasA ? Math.abs(b) : b} showOne={true} />}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-indigo-600 text-white shadow-lg mb-8">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calculator size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">関数シミュレーター</h1>
              <p className="text-indigo-100 text-sm">中学校数学・関数の特性を学ぶ</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold flex items-center gap-2 text-slate-700 uppercase tracking-wider text-sm">
                関数の種類
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {(Object.keys(FUNCTION_METADATA) as FunctionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                    type === t
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                      : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  {FUNCTION_METADATA[t].label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-indigo-50 rounded-xl border border-indigo-100 min-h-[160px]">
              <span className="text-sm font-medium text-indigo-400 mb-2 uppercase tracking-widest">現在の式</span>
              {renderFormula()}
            </div>

            <ControlPanel
              type={type}
              config={config}
              onChange={handleConfigChange}
              showB={metadata.hasB}
            />

            <div className="bg-amber-50 rounded-xl p-4 flex gap-3 border border-amber-100">
              <Info className="text-amber-500 shrink-0" size={20} />
              <p className="text-sm text-amber-800 leading-relaxed">
                {metadata.description}
              </p>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-700">グラフ表示エリア</h2>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                  y軸
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                  グリッド
                </span>
              </div>
            </div>
            <div className="w-full h-[400px] md:h-[500px]">
              <Graph type={type} config={config} />
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 mt-12 text-center text-slate-400 text-sm">
        <p>&copy; 2024 中学校数学 インタラクティブ学習シリーズ</p>
      </footer>
    </div>
  );
};

export default App;
