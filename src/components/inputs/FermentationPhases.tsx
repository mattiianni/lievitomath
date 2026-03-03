import { useDoughStore } from '../../store/useDoughStore';
import { useCalculation } from '../../hooks/useCalculation';
import { SectionCard } from '../ui/SectionCard';

const PHASE_COLORS: Record<string, string> = {
  biga:     'bg-orange-100 dark:bg-orange-900/30 text-orange-700  dark:text-orange-300',
  poolish:  'bg-purple-100 dark:bg-purple-900/30 text-purple-700  dark:text-purple-300',
  puntata:  'bg-amber-100  dark:bg-amber-900/30  text-amber-700   dark:text-amber-300',
  autolisi: 'bg-sky-100    dark:bg-sky-900/30    text-sky-700     dark:text-sky-300',
  frigo:    'bg-blue-100   dark:bg-blue-900/30   text-blue-700    dark:text-blue-300',
  appretto: 'bg-green-100  dark:bg-green-900/30  text-green-700   dark:text-green-300',
  riposo:   'bg-green-100  dark:bg-green-900/30  text-green-700   dark:text-green-300',
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
  const updatePhase = useDoughStore(s => s.updatePhase);
  const togglePhase = useDoughStore(s => s.togglePhase);
  const result = useCalculation();

  return (
    <SectionCard title="Fasi di fermentazione">
      <div className="flex flex-col gap-3">
        {phases.map((phase, idx) => {
          const isPrefermento = PREFERMENTI.includes(phase.id);

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
                  </div>
                  {!phase.locked && (
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
                        <label className="text-xs font-medium opacity-80 mb-1 block">Temperatura</label>
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
                        <div>
                          <label className="text-xs font-medium opacity-80 mb-1 block">% farina</label>
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
