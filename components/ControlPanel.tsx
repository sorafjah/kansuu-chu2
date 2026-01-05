
import React from 'react';
import { FunctionConfig, FunctionType } from '../types';

interface ControlPanelProps {
  type: FunctionType;
  config: FunctionConfig;
  onChange: (config: Partial<FunctionConfig>) => void;
  showB: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ type, config, onChange, showB }) => {
  const aStep = type === FunctionType.INVERSE ? 1 : 0.5;

  return (
    <div className="space-y-6">
      {/* a coefficient */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center font-mono">a</span>
            係数 a
          </label>
          <input
            type="number"
            value={config.a}
            step={aStep}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              onChange({ a: type === FunctionType.INVERSE ? Math.round(val) : val });
            }}
            className="w-20 px-2 py-1 border border-slate-200 rounded text-right text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <input
          type="range"
          min="-10"
          max="10"
          step={aStep}
          value={config.a}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange({ a: type === FunctionType.INVERSE ? Math.round(val) : val });
          }}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>-10</span>
          <span>0</span>
          <span>10</span>
        </div>
      </div>

      {/* b coefficient (only for linear) */}
      {showB && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-mono">b</span>
              定数 b
            </label>
            <input
              type="number"
              value={config.b}
              step="0.5"
              onChange={(e) => onChange({ b: parseFloat(e.target.value) || 0 })}
              className="w-20 px-2 py-1 border border-slate-200 rounded text-right text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>-10</span>
            <span>0</span>
            <span>10</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
