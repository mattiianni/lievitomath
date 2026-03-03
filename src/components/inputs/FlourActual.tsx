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

const validFlours = KNOWN_FLOURS.filter(f => f.w > 0);
const defaultKey = `${validFlours[0].brand}||${validFlours[0].name}`;

function keyToFlour(key: string): KnownFlour | undefined {
  return validFlours.find(f => `${f.brand}||${f.name}` === key);
}

/**
 * Calcola le percentuali ottimali per un blend di N farine per raggiungere targetW.
 * Usa interpolazione lineare sulla coppia che "braccia" il target.
 * Le farine extra (non usate) restano a 0%.
 */
function computeOptimalBlend(flours: KnownFlour[], targetW: number): number[] {
  if (flours.length === 0) return [];
  if (flours.length === 1) return [100];

  const sorted = flours.map((f, i) => ({ w: f.w, i })).sort((a, b) => a.w - b.w);
  const pct = new Array(flours.length).fill(0);

  // Target sotto il minimo: 100% farina più debole
  if (targetW <= sorted[0].w) {
    pct[sorted[0].i] = 100;
    return pct;
  }
  // Target sopra il massimo: 100% farina più forte
  if (targetW >= sorted[sorted.length - 1].w) {
    pct[sorted[sorted.length - 1].i] = 100;
    return pct;
  }

  // Trova la coppia che bracketta il target
  let lo = sorted[0];
  let hi = sorted[sorted.length - 1];
  for (let k = 0; k < sorted.length - 1; k++) {
    if (sorted[k].w <= targetW && sorted[k + 1].w >= targetW) {
      lo = sorted[k];
      hi = sorted[k + 1];
      break;
    }
  }

  if (lo.w === hi.w) {
    pct[lo.i] = 100;
    return pct;
  }

  // Interpolazione lineare, arrotonda al 5% più vicino
  const rawLo = ((hi.w - targetW) / (hi.w - lo.w)) * 100;
  const pLo = Math.round(rawLo / 5) * 5;
  pct[lo.i] = pLo;
  pct[hi.i] = 100 - pLo;
  return pct;
}

export function FlourActual() {
  const result = useCalculation();
  const setFlours = useDoughStore(s => s.setFlours);
  const setUserFlourBanner = useDoughStore(s => s.setUserFlourBanner);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([defaultKey]);

  const byBrand = getFloursByBrand();
  const brands = Object.keys(byBrand).filter(b => byBrand[b].some(f => f.w > 0));
  const targetW = result?.wBlend.targetW ?? 0;

  // Calcolo blend ottimale
  const selectedFlours = selectedKeys
    .map(k => keyToFlour(k))
    .filter((f): f is KnownFlour => f !== undefined);
  const blendPercentages = computeOptimalBlend(selectedFlours, targetW);
  const blendW = Math.round(
    selectedFlours.reduce((sum, f, i) => sum + (f.w * blendPercentages[i]) / 100, 0)
  );
  const diagnosis = result ? getFlourDiagnosis(blendW, targetW) : null;
  const diagStyles = diagnosis ? SEVERITY_STYLES[diagnosis.severity] : null;

  function addFlourRow() {
    setSelectedKeys(prev => [...prev, defaultKey]);
  }

  function removeFlourRow(idx: number) {
    if (selectedKeys.length <= 1) return;
    setSelectedKeys(prev => prev.filter((_, i) => i !== idx));
  }

  function updateKey(idx: number, key: string) {
    setSelectedKeys(prev => prev.map((k, i) => i === idx ? key : k));
  }

  function handleApply() {
    if (!result || selectedFlours.length === 0) return;
    const newFlours = selectedFlours
      .map((f, i) => ({ brand: f.brand, name: f.name, w: f.w, percentage: blendPercentages[i] }))
      .filter(f => f.percentage > 0);
    if (newFlours.length === 0) return;
    setFlours(newFlours);
    const label = newFlours.map(f => `${f.brand} ${f.name} ${f.percentage}%`).join(' + ');
    setUserFlourBanner(label);
    setTimeout(() => {
      document.getElementById('ingredients-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

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
          {/* Target W reminder */}
          {result && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Target ricetta: <strong className="text-neutral-700 dark:text-neutral-300">W{targetW}</strong>
              {' '}· inserisci le farine che hai, il blend viene calcolato automaticamente.
            </p>
          )}

          {/* Lista farine — solo selezione, % calcolata */}
          <div className="space-y-2">
            {selectedKeys.map((key, idx) => {
              const flour = keyToFlour(key);
              const pct = blendPercentages[idx] ?? 0;
              return (
                <div key={idx} className="flex items-center gap-2">
                  {/* Dropdown farina */}
                  <select
                    value={key}
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

                  {/* Percentuale calcolata (read-only) */}
                  <span className={`text-sm font-bold w-12 text-right flex-shrink-0 ${
                    pct > 0 ? 'text-neutral-800 dark:text-neutral-100' : 'text-neutral-300 dark:text-neutral-600'
                  }`}>
                    {pct}%
                  </span>

                  {/* W badge */}
                  {flour && (
                    <span className="text-xs text-neutral-400 w-10 text-right flex-shrink-0">W{flour.w}</span>
                  )}

                  {/* Rimuovi */}
                  {selectedKeys.length > 1 && (
                    <button
                      onClick={() => removeFlourRow(idx)}
                      className="text-neutral-300 hover:text-red-400 dark:text-neutral-600 dark:hover:text-red-400 text-lg leading-none flex-shrink-0 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aggiungi + W blend risultante */}
          <div className="flex items-center justify-between">
            <button
              onClick={addFlourRow}
              className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-semibold transition-colors"
            >
              <span className="text-base leading-none">+</span> Aggiungi farina
            </button>
            {selectedFlours.length > 0 && (
              <span className="text-xs text-neutral-400">
                Blend W: <strong className="text-neutral-700 dark:text-neutral-200">{blendW}</strong>
              </span>
            )}
          </div>

          {/* Diagnosi blend */}
          {diagnosis && diagStyles && result && (
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

          {/* Bottone applica */}
          <button
            onClick={handleApply}
            disabled={!result || selectedFlours.length === 0}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            AGGIORNA CALCOLO CON QUESTE FARINE
          </button>
        </div>
      )}
    </SectionCard>
  );
}
