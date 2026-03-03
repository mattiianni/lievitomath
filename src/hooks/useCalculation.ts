import { useMemo } from 'react';
import { useDoughStore } from '../store/useDoughStore';
import { cumulativeFermentation, yeastPercentFromFermentation } from '../engine/fermentation';
import { calculateIngredients } from '../engine/dough';
import { calcWBlend, getHydrationStatus } from '../engine/flour';
import type { CalculationResult } from '../types/results';

export function useCalculation(): CalculationResult | null {
  const state = useDoughStore(s => s.state);

  return useMemo(() => {
    if (state.pieces <= 0 || state.weightPerPiece <= 0) return null;
    if (state.flours.length === 0) return null;

    const flourTotal = state.flours.reduce((s, f) => s + f.percentage, 0);
    if (flourTotal === 0) return null;

    const cumulativeF = cumulativeFermentation(state.phases);
    const yeastPercent = yeastPercentFromFermentation(cumulativeF, state.yeastType);
    const ingredients = calculateIngredients(state, yeastPercent);
    const hydrationStatus = getHydrationStatus(state.hydration, state.mode);
    const wBlend = calcWBlend(state.flours, state.mode, cumulativeF);

    return {
      ingredients,
      yeastPercent,
      hydrationStatus,
      wBlend,
      totalDoughWeight: ingredients.totalDoughWeight,
      flourWeight: ingredients.flourWeight,
      cumulativeF,
    };
  }, [state]);
}
