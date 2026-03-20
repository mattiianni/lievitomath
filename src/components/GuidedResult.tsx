
import type { GuidedResult as GResult } from '../engine/guidedModeEngine';
import { yeastTypeLabel } from '../engine/fermentation';
import { calcSchedule, absToLabel } from '../utils/cookingSchedule';

const MODE_NAME: Record<string, string> = {
  napoletana: 'Pizza Napoletana',
  teglia:     'Pizza in Teglia',
  pane:       'Pane',
};

const PHASE_COLOR: Record<string, string> = {
  biga:     '#c9a840',
  poolish:  '#6B7EA4',
  autolisi: '#9E9278',
  impasto:  '#4a7a52',
  puntata:  '#8B5E35',
  frigo:    '#4A6A9C',
  appretto: '#ea580c',
};

function phaseLabel(hours: number): string {
  if (Number.isInteger(hours)) return hours === 1 ? '1h' : `${hours}h`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface Props {
  result: GResult;
  cookingDay: number;
  cookingTime: number;
  onReset: () => void;
  onOpenAdvanced: () => void;
}

export function GuidedResult({ result, cookingDay, cookingTime, onReset, onOpenAdvanced }: Props) {
  const {
    ingredients, yeastPercent, phases, suggestedFlour, targetW,
    prefermentiSplit, mode, pieces, weightPerPiece, hydration, salt, oil,
    effectiveYeastType, exitTempC,
  } = result;

  const schedule = calcSchedule(
    phases.map(p => ({ ...p, active: true })),
    cookingDay,
    cookingTime,
  );

  const isSourdoughDirect = !prefermentiSplit && (effectiveYeastType === 'madre' || effectiveYeastType === 'licoli');

  const mainRows: { label: string; value: string; bold?: boolean }[] = [];

  if (prefermentiSplit) {
    const { prefermento, mainDough } = prefermentiSplit;
    mainRows.push(
      { label: `${prefermento.type === 'biga' ? 'Biga' : 'Poolish'} (${prefermento.flourPercent}% farina)`, value: `${prefermento.totalWeight}g`, bold: true },
      { label: '  ↳ Farina', value: `${prefermento.flour}g` },
      { label: '  ↳ Acqua', value: `${prefermento.water}g` },
      { label: `  ↳ ${yeastTypeLabel(effectiveYeastType)}`, value: `${prefermento.yeast}g` },
      { label: `── Farina da aggiungere`, value: `${mainDough.flourToAdd}g` },
      { label: `── Acqua da aggiungere`, value: `${mainDough.waterToAdd}g` },
      { label: `── Sale`, value: `${mainDough.salt}g` },
    );
    if (oil > 0)
      mainRows.push({ label: `── Olio EVO`, value: `${mainDough.oil}g` });
  } else {
    mainRows.push(
      { label: isSourdoughDirect ? 'Farina' : 'Farina totale', value: `${ingredients.flour}g` },
      { label: 'Acqua', value: `${ingredients.water}g` },
      { label: yeastTypeLabel(effectiveYeastType), value: `${ingredients.yeast}g` },
      { label: 'Sale', value: `${ingredients.salt}g` },
    );
    if (oil > 0)
      mainRows.push({ label: 'Olio EVO', value: `${ingredients.oil}g` });
  }

  const totalWeight = pieces * weightPerPiece;

  // ≥18°C = minimo per stesura (AVPN: impasto lavorabile; sotto è troppo contratto)
  const exitTempOk = exitTempC !== null && exitTempC >= 18;

  return (
    <div className="flex flex-col gap-4 mt-2">

      {/* Header risultato */}
      <div className="rounded-2xl overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-1">Risultato</p>
              <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Lobster, cursive', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                {MODE_NAME[mode]}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {pieces} × {weightPerPiece}g · {hydration}% idro · Sale {salt.toFixed(1)}%{oil > 0 ? ` · Olio ${oil}%` : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-white/70 text-xs">Totale impasto</div>
              <div className="text-white font-bold text-lg">{totalWeight}g</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredienti */}
      <div className="bg-white/80 dark:bg-[#1C2548]/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40 dark:border-[#616B8F]/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-[#616B8F]/20">
          <div className="w-1 h-5 rounded-full bg-brand-500" />
          <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Ingredienti</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#616B8F]/15">
          {mainRows.map((row, i) => (
            <div key={i} className={`flex justify-between items-center px-5 py-3 ${row.bold ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
              <span className={`text-sm ${row.bold ? 'font-semibold text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {row.label}
              </span>
              <span className={`text-sm font-bold tabular-nums ${row.bold ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-gray-50/80 dark:bg-[#0A1228]/40">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {yeastTypeLabel(effectiveYeastType)}: <strong className="text-gray-700 dark:text-gray-200">{yeastPercent.toFixed(2)}%</strong> sulla farina
          </p>
        </div>
      </div>

      {/* Fasi di lievitazione */}
      <div className="bg-white/80 dark:bg-[#1C2548]/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40 dark:border-[#616B8F]/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-[#616B8F]/20">
          <div className="w-1 h-5 rounded-full bg-brand-500" />
          <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Fasi di lievitazione</h3>
        </div>
        <div className="flex gap-0 overflow-x-auto px-5 py-4">
          {phases.map((phase, i) => (
            <div key={i} className="flex items-center gap-0 flex-shrink-0">
              <div
                className="px-3 py-2 rounded-lg text-white text-center shadow-sm"
                style={{ backgroundColor: PHASE_COLOR[phase.id] ?? '#616B8F', minWidth: 70 }}
              >
                <div className="text-[11px] font-semibold capitalize">{phase.label}</div>
                <div className="text-sm font-bold">{phaseLabel(phase.hours)}</div>
                <div className="text-[10px] opacity-80">{phase.temperatureCelsius}°C</div>
                {schedule[phase.id] && (
                  <div className="text-[9px] font-mono opacity-75 mt-0.5 leading-tight">
                    <div>{absToLabel(schedule[phase.id].start)}</div>
                    <div>→ {absToLabel(schedule[phase.id].end)}</div>
                  </div>
                )}
              </div>
              {i < phases.length - 1 && (
                <div className="w-4 h-0.5 bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Temperatura di uscita (solo con frigo) */}
        {exitTempC !== null && (
          <div className={`mx-5 mb-4 px-4 py-3 rounded-xl flex items-center gap-3 ${
            exitTempOk
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
          }`}>
            <span className="text-xl">{exitTempOk ? '✅' : '⚠️'}</span>
            <div>
              <p className={`text-xs font-semibold ${exitTempOk ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                Temperatura impasto a fine appretto
              </p>
              <p className={`text-sm font-bold ${exitTempOk ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                {exitTempC}°C — {exitTempOk ? 'Pronto per la stesura ✓' : 'Troppo freddo per la stesura — aggiungi tempo di appretto'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Farina suggerita */}
      <div className="bg-white/80 dark:bg-[#1C2548]/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/40 dark:border-[#616B8F]/20 p-5">
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">🌾</div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Farina consigliata</p>
            <p className="text-gray-900 dark:text-white font-bold">{suggestedFlour.brand} {suggestedFlour.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              W{suggestedFlour.w} · Target W{targetW}
              {suggestedFlour.notes ? ` · ${suggestedFlour.notes}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Azioni */}
      <div className="flex flex-col gap-3 pt-1 pb-6">
        <button
          onClick={onOpenAdvanced}
          className="w-full py-3.5 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-md transition-colors"
        >
          Apri nel calcolatore avanzato →
        </button>
        <button
          onClick={onReset}
          className="w-full py-3 px-6 rounded-xl border border-white/40 dark:border-[#616B8F]/30 text-white/70 dark:text-white/50 hover:text-white/90 text-sm transition-colors"
        >
          ← Ricomincia
        </button>
      </div>
    </div>
  );
}
