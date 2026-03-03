interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
}

export function NumberInput({ label, value, onChange, min, max, step = 1, unit, hint }: NumberInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
        {hint && <span className="text-xs text-neutral-400">{hint}</span>}
      </div>
      <div className="relative flex items-center">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition pr-10"
        />
        {unit && (
          <span className="absolute right-3 text-xs text-neutral-400 pointer-events-none">{unit}</span>
        )}
      </div>
    </div>
  );
}
