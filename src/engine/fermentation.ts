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
 *   frigo LM:        k = 1.5 (i batteri lattici continuano ad acidificare → maturazione rapida)
 *   appretto:        k = 0.6
 *
 * Effetto pratico sul lievito madre:
 *   senza frigo (2h+4h): F≈4.1 → ~15% LM
 *   16h frigo:           F≈10  → ~6%  LM  (differenza reale ✓)
 */
export function cumulativeFermentation(phases: FermentationPhase[], yeastType?: YeastType): number {
  return phases
    .filter(p => p.active && p.hours > 0)
    .reduce((sum, phase) => {
      // Lievito madre in frigo: acidificazione LAB continua → k molto più alto del lievito di birra
      const effectiveK = (yeastType === 'sourdough' && phase.k === 0.2) ? 1.5 : phase.k;
      return sum + phase.hours * q10Factor(phase.temperatureCelsius) * effectiveK;
    }, 0);
}

/**
 * Da fermentazione cumulativa F → percentuale lievito sul peso farina.
 * Relazione inversa: più lunga la fermentazione, meno lievito serve.
 * BASE_DOSE = 1.0% lievito fresco per F=1
 */
export function yeastPercentFromFermentation(
  cumulativeF: number,
  yeastType: YeastType
): number {
  const YEAST_FACTORS: Record<YeastType, number> = {
    fresh: 1.0,
    instant_dry: 0.33,  // IDY è ~3× più potente del fresco
    sourdough: 60.0,    // lievito madre: tipicamente 10-25% sulla farina
  };

  const CLAMP: Record<YeastType, [number, number]> = {
    fresh: [0.04, 3.0],
    instant_dry: [0.015, 1.0],
    sourdough: [5.0, 50.0],  // min 5% anche per lunghe maturazioni
  };

  const BASE_DOSE = 1.0;
  const raw = BASE_DOSE / Math.max(cumulativeF, 0.1);
  const adjusted = raw * YEAST_FACTORS[yeastType];
  const [min, max] = CLAMP[yeastType];
  return Math.min(Math.max(adjusted, min), max);
}

/** Etichetta leggibile per il tipo di lievito */
export function yeastTypeLabel(type: YeastType): string {
  switch (type) {
    case 'fresh':       return 'Lievito di birra fresco';
    case 'instant_dry': return 'Lievito secco istantaneo (IDY)';
    case 'sourdough':   return 'Lievito madre / Li.Co.Li';
  }
}
