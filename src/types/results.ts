export interface IngredientWeights {
  flour: number;
  water: number;
  salt: number;
  oil: number;
  yeast: number;
}

export type SimpleStatus = 'ok' | 'warn' | 'bad';

export type HydrationStatus =
  | 'too_low'    // rosso sotto
  | 'low'        // arancio sotto
  | 'optimal'    // verde
  | 'high'       // arancio sopra
  | 'too_high';  // rosso sopra

export interface WBlendResult {
  currentW: number;
  targetW: number;
  delta: number;       // currentW - targetW
  suggestion: string;
}

export interface CalculationResult {
  ingredients: IngredientWeights;
  yeastPercent: number;
  hydrationStatus: HydrationStatus;
  wBlend: WBlendResult;
  totalDoughWeight: number;
  flourWeight: number;
  cumulativeF: number; // utile per debug/display
}
