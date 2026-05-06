import { useDoughStore } from '../../store/useDoughStore';
import type { DoughMode } from '../../types/dough';
import { Icon } from '../ui/Icon';

const MODES: { id: DoughMode; label: string; icon: string; desc: string }[] = [
  { id: 'napoletana', label: 'Verace', icon: 'local_pizza', desc: 'Disciplinare AVPN' },
  { id: 'teglia',     label: 'Teglia', icon: 'outdoor_grill', desc: 'Stile Bonci' },
  { id: 'pane',       label: 'Pane', icon: 'bakery_dining', desc: 'Lievitazione lunga' },
];

export function ModeTab() {
  const mode = useDoughStore(s => s.state.mode);
  const resetToMode = useDoughStore(s => s.resetToMode);

  return (
    <div className="flex w-full gap-1 p-1 bg-[#E0D5B6]/60 dark:bg-[#0A1228] rounded-xl">
      {MODES.map(m => (
        <button
          key={m.id}
          onClick={() => resetToMode(m.id)}
          className={`flex-1 flex flex-col items-center py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            mode === m.id
              ? 'bg-white dark:bg-[#1C2548] text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-[#616B8F] dark:text-[#A19677] hover:bg-white/40 dark:hover:bg-[#1C2548]/50'
          }`}
        >
          <Icon name={m.icon} className="text-[20px]" />
          <span className="font-semibold">{m.label}</span>
          <span className="text-xs opacity-70 hidden sm:block">{m.desc}</span>
        </button>
      ))}
    </div>
  );
}
