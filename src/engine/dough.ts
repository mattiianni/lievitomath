import type { DoughState } from '../types/dough';
import type { IngredientWeights } from '../types/results';

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
