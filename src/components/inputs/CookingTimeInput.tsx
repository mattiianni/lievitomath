import { useDoughStore } from '../../store/useDoughStore';
import { DAYS } from '../../utils/cookingSchedule';
import { SectionCard } from '../ui/SectionCard';

export function CookingTimeInput() {
  const cookingDay     = useDoughStore(s => s.cookingDay);
  const cookingTime    = useDoughStore(s => s.cookingTime);
  const setCookingDay  = useDoughStore(s => s.setCookingDay);
  const setCookingTime = useDoughStore(s => s.setCookingTime);

  const hh = String(Math.floor(cookingTime / 60)).padStart(2, '0');
  const mm = String(cookingTime % 60).padStart(2, '0');

  const addMinutes = (delta: number) => {
    const newTime = ((cookingTime + delta) % (24 * 60) + 24 * 60) % (24 * 60);
    setCookingTime(newTime);
  };

  return (
    <SectionCard title="A che ora vuoi infornare?">
      {/* Selezione giorno */}
      <div className="flex gap-1.5 flex-wrap justify-center mb-5">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setCookingDay(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              cookingDay === i
                ? 'bg-brand-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300 hover:bg-brand-100 dark:hover:bg-brand-900/30'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Selezione orario */}
      <div className="flex items-center justify-center gap-5">
        <button
          onClick={() => addMinutes(-15)}
          className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xl font-bold flex items-center justify-center active:scale-95 transition-transform select-none"
          aria-label="Riduci orario"
        >
          −
        </button>
        <span className="text-4xl font-bold text-neutral-800 dark:text-neutral-100 tabular-nums w-32 text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {hh}:{mm}
        </span>
        <button
          onClick={() => addMinutes(15)}
          className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xl font-bold flex items-center justify-center active:scale-95 transition-transform select-none"
          aria-label="Aumenta orario"
        >
          +
        </button>
      </div>
    </SectionCard>
  );
}
