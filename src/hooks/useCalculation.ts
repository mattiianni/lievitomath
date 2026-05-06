import { useMemo } from 'react';
import { useDoughStore } from '../store/useDoughStore';
import { calculateYeastForPhases } from '../engine/fermentation';
import { calculateIngredients, calculatePrefermentiSplit } from '../engine/dough';
import { calcWBlend, getHydrationStatus } from '../engine/flour';
import type { CalculationResult } from '../types/results';

export function useCalculation(): CalculationResult | null {
  const state = useDoughStore(s => s.state);

  return useMemo(() => {
    if (state.pieces <= 0 || state.weightPerPiece <= 0) return null;
    if (state.flours.length === 0) return null;

    const flourTotal = state.flours.reduce((s, f) => s + f.percentage, 0);
    if (flourTotal === 0) return null;

    const {
      yeastPercent,
      cumulativeF,
      effectiveYeastType,
      prefermentiPhase,
    } = calculateYeastForPhases(state.phases, state.yeastType);

    // Madre/Li.Co.Li vanno scorporati anche quando inoculano un poolish naturale.
    const starterHydration: number | null =
      effectiveYeastType === 'madre'  ? 50  :
      effectiveYeastType === 'licoli' ? 100 : null;

    const ingredients = calculateIngredients(state, yeastPercent, starterHydration);
    const hydrationStatus = getHydrationStatus(state.hydration, state.mode);
    const wBlend = calcWBlend(state.flours, state.mode, cumulativeF);

    const prefermentiSplit = prefermentiPhase
      ? calculatePrefermentiSplit(prefermentiPhase, {
          flour: ingredients.flourWeight,
          water: ingredients.flourWeight * (state.hydration / 100),
          salt:  ingredients.salt,
          oil:   ingredients.oil,
          yeast: ingredients.yeast,
        }, starterHydration)
      : null;

    return {
      ingredients,
      yeastPercent,
      hydrationStatus,
      wBlend,
      totalDoughWeight: ingredients.totalDoughWeight,
      flourWeight: ingredients.flourWeight,
      cumulativeF,
      prefermentiSplit,
      effectiveYeastType,
    };
  }, [state]);
}
