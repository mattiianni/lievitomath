import { useState } from 'react';
import { useCalculation } from '../../hooks/useCalculation';
import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';
import { KNOWN_FLOURS, getFloursByBrand } from '../../data/flours';
import { getFlourDiagnosis } from '../../engine/flour';
import type { KnownFlour } from '../../data/flours';

const SEVERITY_STYLES = {
  ok:       { card: 'bg-green-50  dark:bg-green-900/20  border-green-200  dark:border-green-800',  text: 'text-green-700  dark:text-green-300',  badge: 'bg-green-500'  },
  warn:     { card: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-500' },
  critical: { card: 'bg-red-50    dark:bg-red-900/20    border-red-200    dark:border-red-800',    text: 'text-red-700    dark:text-red-300',    badge: 'bg-red-500'    },
};

export function FlourActual() {
  const result = useCalculation();
  const flours = useDoughStore(s => s.state.flours);
  const updateFlour = useDoughStore(s => s.updateFlour);
  const removeFlour = useDoughStore(s => s.removeFlour);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedFlour, setSelectedFlour] = useState<KnownFlour>(
    KNOWN_FLOURS.filter(f => f.w > 0)[0]
  );

  const validFlours = KNOWN_FLOURS.filter(f => f.w > 0);
  const byBrand = getFloursByBrand();
  const brands = Object.keys(byBrand).filter(b => byBrand[b].some(f => f.w > 0));

  const targetW = result?.wBlend.targetW ?? 0;
  const diagnosis = result ? getFlourDiagnosis(selectedFlour.w, targetW) : null;
  const styles = diagnosis ? SEVERITY_STYLES[diagnosis.severity] : null;

  function handleApply() {
    if (!flours.length) return;
    updateFlour(flours[0].id, {
      brand: selectedFlour.brand,
      name: selectedFlour.name,
      w: selectedFlour.w,
      percentage: 100,
    });
    // rimuovi tutte le farine extra
    for (let i = 1; i < flours.length; i++) {
      removeFlour(flours[i].id);
    }
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const found = validFlours.find(
      f => `${f.brand}||${f.name}` === e.target.value
    );
    if (found) setSelectedFlour(found);
  }

  return (
    <SectionCard title="Farina attuale">
      {/* Toggle ON/OFF */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border-2 transition-all text-sm font-semibold ${
          isOpen
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
            : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
        }`}
      >
        <span>Analizza la farina che hai in casa</span>
        <span className="text-xs">{isOpen ? '▲ Chiudi' : '▼ Apri'}</span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {/* Selettore farina */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Seleziona farina</label>
            <select
              value={`${selectedFlour.brand}||${selectedFlour.name}`}
              onChange={handleSelectChange}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
          </div>

          {/* Diagnosi */}
          {diagnosis && styles && result && (
            <div className={`rounded-xl border p-3 ${styles.card}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.badge}`} />
                <span className={`text-xs font-semibold ${styles.text}`}>
                  {diagnosis.severity === 'ok' ? 'In target' : diagnosis.severity === 'warn' ? 'Attenzione' : 'Farina troppo debole'}
                </span>
              </div>
              <p className={`text-xs ${styles.text}`}>{diagnosis.message}</p>
            </div>
          )}

          {/* Bottone AGGIORNA CALCOLO */}
          <button
            onClick={handleApply}
            disabled={!result}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
          >
            AGGIORNA CALCOLO CON QUESTA FARINA
          </button>

          <p className="text-xs text-neutral-400 text-center">
            Imposta {selectedFlour.brand} {selectedFlour.name} al 100% nel blend
          </p>
        </div>
      )}
    </SectionCard>
  );
}
