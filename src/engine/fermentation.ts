import type { FermentationPhase, YeastType } from '../types/dough';

/**
 * Fattore Q10: l'attività del lievito raddoppia ogni 10°C rispetto a 24°C.
 * q10Factor(24) = 1.0
 * q10Factor(14) = 0.5
 * q10Factor(34) = 2.0
 */
export function q10Factor(tempC: number): number {
  const REF_TEMP = 24;
  return Math.pow(2, (tempC - REF_TEMP) / 10);
}

/**
 * Fermentazione cumulativa F = Σ(ore_i × q10(T_i) × k_i)
 * F rappresenta le "ore equivalenti a 24°C con k=1" di fermentazione.
 *
 * Coefficienti di fase k:
 *   puntata (bulk):  k = 1.0
 *   frigo LdB:       k = 0.2
 *   frigo LM/Licoli: k = -0.1 (a 4°C il LM quasi si ferma; i LAB continuano ad acidificare → inibiscono
 *                               il lievito → k negativo: il frigo AUMENTA il LM/Licoli necessario)
 *   appretto:        k = 0.6
 *
 * Calibrazione (YEAST_FACTORS.madre = 80, licoli = 107):
 *   senza frigo (2h+4h):           F≈4.1 → madre ~19.5% | licoli ~26.1%
 *   con 16h frigo + 4h appretto:   F≈3.7 → madre ~21.6% | licoli ~28.9%  (frigo aumenta ✓)
 *   con 24h frigo + 4h appretto:   F≈3.5 → madre ~22.9% | licoli ~30.6%
 *   con 48h frigo + 4h appretto:   F≈2.9 → madre ~27.6% | licoli ~36.9%
 */
export function cumulativeFermentation(phases: FermentationPhase[], yeastType?: YeastType): number {
  return phases
    .filter(p => p.active && p.hours > 0)
    .reduce((sum, phase) => {
      const isSourdough = yeastType === 'madre' || yeastType === 'licoli';
      // LM/Licoli in frigo: quasi fermo + LAB acidificano → inibiscono lievito → k negativo → serve più starter
      const effectiveK = (isSourdough && phase.k === 0.2) ? -0.1 : phase.k;
      return sum + phase.hours * q10Factor(phase.temperatureCelsius) * effectiveK;
    }, 0);
}

export function phaseFermentation(phase: FermentationPhase, yeastType?: YeastType): number {
  const isSourdough = yeastType === 'madre' || yeastType === 'licoli';
  const effectiveK = (isSourdough && phase.k === 0.2) ? -0.1 : phase.k;
  return phase.hours * q10Factor(phase.temperatureCelsius) * effectiveK;
}

/**
 * Da fermentazione cumulativa F → percentuale lievito/starter sul peso FARINA TOTALE.
 * Relazione inversa: più lunga la fermentazione, meno lievito serve.
 * BASE_DOSE = 1.0% lievito fresco per F=1
 *
 * Madre (50% idratazione): fattore 80 → ~19% per fermentazione standard
 * Licoli (100% idratazione): fattore 107 → ~25% per fermentazione standard
 *   (rapporto 107/80 ≈ 1.333 = 2/1.5 = idratazione netta per grammo)
 */
export function yeastPercentFromFermentation(
  cumulativeF: number,
  yeastType: YeastType
): number {
  const YEAST_FACTORS: Record<YeastType, number> = {
    fresh: 1.0,
    instant_dry: 0.33,   // IDY è ~3× più potente del fresco
    madre: 80.0,          // lievito madre 50%: tipicamente 15-25% sulla farina
    licoli: 107.0,        // Li.Co.Li 100%: ~1.33× madre (meno concentrato)
  };

  const CLAMP: Record<YeastType, [number, number]> = {
    fresh: [0.04, 3.0],
    instant_dry: [0.015, 1.0],
    madre: [3.0, 50.0],   // min 3%: fermentazioni molto lunghe (48h+)
    licoli: [4.0, 65.0],  // min 4%: proporzionale a 3% × 1.333
  };

  const BASE_DOSE = 1.0;
  const raw = BASE_DOSE / Math.max(cumulativeF, 0.1);
  const adjusted = raw * YEAST_FACTORS[yeastType];
  const [min, max] = CLAMP[yeastType];
  return Math.min(Math.max(adjusted, min), max);
}

export interface YeastCalculation {
  yeastPercent: number;
  yeastCalcF: number;
  cumulativeF: number;
  effectiveYeastType: YeastType;
  prefermentiPhase: FermentationPhase | null;
}

export function calculateYeastForPhases(
  phases: FermentationPhase[],
  yeastType: YeastType
): YeastCalculation {
  const activePhases = phases.filter(p => p.active && p.hours > 0);
  const prefermentiPhase = activePhases.find(
    p => (p.id === 'biga' || p.id === 'poolish') && p.flourPercent != null
  ) ?? null;
  const cumulativeF = cumulativeFermentation(activePhases, yeastType);
  const effectiveYeastType: YeastType = prefermentiPhase?.id === 'biga' ? 'fresh' : yeastType;

  if (!prefermentiPhase) {
    return {
      yeastPercent: yeastPercentFromFermentation(cumulativeF, effectiveYeastType),
      yeastCalcF: cumulativeF,
      cumulativeF,
      effectiveYeastType,
      prefermentiPhase,
    };
  }

  const flourPct = (prefermentiPhase.flourPercent ?? (prefermentiPhase.id === 'poolish' ? 30 : 40)) / 100;
  const prefermentF = phaseFermentation(prefermentiPhase, effectiveYeastType);
  const F_BIGA_REF = 18 * q10Factor(18);
  const F_POOLISH_REF = 12 * q10Factor(20);

  let yeastCalcF: number;
  if (prefermentiPhase.id === 'biga') {
    const prefIndex = activePhases.findIndex(p => p.id === prefermentiPhase.id);
    const warmPostBigaF = activePhases
      .slice(prefIndex + 1)
      .filter(phase => phase.id !== 'frigo')
      .reduce((sum, phase) => sum + phaseFermentation(phase, 'fresh'), 0);
    const postFridgeHours = activePhases
      .slice(prefIndex + 1)
      .filter(phase => phase.id === 'frigo')
      .reduce((sum, phase) => sum + phase.hours, 0);
    const baseBigaF = prefermentF / (F_BIGA_REF * flourPct);
    const warmContribution = Math.max(0, warmPostBigaF - 2.5) * 0.6;
    const coldPenalty = Math.min(postFridgeHours * 0.025, 0.9);
    const postContribution = Math.max(0, warmContribution - coldPenalty);
    yeastCalcF = baseBigaF + postContribution;
  } else {
    yeastCalcF = prefermentF / (F_POOLISH_REF * flourPct * 0.3);
  }

  return {
    yeastPercent: yeastPercentFromFermentation(yeastCalcF, effectiveYeastType),
    yeastCalcF,
    cumulativeF,
    effectiveYeastType,
    prefermentiPhase,
  };
}

/** Etichetta leggibile per il tipo di lievito */
export function yeastTypeLabel(type: YeastType): string {
  switch (type) {
    case 'fresh':       return 'Lievito di birra fresco';
    case 'instant_dry': return 'Lievito secco istantaneo (IDY)';
    case 'madre':       return 'Lievito madre (idro 50%)';
    case 'licoli':      return 'Li.Co.Li (idro 100%)';
  }
}
