import { useState } from 'react';
import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';
import { KNOWN_FLOURS } from '../../data/flours';

export function FlourBlend() {
  const flours = useDoughStore(s => s.state.flours);
  const { addFlour, updateFlour, removeFlour, normalizeFlourPercentages } = useDoughStore();
  const [openAutocomplete, setOpenAutocomplete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const totalPercent = flours.reduce((s, f) => s + f.percentage, 0);
  const isBalanced = Math.abs(totalPercent - 100) <= 1;

  const filteredKnown = KNOWN_FLOURS.filter(kf =>
    `${kf.brand} ${kf.name}`.toLowerCase().includes(search.toLowerCase()) && kf.w > 0
  );

  return (
    <SectionCard title="Blend farine">
      <div className="flex flex-col gap-3">
        {flours.map(flour => (
          <div key={flour.id} className="relative rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 bg-neutral-50 dark:bg-neutral-800/50">
            <div className="flex items-start gap-2">
              {/* Selezione farina */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cerca farina..."
                    value={openAutocomplete === flour.id ? search : `${flour.brand} ${flour.name}`}
                    onFocus={() => { setOpenAutocomplete(flour.id); setSearch(''); }}
                    onChange={e => setSearch(e.target.value)}
                    onBlur={() => setTimeout(() => setOpenAutocomplete(null), 150)}
                    className="w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {openAutocomplete === flour.id && filteredKnown.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg">
                      {filteredKnown.map(kf => (
                        <button
                          key={`${kf.brand}-${kf.name}`}
                          onMouseDown={() => {
                            updateFlour(flour.id, { brand: kf.brand, name: kf.name, w: kf.w });
                            setOpenAutocomplete(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-brand-50 dark:hover:bg-brand-900/20 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                        >
                          <span className="font-medium">{kf.brand} {kf.name}</span>
                          <span className="ml-2 text-neutral-400">W{kf.w}</span>
                          {kf.notes && <span className="ml-1 text-neutral-400">· {kf.notes}</span>}
                        </button>
                      ))}
                      <button
                        onMouseDown={() => {
                          updateFlour(flour.id, { brand: '', name: search, w: 260 });
                          setOpenAutocomplete(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 font-medium"
                      >
                        + Inserisci "{search}" manualmente
                      </button>
                    </div>
                  )}
                </div>
                {/* W manuale */}
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-neutral-500 whitespace-nowrap">W:</label>
                  <input
                    type="number"
                    value={flour.w}
                    min={0}
                    max={500}
                    onChange={e => updateFlour(flour.id, { w: parseInt(e.target.value) || 0 })}
                    className="w-20 text-xs rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-xs text-neutral-400">(modifica se necessario)</span>
                </div>
              </div>

              {/* Percentuale */}
              <div className="flex flex-col items-end gap-1 min-w-[70px]">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={flour.percentage}
                    min={0}
                    max={100}
                    onChange={e => updateFlour(flour.id, { percentage: parseInt(e.target.value) || 0 })}
                    className="w-14 text-sm font-semibold text-right rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-xs text-neutral-400">%</span>
                </div>
                {flours.length > 1 && (
                  <button
                    onClick={() => removeFlour(flour.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    rimuovi
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Footer: totale + bottoni */}
        <div className="flex items-center justify-between mt-1">
          <div className={`text-sm font-semibold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            Totale: {totalPercent}%
            {!isBalanced && ' ⚠️'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={normalizeFlourPercentages}
              className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Auto-bilancia
            </button>
            <button
              onClick={addFlour}
              disabled={flours.length >= 4}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 transition-colors"
            >
              + Farina
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
