
export enum FunctionType {
  PROPORTIONAL = 'proportional',
  INVERSE = 'inverse',
  LINEAR = 'linear',
  QUADRATIC = 'quadratic'
}

export interface FunctionConfig {
  a: number;
  b: number;
}

export interface Point {
  x: number;
  y: number;
}
