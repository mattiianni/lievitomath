interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export function GuidedModeToggle({ enabled, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="flex flex-col items-center gap-1 group"
      aria-label="Attiva Modalità Guidata"
    >
      {/* Label */}
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70 dark:text-white/50 group-hover:text-white/90 dark:group-hover:text-white/70 transition-colors whitespace-nowrap">
        Modalità Guidata
      </span>

      {/* Toggle pill — Apple style */}
      <div
        className={`
          relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out
          ${enabled
            ? 'bg-brand-500 shadow-[0_0_10px_2px_rgba(234,88,12,0.45)]'
            : 'bg-white/25 dark:bg-white/15'
          }
        `}
      >
        {/* Thumb */}
        <span
          className={`
            absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-md
            transition-all duration-300 ease-in-out
            ${enabled ? 'left-[26px]' : 'left-[3px]'}
          `}
        />
      </div>
    </button>
  );
}
