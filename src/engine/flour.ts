import type { Flour, DoughMode } from '../types/dough';
import type { HydrationStatus, WBlendResult } from '../types/results';
import { HYDRATION_RANGES } from '../constants/modes';

export function calculateWBlend(flours: Flour[]): number {
  const validFlours = flours.filter(f => f.w > 0);
  const totalPercent = validFlours.reduce((s, f) => s + f.percentage, 0);
  if (totalPercent === 0) return 0;
  return validFlours.reduce((sum, f) => sum + (f.w * f.percentage) / totalPercent, 0);
}

export function getTargetW(mode: DoughMode, cumulativeF: number): number {
  // Formula Japi (buonapizza.forumfree.it): ORE = 0.3568 × exp(0.01273 × W)
  // Inversa: W = ln(F / 0.3568) / 0.01273
  // cumulativeF è già "ore equivalenti a 24°C" → applicabile direttamente
  const F = Math.max(cumulativeF, 0.5);
  const baseW = Math.round(Math.log(F / 0.3568) / 0.01273);

  // Offset per modo: teglia ad alta idratazione stresa ulteriormente la maglia
  const OFFSET: Record<DoughMode, number> = {
    napoletana:  0,
    teglia:     10,
    pane:        0,
  };
  // Minimo assoluto: Caputo Nuvola (W 270) — mai suggerire farine più deboli
  const MIN_W: Record<DoughMode, number> = {
    napoletana: 270,
    teglia:     280,
    pane:       270,
  };

  return Math.max(baseW + OFFSET[mode], MIN_W[mode]);
}

export function getWBlendSuggestion(delta: number): string {
  if (Math.abs(delta) <= 10) return 'Il blend è in target.';
  if (delta < -40) return 'W molto basso: aggiungi 20-30% Manitoba (W 380-400).';
  if (delta < -20) return 'W basso: aggiungi 10-20% di farina forte (W 350+).';
  if (delta < -10) return 'W leggermente basso: aggiungi 5-10% di farina forte.';
  if (delta > 40)  return 'W molto alto per questa fermentazione: puoi usare una farina meno forte o accorciare la lievitazione.';
  if (delta > 20)  return 'W leggermente alto: va bene, dà più struttura. In alternativa riduci la percentuale di farina forte.';
  return 'W leggermente alto: sostituisci il 5-10% con una farina meno forte.';
}

export function getHydrationStatus(hydration: number, mode: DoughMode): HydrationStatus {
  const r = HYDRATION_RANGES[mode];
  if (hydration < r.too_low)          return 'too_low';
  if (hydration < r.low)              return 'low';
  if (hydration <= r.too_high_start)  return 'optimal';
  if (hydration <= r.too_high)        return 'high';
  return 'too_high';
}

// ─── Stato sale ───────────────────────────────────────────────────────────────
interface ParamRange {
  too_low: number; low: number; high: number; too_high: number;
}

const SALT_RANGES: Record<DoughMode, ParamRange> = {
  napoletana: { too_low: 2.0, low: 2.4, high: 3.2, too_high: 4.0 },
  teglia:     { too_low: 1.8, low: 2.0, high: 3.0, too_high: 3.8 },
  pane:       { too_low: 1.5, low: 1.8, high: 2.8, too_high: 3.2 },
};

const OIL_RANGES: Record<DoughMode, ParamRange> = {
  napoletana: { too_low: -1, low: -1, high: 2.0, too_high: 4.0 },  // 0% è ok
  teglia:     { too_low: 0.5, low: 1.5, high: 5.0, too_high: 7.0 },
  pane:       { too_low: -1, low: -1, high: 1.0, too_high: 3.0 }, // olio non tipico nel pane
};

export type SimpleStatus = 'ok' | 'warn' | 'bad';

export function getSaltStatus(salt: number, mode: DoughMode): SimpleStatus {
  const r = SALT_RANGES[mode];
  if (salt < r.too_low || salt > r.too_high) return 'bad';
  if (salt < r.low || salt > r.high) return 'warn';
  return 'ok';
}

export function getOilStatus(oil: number, mode: DoughMode): SimpleStatus {
  const r = OIL_RANGES[mode];
  if (oil > r.too_high) return 'bad';
  if (oil > r.high)     return 'warn';
  if (r.too_low > 0 && oil < r.too_low) return 'bad';
  if (r.low > 0 && oil < r.low) return 'warn';
  return 'ok';
}

// ─── Blend suggester ──────────────────────────────────────────────────────────
export interface BlendIngredient {
  brand: string;
  name: string;
  w: number;
  percentage: number;
  type: string;
}

// Farine anchor ordinate per W crescente — minimo assoluto: Caputo Nuvola (W 270)
const ANCHOR_FLOURS: BlendIngredient[] = [
  { brand: 'Caputo',        name: 'Nuvola',             w: 270, percentage: 0, type: '0'       },
  { brand: 'Caputo',        name: 'Cuoco',               w: 300, percentage: 0, type: '00'      },
  { brand: 'Caputo',        name: 'Rossa',               w: 330, percentage: 0, type: '00'      },
  { brand: 'Caputo',        name: 'Criscito (Manitoba)', w: 380, percentage: 0, type: 'manitoba' },
  { brand: 'Le 5 Stagioni', name: 'Oro',                 w: 390, percentage: 0, type: '0'       },
];

/**
 * Dato un W target, suggerisce la farina singola ottimale o il blend minimo necessario.
 * Filosofia: blend solo se strettamente necessario (nessuna singola farina entro ±15W).
 */
export function suggestBlend(targetW: number): BlendIngredient[] {
  const anchors = [...ANCHOR_FLOURS].sort((a, b) => a.w - b.w);

  // Se target <= farina più debole (W 270), suggerisci Nuvola al 100%
  if (targetW <= anchors[0].w) {
    return [{ ...anchors[0], percentage: 100 }];
  }
  // Se target >= farina più forte, suggerisci quella sola
  if (targetW >= anchors[anchors.length - 1].w) {
    return [{ ...anchors[anchors.length - 1], percentage: 100 }];
  }

  // Se una singola farina è entro ±15W dal target, usala al 100% (no blend)
  const exact = anchors.find(a => Math.abs(a.w - targetW) <= 15);
  if (exact) {
    return [{ ...exact, percentage: 100 }];
  }

  // Solo se nessuna singola farina copre il target: blend tra le due più vicine
  let lower = anchors[0];
  let upper = anchors[1];
  for (let i = 0; i < anchors.length - 1; i++) {
    if (anchors[i].w <= targetW && anchors[i + 1].w >= targetW) {
      lower = anchors[i];
      upper = anchors[i + 1];
      break;
    }
  }

  if (lower.w === upper.w) {
    return [{ ...lower, percentage: 100 }];
  }

  // Arrotonda al 5% più vicino
  const rawLower = ((upper.w - targetW) / (upper.w - lower.w)) * 100;
  const pLower = Math.round(rawLower / 5) * 5;
  const pUpper = 100 - pLower;

  const result: BlendIngredient[] = [];
  if (pLower > 0) result.push({ ...lower, percentage: pLower });
  if (pUpper > 0) result.push({ ...upper, percentage: pUpper });
  return result;
}

/** W blend risultante da un suggerimento */
export function blendSuggestionW(blend: BlendIngredient[]): number {
  const total = blend.reduce((s, f) => s + f.percentage, 0);
  return Math.round(blend.reduce((s, f) => s + (f.w * f.percentage) / total, 0));
}

// ─── Diagnosi farina attuale ───────────────────────────────────────────────────
export interface FlourDiagnosis {
  severity: 'ok' | 'warn' | 'critical';
  message: string;
}

export function getFlourDiagnosis(actualW: number, targetW: number): FlourDiagnosis {
  const delta = actualW - targetW;
  if (delta >= -20) return { severity: 'ok',      message: `W${actualW} — In target per questa fermentazione (richiesto W${targetW})` };
  if (delta >= -50) return { severity: 'warn',    message: `W${actualW} — Leggermente bassa vs W${targetW} richiesto. Rischio cedimento della maglia glutinica.` };
  return              { severity: 'critical', message: `W${actualW} — Troppo debole! Richiesto W${targetW}. L'impasto potrebbe collassare durante la fermentazione.` };
}

export function calcWBlend(flours: Flour[], mode: DoughMode, cumulativeF: number): WBlendResult {
  const currentW = Math.round(calculateWBlend(flours));
  const targetW  = getTargetW(mode, cumulativeF);
  const delta    = currentW - targetW;
  return { currentW, targetW, delta, suggestion: getWBlendSuggestion(delta) };
}
