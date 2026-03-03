import { useDoughStore } from '../../store/useDoughStore';
import type { DoughMode } from '../../types/dough';

const MODES: { id: DoughMode; label: string; emoji: string; desc: string }[] = [
  { id: 'napoletana', label: 'Napoletana', emoji: '🍕', desc: 'Disciplinare AVPN' },
  { id: 'teglia',     label: 'Teglia',     emoji: '🫓', desc: 'Stile Bonci' },
  { id: 'pane',       label: 'Pane',       emoji: '🍞', desc: 'Lievitazione lunga' },
];

export function ModeTab() {
  const mode = useDoughStore(s => s.state.mode);
  const resetToMode = useDoughStore(s => s.resetToMode);

  return (
    <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
      {MODES.map(m => (
        <button
          key={m.id}
          onClick={() => resetToMode(m.id)}
          className={`flex-1 flex flex-col items-center py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            mode === m.id
              ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <span className="text-lg">{m.emoji}</span>
          <span className="font-semibold">{m.label}</span>
          <span className="text-xs opacity-70 hidden sm:block">{m.desc}</span>
        </button>
      ))}
    </div>
  );
}
