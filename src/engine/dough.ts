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
  const hydration = phase.id === 'biga' ? 44 : 100;

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
 * Farina = 100% (base di calcolo)
 * Tutto il resto è espresso come % di farina.
 *
 * Peso totale = farina × (1 + idro/100 + sale/100 + olio/100 + lievito/100)
 * → farina = peso totale / denominatore
 */
export function calculateIngredients(
  recipe: Pick<DoughState, 'pieces' | 'weightPerPiece' | 'hydration' | 'salt' | 'oil'>,
  yeastPercent: number
): IngredientWeights & { flourWeight: number; totalDoughWeight: number } {
  const totalDough = recipe.pieces * recipe.weightPerPiece;

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
    salt:  Math.round(salt * 10) / 10,   // 0.1g precisione
    oil:   Math.round(oil),
    yeast: Math.round(yeast * 10) / 10,  // 0.1g precisione
    flourWeight: flour,
    totalDoughWeight: totalDough,
  };
}
