import type { DoughMode, FermentationPhase, YeastType } from '../types/dough';
import { calculateYeastForPhases } from './fermentation';
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
  staglioAFreddo: boolean; // true = panetti in frigo (staglio prima); false = massa in frigo (staglio dopo)
  prefermento: 'none' | 'biga' | 'poolish';
  totalHours: number;
}

const MODE_DEFAULTS: Record<DoughMode, { weightPerPiece: number; hydration: number; salt: number; oil: number }> = {
  napoletana: { weightPerPiece: 270, hydration: 65, salt: 2.8, oil: 0 },
  teglia:     { weightPerPiece: 660, hydration: 78, salt: 2.5, oil: 3 },
  pane:       { weightPerPiece: 800, hydration: 70, salt: 2.2, oil: 0 },
};

// Durata impasto fissa in guided mode (personalizzabile in modalità avanzata)
const IMPASTO_H = 0.75;

// T_APPRETTO rimosso: l'appretto avviene a temperatura ambiente (ambientTemp)

// Puntata fuori frigo prima dell'ingresso in cella (standard professionale)
const PUNTATA_FRIGO: Record<DoughMode, number> = { napoletana: 2, teglia: 2, pane: 2 };

// Appretto base senza frigo (impasto già a temperatura ambiente)
const APPRETTO_NO_FRIGO: Record<DoughMode, number> = { napoletana: 4, teglia: 3, pane: 2 };
// Appretto base dopo prefermento (biga/poolish, impasto a T amb)
const APPRETTO_PREF:     Record<DoughMode, number> = { napoletana: 4, teglia: 3, pane: 2 };
// Appretto minimo di partenza per calcolo con frigo (poi può essere esteso dalla formula)
const APPRETTO_FRIGO_BASE: Record<DoughMode, number> = { napoletana: 4, teglia: 4, pane: 3 };

// Appretto fisso per "panetti in frigo" (staglio PRIMA del frigo): già formati, appretto breve
const APPRETTO_PANETTI_FRIGO: Record<DoughMode, number> = { napoletana: 4, teglia: 3, pane: 2 };

/**
 * Calcola il tempo di appretto necessario affinché l'impasto torni a temperatura
 * ambiente dopo il frigo, usando la legge di Newton del raffreddamento.
 *
 * Formula inversa: T(t) = T_amb - (T_amb - T_frigo) × exp(-k × t)
 * → t_min = -ln((T_amb - T_target) / (T_amb - T_frigo)) / k
 *
 * Target: T_amb - 1°C (praticamente temperatura ambiente, tolleranza 1°C)
 * k = 0.5 h⁻¹  (empirico per pallina/pagnotta in contenitore in aria; k=1.0 era troppo ottimistico)
 *
 * Restituisce anche la temperatura prevista a fine appretto per il display.
 */
export function calcApprettoAfterFrigo(
  ambientTemp: number,
  baseApprettoH: number,
  fridgeTemp = 4,
  k = 0.5
): { apprettoH: number; exitTempC: number } {
  // Target: T_amb - 1°C se ambiente è fresco (≤20°C); cap a 20°C se fa caldo
  // Sopra 20°C non ha senso aspettare che l'impasto arrivi a piena T_amb
  const targetTemp = Math.min(ambientTemp - 1, 21);

  let tMin = 0;
  const deltaAmb   = ambientTemp - fridgeTemp;
  const deltaTarget = ambientTemp - targetTemp;

  if (deltaAmb > 0 && deltaTarget > 0 && deltaTarget < deltaAmb) {
    tMin = -Math.log(deltaTarget / deltaAmb) / k;
  }

  // Arrotonda a mezz'ora superiore + 0.5h buffer per la lievitazione dell'appretto
  const tMinRounded = Math.ceil((tMin + 0.5) * 2) / 2;
  const apprettoH   = Math.max(baseApprettoH, tMinRounded);

  // Temperatura prevista a fine appretto
  const exitTempC = Math.round(
    (ambientTemp - deltaAmb * Math.exp(-k * apprettoH)) * 10
  ) / 10;

  return { apprettoH, exitTempC };
}

export function suggestPhases(params: GuidedParams): FermentationPhase[] {
  const { mode, ambientTemp, yeastType, usesFridge, staglioAFreddo, prefermento, totalHours } = params;
  const isSourdough = yeastType === 'madre' || yeastType === 'licoli';
  const phases: FermentationPhase[] = [];

  // Helper — inserisce la fase impasto prima della puntata
  const impasto = (T: number): FermentationPhase =>
    ({ id: 'impasto', label: 'Impasto', hours: IMPASTO_H, temperatureCelsius: T, k: 0.0, active: true, locked: true });

  if (prefermento === 'biga' && !isSourdough) {
    if (usesFridge) {
      const { apprettoH: appH } = calcApprettoAfterFrigo(ambientTemp, APPRETTO_FRIGO_BASE[mode]);
      const puntataH = PUNTATA_FRIGO[mode];
      const minFrigoH = 4;
      let bigaH  = Math.min(totalHours - IMPASTO_H - appH - puntataH - minFrigoH, 18);
      bigaH      = Math.max(bigaH, 4);
      const frigoH = totalHours - IMPASTO_H - bigaH - puntataH - appH;

      phases.push({ id: 'biga', label: 'Biga', hours: bigaH, temperatureCelsius: 18, k: 1.0, active: true, flourPercent: 40, hydrationPercent: 44 });
      phases.push(impasto(ambientTemp));
      if (frigoH > 0) {
        phases.push({ id: 'puntata', label: 'Puntata', hours: puntataH, temperatureCelsius: ambientTemp, k: 1.0, active: true });
        phases.push({ id: 'frigo',   label: 'Frigo',   hours: frigoH,   temperatureCelsius: 4,            k: 0.2, active: true });
      } else {
        phases.push({ id: 'puntata', label: 'Puntata', hours: Math.max(1, totalHours - IMPASTO_H - bigaH - appH), temperatureCelsius: ambientTemp, k: 1.0, active: true });
      }
      phases.push({ id: 'appretto', label: 'Appretto', hours: appH, temperatureCelsius: ambientTemp, k: 0.6, active: true, locked: true });
    } else {
      const appH   = APPRETTO_PREF[mode];
      const puntMin = 1;
      let bigaH    = Math.min(totalHours - IMPASTO_H - appH - puntMin, 18);
      bigaH        = Math.max(bigaH, 4);
      let puntataH = totalHours - IMPASTO_H - bigaH - appH;
      if (puntataH < puntMin) { bigaH -= (puntMin - puntataH); puntataH = puntMin; }
      puntataH = Math.max(puntataH, 0);

      phases.push({ id: 'biga', label: 'Biga', hours: bigaH, temperatureCelsius: 18, k: 1.0, active: true, flourPercent: 40, hydrationPercent: 44 });
      phases.push(impasto(ambientTemp));
      if (puntataH > 0)
        phases.push({ id: 'puntata', label: 'Puntata', hours: puntataH, temperatureCelsius: ambientTemp, k: 1.0, active: true });
      phases.push({ id: 'appretto', label: 'Appretto', hours: appH, temperatureCelsius: ambientTemp, k: 0.6, active: true, locked: true });
    }

  } else if (prefermento === 'poolish') {
    if (usesFridge) {
      const { apprettoH: appH } = calcApprettoAfterFrigo(ambientTemp, APPRETTO_FRIGO_BASE[mode]);
      const puntataH = PUNTATA_FRIGO[mode];
      const minFrigoH = 4;
      let poolishH = Math.min(totalHours - IMPASTO_H - appH - puntataH - minFrigoH, 12);
      poolishH     = Math.max(poolishH, 2);
      const frigoH = totalHours - IMPASTO_H - poolishH - puntataH - appH;

      phases.push({ id: 'poolish', label: 'Poolish', hours: poolishH, temperatureCelsius: 20, k: 1.0, active: true, flourPercent: 30, hydrationPercent: 100 });
      phases.push(impasto(ambientTemp));
      if (frigoH > 0) {
        phases.push({ id: 'puntata', label: 'Puntata', hours: puntataH, temperatureCelsius: ambientTemp, k: 1.0, active: true });
        phases.push({ id: 'frigo',   label: 'Frigo',   hours: frigoH,   temperatureCelsius: 4,            k: 0.2, active: true });
      } else {
        phases.push({ id: 'puntata', label: 'Puntata', hours: Math.max(1, totalHours - IMPASTO_H - poolishH - appH), temperatureCelsius: ambientTemp, k: 1.0, active: true });
      }
      phases.push({ id: 'appretto', label: 'Appretto', hours: appH, temperatureCelsius: ambientTemp, k: 0.6, active: true, locked: true });
    } else {
      const appH   = APPRETTO_PREF[mode];
      const puntMin = 1;
      let poolishH = Math.min(totalHours - IMPASTO_H - appH - puntMin, 12);
      poolishH     = Math.max(poolishH, 2);
      let puntataH = totalHours - IMPASTO_H - poolishH - appH;
      if (puntataH < puntMin) { poolishH -= (puntMin - puntataH); puntataH = puntMin; }
      puntataH = Math.max(puntataH, 0);

      phases.push({ id: 'poolish', label: 'Poolish', hours: poolishH, temperatureCelsius: 20, k: 1.0, active: true, flourPercent: 30, hydrationPercent: 100 });
      phases.push(impasto(ambientTemp));
      if (puntataH > 0)
        phases.push({ id: 'puntata', label: 'Puntata', hours: puntataH, temperatureCelsius: ambientTemp, k: 1.0, active: true });
      phases.push({ id: 'appretto', label: 'Appretto', hours: appH, temperatureCelsius: ambientTemp, k: 0.6, active: true, locked: true });
    }

  } else if (usesFridge && staglioAFreddo) {
    const { apprettoH: appH } = calcApprettoAfterFrigo(ambientTemp, APPRETTO_PANETTI_FRIGO[mode], 4, 0.6);
    const puntataH = PUNTATA_FRIGO[mode];
    const frigoH   = totalHours - IMPASTO_H - puntataH - appH;

    phases.push(impasto(ambientTemp));
    if (frigoH > 0) {
      phases.push({ id: 'puntata', label: 'Puntata', hours: puntataH, temperatureCelsius: ambientTemp, k: 1.0, active: true });
      phases.push({ id: 'frigo',   label: 'Frigo',   hours: frigoH,   temperatureCelsius: 4,            k: 0.2, active: true });
    } else {
      phases.push({ id: 'puntata', label: 'Puntata', hours: Math.max(1, totalHours - IMPASTO_H - appH), temperatureCelsius: ambientTemp, k: 1.0, active: true });
    }
    phases.push({ id: 'appretto', label: 'Appretto', hours: appH, temperatureCelsius: ambientTemp, k: 0.6, active: true, locked: true });

  } else if (usesFridge) {
    const { apprettoH: appH } = calcApprettoAfterFrigo(ambientTemp, APPRETTO_FRIGO_BASE[mode]);
    const puntataH = PUNTATA_FRIGO[mode];
    const frigoH   = totalHours - IMPASTO_H - puntataH - appH;

    phases.push(impasto(ambientTemp));
    if (frigoH > 0) {
      phases.push({ id: 'puntata', label: 'Puntata', hours: puntataH, temperatureCelsius: ambientTemp, k: 1.0, active: true });
      phases.push({ id: 'frigo',   label: 'Frigo',   hours: frigoH,   temperatureCelsius: 4,            k: 0.2, active: true });
    } else {
      phases.push({ id: 'puntata', label: 'Puntata', hours: Math.max(1, totalHours - IMPASTO_H - APPRETTO_NO_FRIGO[mode]), temperatureCelsius: ambientTemp, k: 1.0, active: true });
    }
    phases.push({ id: 'appretto', label: 'Appretto', hours: appH, temperatureCelsius: ambientTemp, k: 0.6, active: true, locked: true });

  } else {
    const appH     = APPRETTO_NO_FRIGO[mode];
    const puntataH = Math.max(1, totalHours - IMPASTO_H - appH);
    phases.push(impasto(ambientTemp));
    phases.push({ id: 'puntata',  label: 'Puntata',  hours: puntataH, temperatureCelsius: ambientTemp, k: 1.0, active: true });
    phases.push({ id: 'appretto', label: 'Appretto', hours: appH,     temperatureCelsius: ambientTemp,         k: 0.6, active: true, locked: true });
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
  exitTempC: number | null;  // temperatura prevista impasto a fine appretto (solo frigo diretto)
  staglioAFreddo: boolean;
}

export function calculateGuided(params: GuidedParams): GuidedResult {
  const { mode, pieces, yeastType, staglioAFreddo, prefermento, ambientTemp } = params;
  const { weightPerPiece, hydration, salt, oil } = MODE_DEFAULTS[mode];

  const phases = suggestPhases(params);
  const {
    yeastPercent,
    cumulativeF,
    effectiveYeastType,
    prefermentiPhase: prefPhase,
  } = calculateYeastForPhases(phases, yeastType);

  const starterHydration: number | null =
    effectiveYeastType === 'madre' ? 50 :
    effectiveYeastType === 'licoli' ? 100 : null;

  const recipe      = { pieces, weightPerPiece, hydration, salt, oil };
  const ingredients = calculateIngredients(recipe, yeastPercent, starterHydration);

  const prefermentiSplit = prefPhase
    ? calculatePrefermentiSplit(prefPhase, {
        flour: ingredients.flourWeight,
        water: ingredients.flourWeight * (hydration / 100),
        salt:  ingredients.salt,
        oil:   ingredients.oil,
        yeast: ingredients.yeast,
      }, starterHydration)
    : null;

  const suggestedFlour = suggestFlour(mode, cumulativeF);
  const targetW        = getTargetW(mode, cumulativeF);

  // Calcola temperatura di uscita per tutte le combinazioni con frigo attivo
  const hasActiveFrigo = phases.some(p => p.id === 'frigo' && p.active);
  let exitTempC: number | null = null;
  if (hasActiveFrigo) {
    if (staglioAFreddo && prefermento === 'none') {
      const { exitTempC: t } = calcApprettoAfterFrigo(ambientTemp, APPRETTO_PANETTI_FRIGO[mode], 4, 0.6);
      exitTempC = t;
    } else {
      const { exitTempC: t } = calcApprettoAfterFrigo(ambientTemp, APPRETTO_FRIGO_BASE[mode]);
      exitTempC = t;
    }
  }

  return {
    ingredients, yeastPercent, cumulativeF, phases,
    suggestedFlour, targetW, prefermentiSplit,
    mode, pieces, weightPerPiece, hydration, salt, oil,
    yeastType, effectiveYeastType, exitTempC, staglioAFreddo,
  };
}
