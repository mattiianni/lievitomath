import type { DoughMode, FermentationPhase, YeastType } from '../types/dough';
import { cumulativeFermentation, yeastPercentFromFermentation } from './fermentation';
import { calculateIngredients, calculatePrefermentiSplit } from './dough';
import type { PrefermentiSplit } from './dough';
import { getTargetW } from './flour';
import { KNOWN_FLOURS, type KnownFlour } from '../data/flours';
import type { IngredientWeights } from '../types/results';

export interface GuidedParams {
  mode: DoughMode;
  pieces: number;
  ambientTemp: number;
  yeastType: YeastType;
  usesFridge: boolean;
  prefermento: 'none' | 'biga' | 'poolish';
  totalHours: number;
}

const MODE_DEFAULTS: Record<DoughMode, { weightPerPiece: number; hydration: number; salt: number; oil: number }> = {
  napoletana: { weightPerPiece: 270, hydration: 65, salt: 2.8, oil: 0 },
  teglia:     { weightPerPiece: 660, hydration: 78, salt: 2.5, oil: 3 },
  pane:       { weightPerPiece: 800, hydration: 70, salt: 2.2, oil: 0 },
};

const APPRETTO_H:   Record<DoughMode, number> = { napoletana: 4, teglia: 3, pane: 2 };
const PUNTATA_MIN:  Record<DoughMode, number> = { napoletana: 1, teglia: 1, pane: 2 };
const T_APPRETTO:   Record<DoughMode, number> = { napoletana: 22, teglia: 22, pane: 24 };

export function suggestPhases(params: GuidedParams): FermentationPhase[] {
  const { mode, ambientTemp, yeastType, usesFridge, prefermento, totalHours } = params;
  const isSourdough = yeastType === 'madre' || yeastType === 'licoli';
  const appH       = APPRETTO_H[mode];
  const puntataMin = PUNTATA_MIN[mode];
  const tApp       = T_APPRETTO[mode];
  const phases: FermentationPhase[] = [];

  if (prefermento === 'biga' && !isSourdough) {
    let bigaH    = Math.min(totalHours - appH - puntataMin, 18);
    bigaH        = Math.max(bigaH, 4);
    let puntataH = totalHours - bigaH - appH;
    if (puntataH < puntataMin) { bigaH -= (puntataMin - puntataH); puntataH = puntataMin; }
    puntataH = Math.max(puntataH, 0);

    phases.push({ id: 'biga', label: 'Biga', hours: bigaH, temperatureCelsius: 18, k: 1.0, active: true, flourPercent: 40, hydrationPercent: 44 });
    if (puntataH > 0)
      phases.push({ id: 'puntata', label: 'Puntata', hours: puntataH, temperatureCelsius: ambientTemp, k: 1.0, active: true });
    phases.push({ id: 'appretto', label: 'Appretto', hours: appH, temperatureCelsius: tApp, k: 0.6, active: true, locked: true });

  } else if (prefermento === 'poolish') {
    let poolishH = Math.min(totalHours - appH - puntataMin, 12);
    poolishH     = Math.max(poolishH, 2);
    let puntataH = totalHours - poolishH - appH;
    if (puntataH < puntataMin) { poolishH -= (puntataMin - puntataH); puntataH = puntataMin; }
    puntataH = Math.max(puntataH, 0);

    phases.push({ id: 'poolish', label: 'Poolish', hours: poolishH, temperatureCelsius: 20, k: 1.0, active: true, flourPercent: 30, hydrationPercent: 100 });
    if (puntataH > 0)
      phases.push({ id: 'puntata', label: 'Puntata', hours: puntataH, temperatureCelsius: ambientTemp, k: 1.0, active: true });
    phases.push({ id: 'appretto', label: 'Appretto', hours: appH, temperatureCelsius: tApp, k: 0.6, active: true, locked: true });

  } else {
    if (usesFridge) {
      const puntataH = Math.max(puntataMin, Math.round(totalHours * 0.08));
      const frigoH   = totalHours - puntataH - appH;
      if (frigoH > 0) {
        phases.push({ id: 'puntata', label: 'Puntata', hours: puntataH, temperatureCelsius: ambientTemp, k: 1.0, active: true });
        phases.push({ id: 'frigo',   label: 'Frigo',   hours: frigoH,   temperatureCelsius: 4,            k: 0.2, active: true });
      } else {
        phases.push({ id: 'puntata', label: 'Puntata', hours: Math.max(totalHours - appH, 1), temperatureCelsius: ambientTemp, k: 1.0, active: true });
      }
    } else {
      phases.push({ id: 'puntata', label: 'Puntata', hours: Math.max(totalHours - appH, 1), temperatureCelsius: ambientTemp, k: 1.0, active: true });
    }
    phases.push({ id: 'appretto', label: 'Appretto', hours: appH, temperatureCelsius: tApp, k: 0.6, active: true, locked: true });
  }

  return phases;
}

export function suggestFlour(mode: DoughMode, cumulativeF: number): KnownFlour {
  const targetW     = getTargetW(mode, cumulativeF);
  const validFlours = KNOWN_FLOURS.filter(f => f.w > 0);
  return validFlours.reduce((best, f) =>
    Math.abs(f.w - targetW) < Math.abs(best.w - targetW) ? f : best
  );
}

export interface GuidedResult {
  ingredients: IngredientWeights & { flourWeight: number; totalDoughWeight: number };
  yeastPercent: number;
  cumulativeF: number;
  phases: FermentationPhase[];
  suggestedFlour: KnownFlour;
  targetW: number;
  prefermentiSplit: PrefermentiSplit | null;
  mode: DoughMode;
  pieces: number;
  weightPerPiece: number;
  hydration: number;
  salt: number;
  oil: number;
  yeastType: YeastType;
  effectiveYeastType: YeastType;
}

export function calculateGuided(params: GuidedParams): GuidedResult {
  const { mode, pieces, yeastType } = params;
  const { weightPerPiece, hydration, salt, oil } = MODE_DEFAULTS[mode];

  const phases      = suggestPhases(params);
  const cumulativeF = cumulativeFermentation(phases, yeastType);

  const prefPhase        = phases.find(p => (p.id === 'biga' || p.id === 'poolish') && p.active);
  const effectiveYeastType: YeastType = prefPhase?.id === 'biga' ? 'fresh' : yeastType;

  // Stessa calibrazione di useCalculation.ts
  const F_BIGA_REF    = 18 * Math.pow(2, (18 - 24) / 10); // ≈ 11.88
  const F_POOLISH_REF = 12 * Math.pow(2, (20 - 24) / 10); // ≈ 9.09

  let yeastCalcF: number;
  if (prefPhase) {
    const f = prefPhase.hours * Math.pow(2, (prefPhase.temperatureCelsius - 24) / 10) * prefPhase.k;
    yeastCalcF = prefPhase.id === 'biga'
      ? f / (F_BIGA_REF    * ((prefPhase.flourPercent ?? 40) / 100))
      : f / (F_POOLISH_REF * ((prefPhase.flourPercent ?? 30) / 100) * 0.3);
  } else {
    yeastCalcF = cumulativeF;
  }
  const yeastPercent = yeastPercentFromFermentation(yeastCalcF, effectiveYeastType);

  const isSourdoughDirect = !prefPhase && (effectiveYeastType === 'madre' || effectiveYeastType === 'licoli');
  const starterHydration: number | null = isSourdoughDirect
    ? (yeastType === 'madre' ? 50 : 100)
    : null;

  const recipe      = { pieces, weightPerPiece, hydration, salt, oil };
  const ingredients = calculateIngredients(recipe, yeastPercent, starterHydration);

  const prefermentiSplit = prefPhase
    ? calculatePrefermentiSplit(prefPhase, {
        flour: ingredients.flourWeight,
        water: ingredients.flourWeight * (hydration / 100),
        salt:  ingredients.salt,
        oil:   ingredients.oil,
        yeast: ingredients.yeast,
      })
    : null;

  const suggestedFlour = suggestFlour(mode, cumulativeF);
  const targetW        = getTargetW(mode, cumulativeF);

  return {
    ingredients, yeastPercent, cumulativeF, phases,
    suggestedFlour, targetW, prefermentiSplit,
    mode, pieces, weightPerPiece, hydration, salt, oil,
    yeastType, effectiveYeastType,
  };
}
