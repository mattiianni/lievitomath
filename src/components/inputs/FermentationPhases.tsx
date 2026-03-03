import { useState } from 'react';
import { useDoughStore } from '../../store/useDoughStore';
import { useCalculation } from '../../hooks/useCalculation';
import { q10Factor } from '../../engine/fermentation';
import { SectionCard } from '../ui/SectionCard';

const PHASE_COLORS: Record<string, string> = {
  biga:     'bg-orange-100 dark:bg-orange-900/30 text-orange-700  dark:text-orange-300',
  poolish:  'bg-purple-100 dark:bg-purple-900/30 text-purple-700  dark:text-purple-300',
  puntata:  'bg-teal-100   dark:bg-teal-900/30   text-teal-700    dark:text-teal-300',
  autolisi: 'bg-sky-100    dark:bg-sky-900/30    text-sky-700     dark:text-sky-300',
  frigo:    'bg-blue-100   dark:bg-blue-900/30   text-blue-700    dark:text-blue-300',
  appretto: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  riposo:   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
};

const PHASE_ICONS: Record<string, string> = {
  biga:     '🍞',
  poolish:  '💧',
  autolisi: '⏸',
};

function phaseColor(id: string) {
  return PHASE_COLORS[id] ?? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
}

const PREFERMENTI = ['biga', 'poolish'];

export function FermentationPhases() {
  const phases = useDoughStore(s => s.state.phases);
  const mode = useDoughStore(s => s.state.mode);
  const staglioImmediato = useDoughStore(s => s.state.staglioImmediato ?? false);
  const updatePhase = useDoughStore(s => s.updatePhase);
  const togglePhase = useDoughStore(s => s.togglePhase);
  const setStaglioImmediato = useDoughStore(s => s.setStaglioImmediato);
  const result = useCalculation();

  // AUTO switch state (biga/poolish): calcola ore reali a T ambiente
  const [autoAmbientTemp, setAutoAmbientTemp] = useState<Record<string, number>>({
    biga: 20, poolish: 20,
  });

  // Per teglia con staglioImmediato: frigo disattivato, appretto label → "Riposo fuori frigo"
  const effectivePhases = (mode === 'teglia' && staglioImmediato)
    ? phases.map(p => {
        if (p.id === 'frigo')    return { ...p, active: false };
        if (p.id === 'appretto') return { ...p, label: 'Riposo fuori frigo' };
        return p;
      })
    : phases;

  return (
    <SectionCard title="Fasi di fermentazione">
      <div className="flex flex-col gap-3">

        {/* Toggle Staglio Immediato — solo teglia */}
        {mode === 'teglia' && (
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800/50">
            <div>
              <span className="text-sm font-semibold">Staglio immediato</span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                {staglioImmediato
                  ? 'Staglio subito dopo puntata — no frigo, riposo diretto'
                  : 'Staglio dopo frigo — puntata → frigo → appretto (standard)'}
              </span>
            </div>
            <button
              onClick={() => setStaglioImmediato(!staglioImmediato)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                staglioImmediato ? 'bg-teal-500' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                staglioImmediato ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        )}

        {effectivePhases.map((phase, idx) => {
          const isPrefermento = PREFERMENTI.includes(phase.id);
          // Per teglia con staglioImmediato, il frigo è disattivato e non modificabile
          const isLockedByStaglio = mode === 'teglia' && staglioImmediato && phase.id === 'frigo';

          return (
            <div key={phase.id}>
              {/* Freccia tra fasi (non prima della prima) */}
              {idx > 0 && (
                <div className="flex justify-center my-1 text-neutral-300 dark:text-neutral-600 text-xs">↓</div>
              )}

              <div className={`rounded-xl p-3 border transition-all ${
                phase.active
                  ? 'border-transparent ' + phaseColor(phase.id)
                  : 'border-neutral-200 dark:border-neutral-700 opacity-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {PHASE_ICONS[phase.id] && (
                      <span className="text-sm">{PHASE_ICONS[phase.id]}</span>
                    )}
                    <span className="font-semibold text-sm">{phase.label}</span>
                    {phase.k === 0.2 && <span className="text-xs opacity-70">❄️ frigo</span>}
                    {phase.k === 0.0 && !PHASE_ICONS[phase.id] && <span className="text-xs opacity-70">⏸ riposo</span>}
                    {isLockedByStaglio && <span className="text-xs opacity-50 italic">(disattivato)</span>}
                  </div>
                  {!phase.locked && !isLockedByStaglio && (
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${
                        phase.active
                          ? 'border-current opacity-70 hover:opacity-100'
                          : 'border-neutral-400 text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      {phase.active ? 'ON' : 'OFF'}
                    </button>
                  )}
                </div>

                {phase.active && (
                  <>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-medium opacity-80 mb-1 block">Ore</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={phase.k === 0 ? 0 : 0.5}
                            max={phase.id === 'frigo' ? 72 : isPrefermento ? 48 : 24}
                            step={0.5}
                            value={phase.hours}
                            onChange={e => updatePhase(phase.id, { hours: parseFloat(e.target.value) })}
                            className="flex-1 h-1.5 rounded appearance-none cursor-pointer accent-current"
                          />
                          <span className="text-sm font-bold w-10 text-right">{phase.hours}h</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium opacity-80 mb-1 block">Temperatura ricetta</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={phase.id === 'frigo' ? 2 : 14}
                            max={phase.id === 'frigo' ? 10 : 32}
                            step={1}
                            value={phase.temperatureCelsius}
                            onChange={e => updatePhase(phase.id, { temperatureCelsius: parseFloat(e.target.value) })}
                            className="flex-1 h-1.5 rounded appearance-none cursor-pointer accent-current"
                          />
                          <span className="text-sm font-bold w-10 text-right">{phase.temperatureCelsius}°C</span>
                        </div>
                      </div>
                      {isPrefermento && (
                        <>
                          <div>
                            <label className="text-xs font-medium opacity-80 mb-1 block">% farina nel blend</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={20}
                                max={phase.id === 'poolish' ? 40 : 70}
                                step={5}
                                value={phase.flourPercent ?? (phase.id === 'poolish' ? 30 : 40)}
                                onChange={e => updatePhase(phase.id, { flourPercent: parseInt(e.target.value) })}
                                className="flex-1 h-1.5 rounded appearance-none cursor-pointer accent-current"
                              />
                              <span className="text-sm font-bold w-10 text-right">{phase.flourPercent ?? (phase.id === 'poolish' ? 30 : 40)}%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium opacity-80 mb-1 block">Idratazione</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={phase.id === 'poolish' ? 80 : 40}
                                max={phase.id === 'poolish' ? 100 : 60}
                                step={phase.id === 'poolish' ? 5 : 2}
                                value={phase.hydrationPercent ?? (phase.id === 'poolish' ? 100 : 44)}
                                onChange={e => updatePhase(phase.id, { hydrationPercent: parseInt(e.target.value) })}
                                className="flex-1 h-1.5 rounded appearance-none cursor-pointer accent-current"
                              />
                              <span className="text-sm font-bold w-10 text-right">{phase.hydrationPercent ?? (phase.id === 'poolish' ? 100 : 44)}%</span>
                            </div>
                          </div>

                          {/* AUTO: conversione ore a temperatura ambiente */}
                          <div className="mt-1 rounded-lg bg-current/5 border border-current/10 px-3 py-2">
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-xs font-bold opacity-80">⏱ Auto — T ambiente</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={14} max={30} step={1}
                                value={autoAmbientTemp[phase.id] ?? 20}
                                onChange={e => setAutoAmbientTemp(prev => ({ ...prev, [phase.id]: parseInt(e.target.value) }))}
                                className="flex-1 h-1.5 rounded appearance-none cursor-pointer accent-current"
                              />
                              <span className="text-sm font-bold w-10 text-right">{autoAmbientTemp[phase.id] ?? 20}°C</span>
                            </div>
                            <div className="mt-1.5 text-xs opacity-75">
                              {(() => {
                                const tAmb = autoAmbientTemp[phase.id] ?? 20;
                                const fTarget = phase.hours * q10Factor(phase.temperatureCelsius) * phase.k;
                                const hoursReal = fTarget / q10Factor(tAmb);
                                const h = Math.floor(hoursReal);
                                const m = Math.round((hoursReal - h) * 60);
                                return `A ${tAmb}°C → circa ${h > 0 ? h + 'h' : ''}${m > 0 ? ' ' + m + 'min' : ''} reali`;
                              })()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Preview grammi biga/poolish */}
                    {isPrefermento && result?.prefermentiSplit && (
                      <div className="mt-2 pt-2 border-t border-current/20 text-xs opacity-80">
                        {phase.id === 'biga' ? '🍞' : '💧'}{' '}
                        <strong>{result.prefermentiSplit.prefermento.flour}g</strong> farina +{' '}
                        <strong>{result.prefermentiSplit.prefermento.water}g</strong> acqua
                        {' '}(idro {result.prefermentiSplit.prefermento.hydration}%)
                        {' '}— {phase.hours}h prima
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
