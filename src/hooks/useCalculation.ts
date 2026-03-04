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
    // Passa yeastType per applicare k_frigo corretto (madre/licoli ≠ lievito di birra)
    const cumulativeF = cumulativeFermentation(state.phases, state.yeastType);

    // ── Calibrazione lievito ────────────────────────────────────────────────
    // BIGA (Giorilli): 1% LdB su farina biga @18h@18°C
    //   F_BIGA_REF = 18 × q10(18) ≈ 11.88
    //   yeastCalcF = F_biga / (F_BIGA_REF × flourPct)
    //   check: 11.88/(11.88×0.40) = 2.5 → 1/2.5 = 0.40% tot = 1.0% su biga ✓
    //   La biga è sempre LdB fresco per definizione.
    //
    // POOLISH: 0.3% LdB su farina poolish @12h@20°C
    //   F_POOLISH_REF = 12 × q10(20) ≈ 9.09
    //   yeastCalcF = F_poolish / (F_POOLISH_REF × flourPct × 0.3)
    //   check: 9.09/(9.09×0.30×0.3) = 11.11 → 1/11.11 = 0.09% tot = 0.3% su poolish ✓
    const F_BIGA_REF    = 18 * Math.pow(2, (18 - 24) / 10); // ≈ 11.88
    const F_POOLISH_REF = 12 * Math.pow(2, (20 - 24) / 10); // ≈ 9.09

    // Biga: sempre LdB fresco (per definizione); poolish: segue la scelta utente
    const effectiveYeastType = prefermentiPhase?.id === 'biga' ? 'fresh' : state.yeastType;

    const yeastCalcF = prefermentiPhase
      ? prefermentiPhase.id === 'biga'
        ? (prefermentiPhase.hours * q10Factor(prefermentiPhase.temperatureCelsius) * prefermentiPhase.k)
          / (F_BIGA_REF * ((prefermentiPhase.flourPercent ?? 40) / 100))
        : (prefermentiPhase.hours * q10Factor(prefermentiPhase.temperatureCelsius) * prefermentiPhase.k)
          / (F_POOLISH_REF * ((prefermentiPhase.flourPercent ?? 30) / 100) * 0.3)
      : cumulativeF;
    const yeastPercent = yeastPercentFromFermentation(yeastCalcF, effectiveYeastType);

    // starterHydration: solo per metodo diretto (senza biga/poolish attiva) con madre/licoli
    // La biga/poolish gestisce già la propria idratazione internamente.
    const starterHydration: number | null =
      prefermentiPhase ? null :
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
      effectiveYeastType,
    };
  }, [state]);
}
