
import { FunctionType } from './types';

export const X_RANGE = { min: -10, max: 10 };
export const Y_RANGE = { min: -10, max: 10 };
export const STEP = 0.1;

export const FUNCTION_METADATA = {
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
