import { useState } from 'react';
import { SliderWithButtons } from '../ui/SliderWithButtons';
import { useDoughStore } from '../../store/useDoughStore';
import { useCalculation } from '../../hooks/useCalculation';
import { q10Factor } from '../../engine/fermentation';
import { SectionCard } from '../ui/SectionCard';
import { calcSchedule, absToLabel } from '../../utils/cookingSchedule';

// Palette muted/desaturata (fornita utente — "palette scura")
// Swatch (sx→dx): #8B9EC4 #9E9278 #D9C27A #6B7EA4 #6A5535 #252B3C
// Assegnazione semantica: biga=dorato, poolish=ardesia, puntata=siena, autolisi=taupe, frigo=periwinkle, appretto=navy
// Light mode: tinte chiarissime dello stesso hue. Dark mode: colore pieno dalla palette.
const PHASE_COLORS: Record<string, string> = {
  biga:     'bg-[#fdf5dc] dark:bg-[#D9C27A] text-[#4a3010] dark:text-[#3a2800]',
  poolish:  'bg-[#e8edf8] dark:bg-[#6B7EA4] text-[#1a2840] dark:text-[#dce8f8]',
  autolisi: 'bg-[#f5f0e8] dark:bg-[#9E9278] text-[#3a3020] dark:text-[#2a2010]',
  impasto:  'bg-[#edf5ee] dark:bg-[#4a7a52] text-[#1a3a20] dark:text-[#d0f0d8]',
  puntata:  'bg-[#f5ece0] dark:bg-[#6A5535] text-[#3a2010] dark:text-[#f0d8b0]',
  frigo:    'bg-[#edf2fa] dark:bg-[#8B9EC4] text-[#1a2840] dark:text-[#0a1428]',
  appretto: 'bg-[#eaecf2] dark:bg-[#252B3C] text-[#1a2030] dark:text-[#a0b0c8]',
};

const PHASE_ICONS: Record<string, string> = {
  biga:     '🍞',
  poolish:  '💧',
  autolisi: '⏸',
  impasto:  '🤌',
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
  const phases      = useDoughStore(s => s.state.phases);
  const updatePhase = useDoughStore(s => s.updatePhase);
  const togglePhase = useDoughStore(s => s.togglePhase);
  const yeastType   = useDoughStore(s => s.state.yeastType);
  const cookingDay  = useDoughStore(s => s.cookingDay);
  const cookingTime = useDoughStore(s => s.cookingTime);
  const result      = useCalculation();

  const schedule = calcSchedule(phases, cookingDay, cookingTime);

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
          // Biga disabilitata quando si usa madre/licoli
          const isBigaDisabled = phase.id === 'biga' && isSourdough;
          // Autolisi disabilitata quando è attivo un prefermento
          const anyPrefermento = phases.some(p => PREFERMENTI.includes(p.id) && p.active);
          const isAutolisiDisabled = phase.id === 'autolisi' && anyPrefermento;
          const isDisabled = isBigaDisabled || isAutolisiDisabled;

          return (
            <div key={phase.id}>
              {idx > 0 && (
                <div className="flex justify-center my-1 text-neutral-300 dark:text-neutral-600 text-xs">↓</div>
              )}

              <div className={`rounded-xl p-3 border transition-all ${
                isDisabled
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Pillola orario */}
                    {phase.active && !isDisabled && schedule[phase.id] && (
                      <span className="text-xs px-2 py-0.5 rounded-md border border-neutral-400 dark:border-neutral-500 text-neutral-600 dark:text-neutral-300 whitespace-nowrap flex-shrink-0 font-medium">
                        {absToLabel(schedule[phase.id].start)} → {absToLabel(schedule[phase.id].end)}
                      </span>
                    )}
                    {!phase.locked && !isDisabled && (
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
                </div>

                {/* Note fasi disabilitate */}
                {isBigaDisabled && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                    Richiede lievito di birra fresco — non compatibile con Madre/Li.Co.Li
                  </p>
                )}
                {isAutolisiDisabled && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                    Non combinabile con Biga o Poolish (sono già prefermenti)
                  </p>
                )}

                {phase.active && !isDisabled && (
                  <div className="flex flex-col gap-3">

                    {/* Slider Ore — nascosto in AUTO mode per prefermenti; per impasto slider speciale 0:30-2:00 */}
                    {(!isPrefermento || !isAutoOn) && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium opacity-80">
                            {isPrefermento ? 'Ore di riferimento' : phase.id === 'impasto' ? 'Durata impasto' : 'Ore'}
                          </label>
                          <span className="text-sm font-bold">{formatHours(phase.hours)}</span>
                        </div>
                        <SliderWithButtons
                          min={phase.id === 'impasto' ? 0.5 : phase.k === 0 ? 0 : 0.5}
                          max={phase.id === 'impasto' ? 2 : phase.id === 'frigo' ? 72 : isPrefermento ? 48 : 24}
                          step={phase.id === 'impasto' ? 0.25 : 0.5}
                          value={phase.hours}
                          onChange={v => updatePhase(phase.id, { hours: v })}
                          className="h-1.5 rounded appearance-none cursor-pointer accent-current"
                        />
                      </div>
                    )}

                    {/* Slider Temperatura — per impasto = "Temp. uscita impasto", per frigo ecc. normale */}
                    {(!isPrefermento || !isAutoOn) && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium opacity-80">
                          {isPrefermento ? 'Temperatura ricetta' : phase.id === 'impasto' ? 'Temp. uscita impasto' : 'Temperatura'}
                        </label>
                        <span className="text-sm font-bold">{phase.temperatureCelsius}°C</span>
                      </div>
                      <SliderWithButtons
                        min={phase.id === 'frigo' ? 2 : 14}
                        max={phase.id === 'frigo' ? 10 : 32}
                        step={1}
                        value={phase.temperatureCelsius}
                        onChange={v => updatePhase(phase.id, { temperatureCelsius: v })}
                        className="h-1.5 rounded appearance-none cursor-pointer accent-current"
                      />
                    </div>
                    )}

                    {/* Slider extra — solo biga/poolish */}
                    {isPrefermento && (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium opacity-80">
                              % farina nel blend
                              <span className="opacity-50 font-normal ml-1">({phase.id === 'poolish' ? '30%' : '40%'} tipico)</span>
                            </label>
                            <span className="text-sm font-bold">
                              {phase.flourPercent ?? (phase.id === 'poolish' ? 30 : 40)}%
                            </span>
                          </div>
                          <SliderWithButtons
                            min={20}
                            max={phase.id === 'poolish' ? 40 : 70}
                            step={5}
                            value={phase.flourPercent ?? (phase.id === 'poolish' ? 30 : 40)}
                            onChange={v => updatePhase(phase.id, { flourPercent: v })}
                            className="h-1.5 rounded appearance-none cursor-pointer accent-current"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium opacity-80">
                              Idratazione
                              <span className="opacity-50 font-normal ml-1">({phase.id === 'poolish' ? '100%' : '44%'} tipico)</span>
                            </label>
                            <span className="text-sm font-bold">
                              {phase.hydrationPercent ?? (phase.id === 'poolish' ? 100 : 44)}%
                            </span>
                          </div>
                          <SliderWithButtons
                            min={phase.id === 'poolish' ? 80 : 40}
                            max={phase.id === 'poolish' ? 100 : 60}
                            step={phase.id === 'poolish' ? 5 : 2}
                            value={phase.hydrationPercent ?? (phase.id === 'poolish' ? 100 : 44)}
                            onChange={v => updatePhase(phase.id, { hydrationPercent: v })}
                            className="h-1.5 rounded appearance-none cursor-pointer accent-current"
                          />
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
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium opacity-80">T ambiente</label>
                                <span className="text-sm font-bold">{tAmb}°C</span>
                              </div>
                              <div className="mb-2">
                                <SliderWithButtons
                                  min={14} max={30} step={1}
                                  value={tAmb}
                                  onChange={v => setAutoAmbientTemp(prev => ({ ...prev, [phase.id]: v }))}
                                  className="h-1.5 rounded appearance-none cursor-pointer accent-current"
                                />
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
                      // Target: almeno 16°C (soglia minima fermentazione), al più T_amb-1 e 21°C
                      const T_target  = Math.max(Math.min(T_amb - 1, 21), 16);
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
