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
    // Passa yeastType per applicare k_frigo corretto (sourdough ≠ lievito di birra)
    const cumulativeF = cumulativeFermentation(state.phases, state.yeastType);

    // Calibrazione Giorilli: 1 kg farina + 440g acqua + 10g lievito = 1% LDB su farina biga
    // Condizioni di riferimento: 18h@18°C → F_REF = 18 × q10(18) ≈ 11.88
    // Formula: yeastPercent ≈ 1% × (F_REF/F_biga) × (flourPercent/100) su farina totale
    //          = 1% su farina biga alle condizioni standard, scalato con F e flourPercent.
    const F_BIGA_REF = 18 * Math.pow(2, (18 - 24) / 10); // ≈ 11.88
    const yeastCalcF = prefermentiPhase
      ? (prefermentiPhase.hours * q10Factor(prefermentiPhase.temperatureCelsius) * prefermentiPhase.k)
        / (F_BIGA_REF * ((prefermentiPhase.flourPercent ?? 40) / 100))
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
