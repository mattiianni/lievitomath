import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';
import { NumberInput } from '../ui/NumberInput';
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
    weight: { label: 'Peso per pallina', min: 230, max: 320, hint: '250-300g tipico' },
    hydration: { min: 55, max: 80, step: 0.5, typical: '64% tipico' },
    salt: { min: 1.5, max: 4, typical: '2.8% tipico' },
    oil:  { min: 0, max: 5, typical: '0% tipico' },
  },
  teglia: {
    pieces: 'Numero di panetti',
    weight: { label: 'Peso per panetto', min: 480, max: 750, hint: '600g tipico' },
    hydration: { min: 65, max: 90, step: 0.5, typical: '78% tipico' },
    salt: { min: 1.5, max: 3.5, typical: '2.5% tipico' },
    oil:  { min: 0, max: 8, typical: '3% tipico' },
  },
  pane: {
    pieces: 'Numero di pagnotte',
    weight: { label: 'Peso per pagnotta', min: 500, max: 1200, hint: '800g tipico' },
    hydration: { min: 55, max: 85, step: 1, typical: '70% tipico' },
    salt: { min: 1, max: 3, typical: '2.2% tipico' },
    oil: null,
  },
};

export function BaseInputs() {
  const s = useDoughStore(st => st.state);
  const store = useDoughStore();
  const cfg = MODE_CONFIG[s.mode];

  return (
    <SectionCard title="Impasto">
      <div className="grid grid-cols-2 gap-4 mb-5">
        <NumberInput
          label={cfg.pieces}
          value={s.pieces}
          onChange={store.setPieces}
          min={1}
          max={50}
        />
        <NumberInput
          label={cfg.weight.label}
          value={s.weightPerPiece}
          onChange={store.setWeightPerPiece}
          min={cfg.weight.min}
          max={cfg.weight.max}
          unit="g"
          hint={cfg.weight.hint}
        />
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
