import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';
import type { YeastType } from '../../types/dough';
import { Icon } from '../ui/Icon';

const MAIN_OPTIONS: { id: YeastType; label: string; sublabel: string; icon: string }[] = [
  { id: 'fresh',       label: 'Fresco',   sublabel: 'Cubetto 25g',      icon: 'science' },
  { id: 'instant_dry', label: 'Secco',    sublabel: 'IDY (es. Caputo)', icon: 'grain' },
  { id: 'madre',       label: 'Naturale', sublabel: 'Madre / Li.Co.Li', icon: 'auto_fix_high' },
];

export function YeastSelector() {
  const yeastType = useDoughStore(s => s.state.yeastType);
  const setYeastType = useDoughStore(s => s.setYeastType);

  const isSourdough = yeastType === 'madre' || yeastType === 'licoli';

  return (
    <SectionCard title="Tipo di lievito">
      <div className="grid grid-cols-3 gap-2">
        {MAIN_OPTIONS.map(opt => {
          const isActive = opt.id === 'madre' ? isSourdough : yeastType === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                if (opt.id === 'madre') {
                  if (!isSourdough) setYeastType('madre');
                  // se già sourdough, il sub-toggle gestisce la variante specifica
                } else {
                  setYeastType(opt.id);
                }
              }}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-center transition-all ${
                isActive
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              <Icon name={opt.icon} className="text-2xl" />
              <span className="text-xs font-semibold leading-tight">{opt.label}</span>
              <span className="text-xs opacity-60 leading-tight">{opt.sublabel}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-toggle Madre / Li.Co.Li — visibile solo quando lievito naturale attivo */}
      {isSourdough && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setYeastType('madre')}
            className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
              yeastType === 'madre'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300'
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <Icon name="jar" className="text-base" />
              Madre · idro 50%
            </span>
          </button>
          <button
            onClick={() => setYeastType('licoli')}
            className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
              yeastType === 'licoli'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300'
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <Icon name="water_drop" className="text-base" />
              Li.Co.Li · idro 100%
            </span>
          </button>
        </div>
      )}
    </SectionCard>
  );
}
