import { useState } from 'react';
import { SliderWithButtons } from '../ui/SliderWithButtons';
import { useDoughStore } from '../../store/useDoughStore';
import { useCalculation } from '../../hooks/useCalculation';
import { q10Factor } from '../../engine/fermentation';
import { SectionCard } from '../ui/SectionCard';

// Palette muted/desaturata (fornita utente — "palette scura")
// Swatch (sx→dx): #8B9EC4 #9E9278 #D9C27A #6B7EA4 #6A5535 #252B3C
// Assegnazione semantica: biga=dorato, poolish=ardesia, puntata=siena, autolisi=taupe, frigo=periwinkle, appretto=navy
// Light mode: tinte chiarissime dello stesso hue. Dark mode: colore pieno dalla palette.
const PHASE_COLORS: Record<string, string> = {
  biga:     'bg-[#fdf5dc] dark:bg-[#D9C27A] text-[#4a3010] dark:text-[#3a2800]',
  poolish:  'bg-[#e8edf8] dark:bg-[#6B7EA4] text-[#1a2840] dark:text-[#dce8f8]',
  puntata:  'bg-[#f5ece0] dark:bg-[#6A5535] text-[#3a2010] dark:text-[#f0d8b0]',
  autolisi: 'bg-[#f5f0e8] dark:bg-[#9E9278] text-[#3a3020] dark:text-[#2a2010]',
  frigo:    'bg-[#edf2fa] dark:bg-[#8B9EC4] text-[#1a2840] dark:text-[#0a1428]',
  appretto: 'bg-[#eaecf2] dark:bg-[#252B3C] text-[#1a2030] dark:text-[#a0b0c8]',
};

const PHASE_ICONS: Record<string, string> = {
  biga:     '🍞',
  poolish:  '💧',
  autolisi: '⏸',
  frigo:    '❄️',
};

function phaseColor(id: string) {
  return PHASE_COLORS[id] ?? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300';
}

const PREFERMENTI = ['biga', 'poolish'];

function formatHours(h: number) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (hh > 0 && mm > 0) return `${hh}h ${mm}min`;
  if (hh > 0) return `${hh}h`;
  return `${mm}min`;
}

export function FermentationPhases() {
  const phases = useDoughStore(s => s.state.phases);
  const updatePhase = useDoughStore(s => s.updatePhase);
  const togglePhase = useDoughStore(s => s.togglePhase);
  const yeastType = useDoughStore(s => s.state.yeastType);
  const result = useCalculation();

  const isSourdough = yeastType === 'madre' || yeastType === 'licoli';

  // AUTO switch (per biga/poolish): toggle locale, non persistito
  const [autoEnabled, setAutoEnabled] = useState<Record<string, boolean>>({});
  const [autoAmbientTemp, setAutoAmbientTemp] = useState<Record<string, number>>({ biga: 20, poolish: 20 });

  return (
    <SectionCard title="Fasi di fermentazione">
      <div className="flex flex-col gap-3">

        {phases.map((phase, idx) => {
          const isPrefermento = PREFERMENTI.includes(phase.id);
          const isAutoOn = autoEnabled[phase.id] ?? false;
          const tAmb = autoAmbientTemp[phase.id] ?? 20;
          // Biga disabilitata quando si usa madre/licoli (biga = solo LdB per definizione)
          const isBigaDisabled = phase.id === 'biga' && isSourdough;

          return (
            <div key={phase.id}>
              {idx > 0 && (
                <div className="flex justify-center my-1 text-neutral-300 dark:text-neutral-600 text-xs">↓</div>
              )}

              <div className={`rounded-xl p-3 border transition-all ${
                isBigaDisabled
                  ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/30 opacity-40'
                  : phase.active
                    ? 'border-current/15 ' + phaseColor(phase.id)
                    : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/30 opacity-50'
              }`}>
                {/* Header fase */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {PHASE_ICONS[phase.id] && (
                      <span className="text-sm">{PHASE_ICONS[phase.id]}</span>
                    )}
                    <span className="font-semibold text-sm">{phase.label}</span>
                    {phase.k === 0.0 && !PHASE_ICONS[phase.id] && (
                      <span className="text-xs opacity-60">⏸ riposo</span>
                    )}
                  </div>
                  {!phase.locked && !isBigaDisabled && (
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors flex-shrink-0 ${
                        phase.active
                          ? 'border-current opacity-70 hover:opacity-100'
                          : 'border-neutral-400 text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      {phase.active ? 'ON' : 'OFF'}
                    </button>
                  )}
                </div>

                {/* Nota biga disabilitata */}
                {isBigaDisabled && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                    Richiede lievito di birra fresco — non compatibile con Madre/Li.Co.Li
                  </p>
                )}

                {phase.active && !isBigaDisabled && (
                  <div className="flex flex-col gap-3">

                    {/* Slider Ore — nascosto in AUTO mode per prefermenti */}
                    {(!isPrefermento || !isAutoOn) && (
                      <div>
                        <label className="text-xs font-medium opacity-80 mb-1 block">
                          {isPrefermento ? 'Ore di riferimento' : 'Ore'}
                        </label>
                        <div className="flex items-center gap-2">
                          <SliderWithButtons
                            min={phase.k === 0 ? 0 : 0.5}
                            max={phase.id === 'frigo' ? 72 : isPrefermento ? 48 : 24}
                            step={0.5}
                            value={phase.hours}
                            onChange={v => updatePhase(phase.id, { hours: v })}
                            className="h-1.5 rounded appearance-none cursor-pointer accent-current"
                          />
                          <span className="text-sm font-bold w-10 text-right">{phase.hours}h</span>
                        </div>
                      </div>
                    )}

                    {/* Slider Temperatura — nascosto per prefermenti quando AUTO è ON */}
                    {(!isPrefermento || !isAutoOn) && (
                    <div>
                      <label className="text-xs font-medium opacity-80 mb-1 block">
                        {isPrefermento ? 'Temperatura ricetta' : 'Temperatura'}
                      </label>
                      <div className="flex items-center gap-2">
                        <SliderWithButtons
                          min={phase.id === 'frigo' ? 2 : 14}
                          max={phase.id === 'frigo' ? 10 : 32}
                          step={1}
                          value={phase.temperatureCelsius}
                          onChange={v => updatePhase(phase.id, { temperatureCelsius: v })}
                          className="h-1.5 rounded appearance-none cursor-pointer accent-current"
                        />
                        <span className="text-sm font-bold w-10 text-right">{phase.temperatureCelsius}°C</span>
                      </div>
                    </div>
                    )}

                    {/* Slider extra — solo biga/poolish */}
                    {isPrefermento && (
                      <>
                        <div>
                          <label className="text-xs font-medium opacity-80 mb-1 block">
                            % farina nel blend
                            <span className="opacity-50 font-normal ml-1">({phase.id === 'poolish' ? '30%' : '40%'} tipico)</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <SliderWithButtons
                              min={20}
                              max={phase.id === 'poolish' ? 40 : 70}
                              step={5}
                              value={phase.flourPercent ?? (phase.id === 'poolish' ? 30 : 40)}
                              onChange={v => updatePhase(phase.id, { flourPercent: v })}
                              className="h-1.5 rounded appearance-none cursor-pointer accent-current"
                            />
                            <span className="text-sm font-bold w-10 text-right">
                              {phase.flourPercent ?? (phase.id === 'poolish' ? 30 : 40)}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium opacity-80 mb-1 block">
                            Idratazione
                            <span className="opacity-50 font-normal ml-1">({phase.id === 'poolish' ? '100%' : '44%'} tipico)</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <SliderWithButtons
                              min={phase.id === 'poolish' ? 80 : 40}
                              max={phase.id === 'poolish' ? 100 : 60}
                              step={phase.id === 'poolish' ? 5 : 2}
                              value={phase.hydrationPercent ?? (phase.id === 'poolish' ? 100 : 44)}
                              onChange={v => updatePhase(phase.id, { hydrationPercent: v })}
                              className="h-1.5 rounded appearance-none cursor-pointer accent-current"
                            />
                            <span className="text-sm font-bold w-10 text-right">
                              {phase.hydrationPercent ?? (phase.id === 'poolish' ? 100 : 44)}%
                            </span>
                          </div>
                        </div>

                        {/* ── Toggle AUTO ── */}
                        <div className="rounded-lg border border-current/20 bg-current/5 overflow-hidden">
                          {/* Pulsante toggle */}
                          <button
                            onClick={() => setAutoEnabled(prev => ({ ...prev, [phase.id]: !isAutoOn }))}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-current/5 transition-colors"
                          >
                            <span className="text-xs font-bold opacity-80">⏱ Calcola tempo reale</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                              isAutoOn
                                ? 'border-current bg-current/20'
                                : 'border-current/30 opacity-50'
                            }`}>
                              {isAutoOn ? 'AUTO ON' : 'AUTO OFF'}
                            </span>
                          </button>

                          {/* Contenuto AUTO — visibile solo se ON */}
                          {isAutoOn && (
                            <div className="px-3 pb-3 pt-1 border-t border-current/15">
                              <div className="text-xs opacity-60 mb-2">
                                Riferimento: {phase.hours}h @{phase.temperatureCelsius}°C
                                {' '}→ F={( phase.hours * q10Factor(phase.temperatureCelsius) * phase.k).toFixed(2)}
                              </div>
                              <label className="text-xs font-medium opacity-80 mb-1 block">T ambiente</label>
                              <div className="flex items-center gap-2 mb-2">
                                <SliderWithButtons
                                  min={14} max={30} step={1}
                                  value={tAmb}
                                  onChange={v => setAutoAmbientTemp(prev => ({ ...prev, [phase.id]: v }))}
                                  className="h-1.5 rounded appearance-none cursor-pointer accent-current"
                                />
                                <span className="text-sm font-bold w-10 text-right">{tAmb}°C</span>
                              </div>
                              <div className="text-sm font-bold">
                                {(() => {
                                  const fTarget = phase.hours * q10Factor(phase.temperatureCelsius) * phase.k;
                                  const hoursReal = fTarget / q10Factor(tAmb);
                                  return `→ ${formatHours(hoursReal)} a ${tAmb}°C`;
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Preview grammi biga/poolish */}
                    {isPrefermento && result?.prefermentiSplit && (
                      <div className="pt-2 border-t border-current/15 text-xs opacity-80">
                        {phase.id === 'biga' ? '🍞' : '💧'}{' '}
                        <strong>{result.prefermentiSplit.prefermento.flour}g</strong> farina +{' '}
                        <strong>{result.prefermentiSplit.prefermento.water}g</strong> acqua
                        {' '}(idro {result.prefermentiSplit.prefermento.hydration}%)
                        {' '}— {phase.hours}h prima
                      </div>
                    )}

                    {/* ── Avviso riscaldamento post-frigo (solo appretto) ── */}
                    {phase.id === 'appretto' && (() => {
                      const frigoP = phases.find(p => p.id === 'frigo');
                      if (!frigoP?.active) return null;

                      const T_fridge  = frigoP.temperatureCelsius;
                      const T_amb     = phase.temperatureCelsius;
                      // Target: min(T_amb-1, 20°C) — non ha senso portare l'impasto oltre 20°C
                      const T_target  = Math.min(T_amb - 1, 21);
                      const k         = 0.5; // h⁻¹ empirico per pallina in contenitore in aria

                      if (T_fridge >= T_target) return null;

                      const T_after = T_amb + (T_fridge - T_amb) * Math.exp(-k * phase.hours);
                      if (T_after >= T_target) return null;

                      const T_afterRnd = Math.round(T_after);
                      let minHoursStr = '';
                      if (T_amb > T_target) {
                        const minH = (1 / k) * Math.log((T_amb - T_fridge) / (T_amb - T_target));
                        minHoursStr = formatHours(minH);
                      }

                      return (
                        <div className="rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                          <span className="font-bold">⚠️ Impasto ancora freddo!</span>{' '}
                          Dopo {formatHours(phase.hours)} a {T_amb}°C l'impasto sarà
                          ancora a ~<strong>{T_afterRnd}°C</strong> (uscito dal frigo a {T_fridge}°C).
                          {minHoursStr
                            ? <> Si consigliano almeno <strong>{minHoursStr}</strong> per raggiungere ~{T_target}°C.</>
                            : <> La temperatura ambiente è troppo bassa — porta l'impasto in un luogo più caldo.</>
                          }
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
