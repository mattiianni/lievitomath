import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';
import type { YeastType } from '../../types/dough';

const YEAST_OPTIONS: { id: YeastType; label: string; sublabel: string; emoji: string }[] = [
  { id: 'fresh',       label: 'Fresco',              sublabel: 'Cubetto 25g',         emoji: '🟡' },
  { id: 'instant_dry', label: 'Secco istantaneo',    sublabel: 'IDY (es. Caputo)',     emoji: '🟤' },
  { id: 'sourdough',   label: 'Lievito madre',       sublabel: '/ Li.Co.Li',           emoji: '🍶' },
];

export function YeastSelector() {
  const yeastType = useDoughStore(s => s.state.yeastType);
  const setYeastType = useDoughStore(s => s.setYeastType);

  return (
    <SectionCard title="Tipo di lievito">
      <div className="grid grid-cols-3 gap-2">
        {YEAST_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setYeastType(opt.id)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-center transition-all ${
              yeastType === opt.id
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="text-xs font-semibold leading-tight">{opt.label}</span>
            <span className="text-xs opacity-60 leading-tight">{opt.sublabel}</span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
