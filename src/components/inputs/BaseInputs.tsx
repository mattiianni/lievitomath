import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';
import { Slider } from '../ui/Slider';
import type { DoughMode } from '../../types/dough';

interface ModeConfig {
  pieces: string;
  weight: { label: string; min: number; max: number; hint: string };
  hydration: { min: number; max: number; step: number; typical: string };
  salt: { min: number; max: number; typical: string };
  oil: { min: number; max: number; typical: string } | null;
}

const MODE_CONFIG: Record<DoughMode, ModeConfig> = {
  napoletana: {
    pieces: 'Numero di palline',
    weight: { label: 'Peso', min: 230, max: 320, hint: '260-270g tipico' },
    hydration: { min: 55, max: 80, step: 0.5, typical: '65% tipico' },
    salt: { min: 1.5, max: 4, typical: '2.8% tipico' },
    oil:  { min: 0, max: 5, typical: '0% tipico' },
  },
  teglia: {
    pieces: 'Numero di panetti',
    weight: { label: 'Peso', min: 480, max: 750, hint: '660g tipico' },
    hydration: { min: 65, max: 90, step: 0.5, typical: '78% tipico' },
    salt: { min: 1.5, max: 3.5, typical: '2.5% tipico' },
    oil:  { min: 0, max: 8, typical: '3% tipico' },
  },
  pane: {
    pieces: 'Numero di pagnotte',
    weight: { label: 'Peso', min: 500, max: 1200, hint: '800g tipico' },
    hydration: { min: 55, max: 85, step: 1, typical: '70% tipico' },
    salt: { min: 1, max: 3, typical: '2.2% tipico' },
    oil: null,
  },
};

export function BaseInputs() {
  const s = useDoughStore(st => st.state);
  const store = useDoughStore();
  const cfg = MODE_CONFIG[s.mode];

  const Stepper = ({
    value,
    onChange,
    min,
    max,
    valueLabel,
  }: {
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    valueLabel: string;
  }) => {
    const dec = () => onChange(Math.max(min, value - 1));
    const inc = () => onChange(Math.min(max, value + 1));

    const btnCls =
      'h-8 w-8 rounded-lg bg-neutral-100 dark:bg-[#0A1228] ' +
      'text-neutral-700 dark:text-neutral-200 text-base font-bold leading-none ' +
      'flex items-center justify-center active:scale-95 transition-transform select-none touch-manipulation';

    return (
      <div className="flex flex-nowrap items-center gap-2">
        <button type="button" onClick={dec} className={btnCls} aria-label={`Diminuisci ${valueLabel}`}>
          −
        </button>
        <div className="w-16 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-[#142044] flex items-center justify-center">
          <span className="text-[18px] font-bold tabular-nums text-brand-600 dark:text-brand-400 leading-none">
            {value}
          </span>
        </div>
        <button type="button" onClick={inc} className={btnCls} aria-label={`Aumenta ${valueLabel}`}>
          +
        </button>
      </div>
    );
  };

  return (
    <SectionCard title="Impasto">
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {cfg.pieces}
          </label>
          <Stepper value={s.pieces} onChange={store.setPieces} min={1} max={50} valueLabel="numero di palline" />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {cfg.weight.label}
          </label>
          <div className="text-xs text-neutral-400 dark:text-neutral-500 -mt-1">
            {cfg.weight.hint}
          </div>
          <Stepper
            value={s.weightPerPiece}
            onChange={store.setWeightPerPiece}
            min={cfg.weight.min}
            max={cfg.weight.max}
            valueLabel="peso"
          />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Slider
          label="Idratazione"
          value={s.hydration}
          onChange={store.setHydration}
          min={cfg.hydration.min}
          max={cfg.hydration.max}
          step={cfg.hydration.step}
          unit="%"
          typical={cfg.hydration.typical}
        />
        <Slider
          label="Sale"
          value={s.salt}
          onChange={store.setSalt}
          min={cfg.salt.min}
          max={cfg.salt.max}
          step={0.1}
          unit="%"
          displayValue={s.salt.toFixed(1)}
          typical={cfg.salt.typical}
        />
        {cfg.oil && (
          <Slider
            label="Olio EVO"
            value={s.oil}
            onChange={store.setOil}
            min={cfg.oil.min}
            max={cfg.oil.max}
            step={0.5}
            unit="%"
            typical={cfg.oil.typical}
          />
        )}
      </div>
    </SectionCard>
  );
}
