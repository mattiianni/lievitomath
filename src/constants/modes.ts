import type { DoughMode, FermentationPhase, DoughState } from '../types/dough';

interface HydrationRange {
  too_low: number;         // sotto questo → rosso basso
  low: number;             // tra too_low e low → arancio basso
  // tra low e too_high_start → verde
  too_high_start: number;  // sopra questo → arancio alto
  too_high: number;        // sopra questo → rosso alto
}

export const HYDRATION_RANGES: Record<DoughMode, HydrationRange> = {
  napoletana: { too_low: 58, low: 62, too_high_start: 66, too_high: 72 },
  teglia:     { too_low: 68, low: 75, too_high_start: 80, too_high: 85 },
  pane:       { too_low: 58, low: 65, too_high_start: 75, too_high: 82 },
};

const PREFERMENTO_PHASES: FermentationPhase[] = [
  { id: 'biga',    label: 'Biga',    hours: 18, temperatureCelsius: 18, k: 1.0, active: false, flourPercent: 40, hydrationPercent: 44 },
  { id: 'poolish', label: 'Poolish', hours: 12, temperatureCelsius: 20, k: 1.0, active: false, flourPercent: 30, hydrationPercent: 100 },
];

const DEFAULT_PHASES: Record<DoughMode, FermentationPhase[]> = {
  napoletana: [
    ...PREFERMENTO_PHASES,
    { id: 'autolisi', label: 'Autolisi (riposo)',  hours: 0.5, temperatureCelsius: 20, k: 0.0, active: false },
    { id: 'puntata',  label: 'Puntata',            hours: 2,   temperatureCelsius: 24, k: 1.0, active: true,  locked: true },
    { id: 'frigo',    label: 'Frigo',              hours: 16,  temperatureCelsius: 4,  k: 0.2, active: true },
    { id: 'appretto', label: 'Appretto',           hours: 4,   temperatureCelsius: 22, k: 0.6, active: true,  locked: true },
  ],
  teglia: [
    ...PREFERMENTO_PHASES,
    { id: 'autolisi', label: 'Autolisi (riposo)',  hours: 0.5, temperatureCelsius: 20, k: 0.0, active: false },
    { id: 'puntata',  label: 'Puntata',            hours: 1,   temperatureCelsius: 24, k: 1.0, active: true, locked: true },
    { id: 'frigo',    label: 'Frigo',              hours: 24,  temperatureCelsius: 4,  k: 0.2, active: true },
    { id: 'appretto', label: 'Appretto',            hours: 3,   temperatureCelsius: 22, k: 0.6, active: true, locked: true },
  ],
  pane: [
    ...PREFERMENTO_PHASES,
    { id: 'autolisi', label: 'Autolisi (riposo)',  hours: 1,   temperatureCelsius: 20, k: 0.0, active: false },
    { id: 'puntata',  label: 'Bulk (puntata)',     hours: 4,   temperatureCelsius: 26, k: 1.0, active: true, locked: true },
    { id: 'frigo',    label: 'Frigo',              hours: 12,  temperatureCelsius: 4,  k: 0.2, active: true },
    { id: 'appretto', label: 'Appretto',           hours: 2,   temperatureCelsius: 24, k: 0.6, active: true, locked: true },
  ],
};

export { PREFERMENTO_PHASES };

const DEFAULT_VALUES: Record<DoughMode, Partial<DoughState>> = {
  napoletana: { hydration: 65, salt: 2.8, oil: 0,   pieces: 4, weightPerPiece: 270 },
  teglia:     { hydration: 78, salt: 2.5, oil: 3,   pieces: 2, weightPerPiece: 660 },
  pane:       { hydration: 70, salt: 2.2, oil: 0,   pieces: 1, weightPerPiece: 800 },
};

export function getDefaultState(mode: DoughMode): DoughState {
  return {
    mode,
    ...DEFAULT_VALUES[mode],
    yeastType: 'fresh',
    flours: [
      { id: crypto.randomUUID(), brand: 'Caputo', name: 'Pizzeria (Blu)', w: 260, percentage: 100 },
    ],
    phases: DEFAULT_PHASES[mode].map(p => ({ ...p })),
  } as DoughState;
}
