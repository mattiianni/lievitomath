import { useMemo } from 'react';
import { useDoughStore } from '../store/useDoughStore';
import { cumulativeFermentation, yeastPercentFromFermentation, q10Factor } from '../engine/fermentation';
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

    // Rileva fase prefermento attiva (biga o poolish) — serve prima del calcolo lievito
    const prefermentiPhase = state.phases.find(
      p => (p.id === 'biga' || p.id === 'poolish') && p.active && p.flourPercent != null
    );

    // cumulativeFermentation include biga/poolish (k=1.0) se attivi — usato per WBlend
    const cumulativeF = cumulativeFermentation(state.phases);

    // Se c'è biga/poolish, il lievito si calcola SOLO per la fase prefermento:
    // il lievito viene messo tutto nel prefermento, che fermenta per quelle ore.
    // Usare F totale darebbe un valore troppo basso (biga 18h + puntata + appretto = ~16h).
    const yeastCalcF = prefermentiPhase
      ? prefermentiPhase.hours * q10Factor(prefermentiPhase.temperatureCelsius) * prefermentiPhase.k
      : cumulativeF;
    const yeastPercent = yeastPercentFromFermentation(yeastCalcF, state.yeastType);
    const ingredients = calculateIngredients(state, yeastPercent);
    const hydrationStatus = getHydrationStatus(state.hydration, state.mode);
    const wBlend = calcWBlend(state.flours, state.mode, cumulativeF);

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
