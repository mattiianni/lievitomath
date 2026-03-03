import { useMemo } from 'react';
import { useDoughStore } from '../store/useDoughStore';
import { cumulativeFermentation, yeastPercentFromFermentation } from '../engine/fermentation';
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

    // cumulativeFermentation include già biga/poolish (k=1.0) se attivi
    const cumulativeF = cumulativeFermentation(state.phases);
    const yeastPercent = yeastPercentFromFermentation(cumulativeF, state.yeastType);
    const ingredients = calculateIngredients(state, yeastPercent);
    const hydrationStatus = getHydrationStatus(state.hydration, state.mode);
    const wBlend = calcWBlend(state.flours, state.mode, cumulativeF);

    // Rileva fase prefermento attiva (biga o poolish)
    const prefermentiPhase = state.phases.find(
      p => (p.id === 'biga' || p.id === 'poolish') && p.active && p.flourPercent != null
    );

    const prefermentiSplit = prefermentiPhase
      ? calculatePrefermentiSplit(prefermentiPhase, {
          flour: ingredients.flourWeight,
          water: ingredients.flourWeight * (state.hydration / 100),
          salt:  ingredients.salt,
          oil:   ingredients.oil,
          yeast: ingredients.yeast,
        })
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
    };
  }, [state]);
}
