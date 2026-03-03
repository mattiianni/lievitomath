import { useState } from 'react';
import { useCalculation } from '../../hooks/useCalculation';
import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';
import { KNOWN_FLOURS, getFloursByBrand } from '../../data/flours';
import { getFlourDiagnosis } from '../../engine/flour';
import type { KnownFlour } from '../../data/flours';

const SEVERITY_STYLES = {
  ok:       { card: 'bg-green-50  dark:bg-green-900/20  border-green-200  dark:border-green-800',  text: 'text-green-700  dark:text-green-300',  dot: 'bg-green-500'  },
  warn:     { card: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  critical: { card: 'bg-red-50    dark:bg-red-900/20    border-red-200    dark:border-red-800',    text: 'text-red-700    dark:text-red-300',    dot: 'bg-red-500'    },
};

const SEVERITY_LABEL = { ok: 'In target', warn: 'Attenzione', critical: 'Farina troppo debole' };

type FlourEntry = { flourKey: string; percentage: number };

const validFlours = KNOWN_FLOURS.filter(f => f.w > 0);
const defaultKey = `${validFlours[0].brand}||${validFlours[0].name}`;

function keyToFlour(key: string): KnownFlour | undefined {
  return validFlours.find(f => `${f.brand}||${f.name}` === key);
}

export function FlourActual() {
  const result = useCalculation();
  const setFlours = useDoughStore(s => s.setFlours);
  const setUserFlourBanner = useDoughStore(s => s.setUserFlourBanner);

  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<FlourEntry[]>([
    { flourKey: defaultKey, percentage: 100 },
  ]);

  const byBrand = getFloursByBrand();
  const brands = Object.keys(byBrand).filter(b => byBrand[b].some(f => f.w > 0));
  const targetW = result?.wBlend.targetW ?? 0;
  const total = entries.reduce((s, e) => s + e.percentage, 0);
  const isValid = total === 100 && entries.length > 0;

  // Diagnosi: usa media pesata delle farine inserite
  const blendW = entries.reduce((sum, e) => {
    const f = keyToFlour(e.flourKey);
    return f ? sum + (f.w * e.percentage) / 100 : sum;
  }, 0);
  const diagnosis = result && isValid ? getFlourDiagnosis(Math.round(blendW), targetW) : null;
  const diagStyles = diagnosis ? SEVERITY_STYLES[diagnosis.severity] : null;

  function addEntry() {
    setEntries(prev => [...prev, { flourKey: defaultKey, percentage: 0 }]);
  }

  function removeEntry(idx: number) {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter((_, i) => i !== idx));
  }

  function updateKey(idx: number, key: string) {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, flourKey: key } : e));
  }

  function updatePct(idx: number, val: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, percentage: clamped } : e));
  }

  function handleApply() {
    if (!isValid || !result) return;
    const newFlours = entries.map(e => {
      const f = keyToFlour(e.flourKey)!;
      return { brand: f.brand, name: f.name, w: f.w, percentage: e.percentage };
    });
    setFlours(newFlours);
    const blendLabel = newFlours.map(f => `${f.brand} ${f.name} ${f.percentage}%`).join(' + ');
    setUserFlourBanner(blendLabel);
    setTimeout(() => {
      document.getElementById('ingredients-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  const selectEl = (
    <optgroup label="">
      {brands.map(brand => (
        <optgroup key={brand} label={brand}>
          {byBrand[brand]
            .filter(f => f.w > 0)
            .map(f => (
              <option key={`${f.brand}||${f.name}`} value={`${f.brand}||${f.name}`}>
                {f.name} — W{f.w}
              </option>
            ))}
        </optgroup>
      ))}
    </optgroup>
  );
  void selectEl; // unused — built inline below

  return (
    <SectionCard title="Farina attuale">
      {/* Toggle */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border-2 transition-all text-sm font-semibold ${
          isOpen
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
            : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
        }`}
      >
        <span>Analizza le farine che hai in casa</span>
        <span className="text-xs">{isOpen ? '▲ Chiudi' : '▼ Apri'}</span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">

          {/* Lista farine */}
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const flour = keyToFlour(entry.flourKey);
              return (
                <div key={idx} className="flex items-center gap-2">
                  {/* Dropdown farina */}
                  <select
                    value={entry.flourKey}
                    onChange={e => updateKey(idx, e.target.value)}
                    className="flex-1 min-w-0 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {brands.map(brand => (
                      <optgroup key={brand} label={brand}>
                        {byBrand[brand]
                          .filter(f => f.w > 0)
                          .map(f => (
                            <option key={`${f.brand}||${f.name}`} value={`${f.brand}||${f.name}`}>
                              {f.name} — W{f.w}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>

                  {/* % input */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={entry.percentage}
                      onChange={e => updatePct(idx, Number(e.target.value))}
                      className="w-14 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-center font-bold text-neutral-800 dark:text-neutral-200 px-1 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-xs text-neutral-400">%</span>
                  </div>

                  {/* W badge */}
                  {flour && (
                    <span className="text-xs text-neutral-400 w-10 text-right flex-shrink-0">W{flour.w}</span>
                  )}

                  {/* Rimuovi */}
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(idx)}
                      className="text-neutral-300 hover:text-red-400 dark:text-neutral-600 dark:hover:text-red-400 text-lg leading-none flex-shrink-0 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totale + aggiungi */}
          <div className="flex items-center justify-between">
            <button
              onClick={addEntry}
              className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-semibold transition-colors"
            >
              <span className="text-base leading-none">+</span> Aggiungi farina
            </button>
            <span className={`text-xs font-bold ${total === 100 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              Totale: {total}%{total !== 100 && ' ≠ 100'}
            </span>
          </div>

          {/* Diagnosi blend */}
          {diagnosis && diagStyles && isValid && result && (
            <div className={`rounded-xl border p-3 ${diagStyles.card}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${diagStyles.dot}`} />
                <span className={`text-xs font-semibold ${diagStyles.text}`}>
                  {SEVERITY_LABEL[diagnosis.severity]}
                </span>
              </div>
              <p className={`text-xs ${diagStyles.text}`}>{diagnosis.message}</p>
            </div>
          )}

          {!isValid && total !== 100 && entries.length > 0 && (
            <p className="text-xs text-red-500 text-center">Il totale deve essere 100% per aggiornare il calcolo.</p>
          )}

          {/* Bottone applica */}
          <button
            onClick={handleApply}
            disabled={!isValid || !result}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            AGGIORNA CALCOLO CON QUESTE FARINE
          </button>
        </div>
      )}
    </SectionCard>
  );
}
