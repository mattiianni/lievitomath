import { SliderWithButtons } from './SliderWithButtons';

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  displayValue?: string;
  typical?: string; // es. "64% tipico"
}

export function Slider({ label, value, onChange, min, max, step = 1, unit, displayValue, typical }: SliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
          {typical && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">({typical})</span>
          )}
        </div>
        <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
          {displayValue ?? value}{unit}
        </span>
      </div>
      <SliderWithButtons min={min} max={max} step={step} value={value} onChange={onChange} />
    </div>
  );
}
