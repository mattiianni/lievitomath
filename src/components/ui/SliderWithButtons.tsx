interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  className?: string;
}

export function SliderWithButtons({ min, max, step, value, onChange, className }: Props) {
  const dec = () => onChange(Math.max(min, parseFloat((value - step).toFixed(10))));
  const inc = () => onChange(Math.min(max, parseFloat((value + step).toFixed(10))));

  const btnCls =
    'flex-shrink-0 w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 ' +
    'text-neutral-700 dark:text-neutral-200 text-lg font-bold leading-none ' +
    'flex items-center justify-center active:scale-95 transition-transform select-none touch-manipulation';

  return (
    <div className="flex items-center gap-2">
      <button onClick={dec} className={btnCls} aria-label="Diminuisci" type="button">−</button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className={`flex-1 ${className ?? ''}`}
      />
      <button onClick={inc} className={btnCls} aria-label="Aumenta" type="button">+</button>
    </div>
  );
}
