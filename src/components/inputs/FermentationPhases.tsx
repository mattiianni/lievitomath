import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';

const PHASE_COLORS: Record<string, string> = {
  puntata:  'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300',
  autolisi: 'bg-sky-100    dark:bg-sky-900/30    text-sky-700    dark:text-sky-300',
  frigo:    'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300',
  appretto: 'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300',
  riposo:   'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300',
};

function phaseColor(id: string) {
  return PHASE_COLORS[id] ?? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
}

export function FermentationPhases() {
  const phases = useDoughStore(s => s.state.phases);
  const updatePhase = useDoughStore(s => s.updatePhase);
  const togglePhase = useDoughStore(s => s.togglePhase);

  return (
    <SectionCard title="Fasi di fermentazione">
      <div className="flex flex-col gap-3">
        {phases.map((phase, idx) => (
          <div key={phase.id}>
            {/* Freccia tra fasi */}
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
                  <span className="font-semibold text-sm">{phase.label}</span>
                  {phase.k === 0.2 && <span className="text-xs opacity-70">❄️ frigo</span>}
                  {phase.k === 0.0 && <span className="text-xs opacity-70">⏸ riposo</span>}
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-80 mb-1 block">Ore</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={phase.k === 0 ? 0 : 0.5}
                        max={phase.id === 'frigo' ? 72 : 24}
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
                        min={phase.id === 'frigo' ? 2 : 16}
                        max={phase.id === 'frigo' ? 10 : 32}
                        step={1}
                        value={phase.temperatureCelsius}
                        onChange={e => updatePhase(phase.id, { temperatureCelsius: parseFloat(e.target.value) })}
                        className="flex-1 h-1.5 rounded appearance-none cursor-pointer accent-current"
                      />
                      <span className="text-sm font-bold w-10 text-right">{phase.temperatureCelsius}°C</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
