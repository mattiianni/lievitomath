import type { DoughState, FermentationPhase } from '../types/dough';
import type { IngredientWeights } from '../types/results';

export interface BigaIngredients {
  type: 'biga' | 'poolish';
  flour: number;
  water: number;
  yeast: number;
  totalWeight: number;
  hydration: number;
  flourPercent: number;
  hours: number;
  temperatureCelsius: number;
}

export interface MainDoughIngredients {
  flourToAdd: number;
  waterToAdd: number;
  salt: number;
  oil: number;
  prefermentiToAdd: number;
}

export interface PrefermentiSplit {
  prefermento: BigaIngredients;
  mainDough: MainDoughIngredients;
  totalFinalDough: number;
}

export function calculatePrefermentiSplit(
  phase: FermentationPhase,
  total: { flour: number; water: number; salt: number; oil: number; yeast: number }
): PrefermentiSplit {
  const pct = phase.flourPercent ?? 40;
  const hydration = phase.hydrationPercent ?? (phase.id === 'biga' ? 44 : 100);

  const prefFlourRaw = total.flour * (pct / 100);
  const prefWaterRaw = prefFlourRaw * (hydration / 100);
  const prefYeast    = total.yeast; // tutto il lievito va nel prefermento
  const prefTotal    = prefFlourRaw + prefWaterRaw + prefYeast;

  const mainFlour = total.flour - prefFlourRaw;
  const mainWater = total.water - prefWaterRaw;

  return {
    prefermento: {
      type: phase.id as 'biga' | 'poolish',
      flour:             Math.round(prefFlourRaw),
      water:             Math.round(prefWaterRaw),
      yeast:             prefYeast,
      totalWeight:       Math.round(prefTotal),
      hydration,
      flourPercent:      pct,
      hours:             phase.hours,
      temperatureCelsius: phase.temperatureCelsius,
    },
    mainDough: {
      flourToAdd:      Math.round(mainFlour),
      waterToAdd:      Math.round(mainWater),
      salt:            total.salt,
      oil:             total.oil,
      prefermentiToAdd: Math.round(prefTotal),
    },
    totalFinalDough: Math.round(mainFlour + mainWater + total.salt + total.oil + prefTotal),
  };
}

/**
 * Calcola i grammi di ogni ingrediente usando le baker's percentages.
 *
 * Farina = 100% (base di calcolo).
 * Tutto il resto è espresso come % di farina.
 *
 * ── Lievito di birra / IDY (starterHydration = null) ──────────────────────
 * Peso totale = farina × (1 + idro/100 + sale/100 + olio/100 + lievito/100)
 * → farina = peso totale / denominatore
 *
 * ── Madre / Licoli (starterHydration = 50 o 100) ─────────────────────────
 * Il prefermento naturale contiene farina + acqua.
 *   farina_starter = starter × 100/(100+SH)
 *   acqua_starter  = starter × SH/(100+SH)
 *
 * Formula corretta (idratazione target calcolata sul totale farina+acqua):
 *   F_totale   = T / (1 + H + S + O)           ← Y non nel denominatore
 *   starter    = F_totale × Y%
 *   farina_netta = F_totale × (1 - Y × 100/(100+SH))
 *   acqua_netta  = F_totale × (H - Y × SH/(100+SH))
 *
 * Verifica: farina_netta + acqua_netta + sale + olio + starter = T ✓
 * Idratazione reale: (acqua_netta + acqua_starter)/(farina_netta + farina_starter) = H ✓
 *
 * @param starterHydration  null per LdB/IDY; 50 per madre; 100 per licoli
 */
export function calculateIngredients(
  recipe: Pick<DoughState, 'pieces' | 'weightPerPiece' | 'hydration' | 'salt' | 'oil'>,
  yeastPercent: number,
  starterHydration: number | null = null
): IngredientWeights & { flourWeight: number; totalDoughWeight: number } {
  const totalDough = recipe.pieces * recipe.weightPerPiece;

  if (starterHydration !== null) {
    // ── Sourdough (madre / licoli) ─────────────────────────────────────────
    const SH = starterHydration;
    const denominator  = 1 + recipe.hydration / 100 + recipe.salt / 100 + recipe.oil / 100;
    const totalFlour   = totalDough / denominator;
    const starter      = totalFlour * (yeastPercent / 100);
    const starterFlourFrac = 100 / (100 + SH);
    const starterWaterFrac = SH  / (100 + SH);
    const flourToAdd = totalFlour * (1 - (yeastPercent / 100) * starterFlourFrac);
    const waterToAdd = totalFlour * (recipe.hydration / 100 - (yeastPercent / 100) * starterWaterFrac);
    const salt = totalFlour * (recipe.salt / 100);
    const oil  = totalFlour * (recipe.oil  / 100);

    return {
      flour: Math.round(flourToAdd),           // farina da aggiungere (netta)
      water: Math.round(waterToAdd),           // acqua da aggiungere (netta)
      salt:  Math.round(salt * 10) / 10,
      oil:   Math.round(oil),
      yeast: Math.round(starter * 10) / 10,   // starter da aggiungere
      flourWeight:      totalFlour,            // farina totale (base percentuali)
      totalDoughWeight: totalDough,
    };
  }

  // ── Lievito di birra / IDY ─────────────────────────────────────────────
  const denominator =
    1 +
    recipe.hydration / 100 +
    recipe.salt / 100 +
    recipe.oil / 100 +
    yeastPercent / 100;

  const flour = totalDough / denominator;
  const water = flour * (recipe.hydration / 100);
  const salt  = flour * (recipe.salt / 100);
  const oil   = flour * (recipe.oil / 100);
  const yeast = flour * (yeastPercent / 100);

  return {
    flour: Math.round(flour),
    water: Math.round(water),
    salt:  Math.round(salt * 10) / 10,
    oil:   Math.round(oil),
    yeast: Math.round(yeast * 10) / 10,
    flourWeight:      flour,
    totalDoughWeight: totalDough,
  };
}
