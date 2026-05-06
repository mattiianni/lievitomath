
import type { GuidedResult as GResult } from '../engine/guidedModeEngine';
import { yeastTypeLabel } from '../engine/fermentation';
import { calcSchedule, absToLabel } from '../utils/cookingSchedule';
import type { FermentationPhase } from '../types/dough';

const MODE_NAME: Record<string, string> = {
  napoletana: 'Pizza Verace',
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

const STAGLIO_COLOR = '#7c3aed';

function phaseLabel(hours: number): string {
  if (Number.isInteger(hours)) return hours === 1 ? '1h' : `${hours}h`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function phaseHoursLabel(hours: number): string {
  if (hours === 1) return '1 ora';
  if (Number.isInteger(hours)) return `${hours} ore`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

interface Props {
  result: GResult;
  cookingDay: number;
  cookingTime: number;
  onReset: () => void;
  onOpenAdvanced: () => void;
}

type DisplayItem =
  | { kind: 'phase'; phase: FermentationPhase }
  | { kind: 'staglio'; atMinutes: number | undefined };

export function GuidedResult({ result, cookingDay, cookingTime, onReset, onOpenAdvanced }: Props) {
  const {
    ingredients, yeastPercent, phases, suggestedFlour, targetW,
    prefermentiSplit, mode, pieces, weightPerPiece, hydration, salt, oil,
    effectiveYeastType, exitTempC, staglioAFreddo, cumulativeF,
  } = result;

  const schedule = calcSchedule(
    phases.map(p => ({ ...p, active: true })),
    cookingDay,
    cookingTime,
  );

  const isSourdoughDirect = !prefermentiSplit && (effectiveYeastType === 'madre' || effectiveYeastType === 'licoli');
  const isNaturalPrefermento = !!prefermentiSplit && (effectiveYeastType === 'madre' || effectiveYeastType === 'licoli');

  const mainRows: { label: string; value: string; bold?: boolean }[] = [];

  if (prefermentiSplit) {
    const { prefermento, mainDough } = prefermentiSplit;
    mainRows.push(
      { label: `${prefermento.type === 'biga' ? 'Biga' : 'Poolish'} (${prefermento.flourPercent}% farina)`, value: `${prefermento.totalWeight}g`, bold: true },
      { label: prefermento.starterFlour ? `  ↳ Farina (+${prefermento.starterFlour}g nello starter)` : '  ↳ Farina', value: `${prefermento.flour}g` },
      { label: prefermento.starterWater ? `  ↳ Acqua (+${prefermento.starterWater}g nello starter)` : '  ↳ Acqua', value: `${prefermento.water}g` },
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

  // ≥18°C = minimo per stesura
  const exitTempOk = exitTempC !== null && exitTempC >= 18;

  // Costruisce la lista di display con il marker staglio inserito nella posizione corretta
  const hasFrigo = phases.some(p => p.id === 'frigo');
  const displayItems: DisplayItem[] = [];
  phases.forEach(phase => {
    displayItems.push({ kind: 'phase', phase });
    if (hasFrigo) {
      if (staglioAFreddo && phase.id === 'impasto') {
        // Staglio dopo impasto, prima di puntata (staglio prima del frigo)
        displayItems.push({ kind: 'staglio', atMinutes: schedule[phase.id]?.end });
      } else if (!staglioAFreddo && phase.id === 'frigo') {
        // Staglio tra frigo e appretto (staglio dopo il frigo)
        displayItems.push({ kind: 'staglio', atMinutes: schedule[phase.id]?.end });
      }
    }
  });

  // Fermentation summary quality
  let quality = '';
  if (cumulativeF < 3) quality = 'Fermentazione rapida';
  else if (cumulativeF < 8) quality = 'Fermentazione breve';
  else if (cumulativeF < 16) quality = 'Fermentazione media';
  else if (cumulativeF < 28) quality = 'Fermentazione lunga';
  else quality = 'Fermentazione molto lunga';

  function handlePrintGuided() {
    const el = document.getElementById('print-view');
    if (!el) return;

    const date = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

    // Costruisce righe fasi con staglio inserito nella posizione giusta
    const phaseRowsHtml: string[] = [];
    phases.forEach(phase => {
      const color = PHASE_COLOR[phase.id] ?? '#6b7280';
      const s = schedule[phase.id];
      const orariLine = s
        ? `<div style="font-size:11px; color:#666; margin-top:4px;">dalle ${absToLabel(s.start)} alle ${absToLabel(s.end)}</div>`
        : '';
      phaseRowsHtml.push(`
        <div style="display:flex; align-items:flex-start; justify-content:space-between; padding:10px 14px; border-radius:10px; border-left:4px solid ${color}; background:#fafafa; margin-bottom:4px;">
          <span style="font-size:14px; font-weight:600; color:#222;">${phase.label}</span>
          <div style="text-align:right;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="background:${color}; color:white; border-radius:6px; padding:3px 10px; font-size:13px; font-weight:700;">${phaseHoursLabel(phase.hours)}</span>
              <span style="font-size:13px; color:#555;">a</span>
              <span style="background:#1e3a5f; color:white; border-radius:6px; padding:3px 10px; font-size:13px; font-weight:700;">${phase.temperatureCelsius}°C</span>
            </div>
            ${orariLine}
          </div>
        </div>`);

      if (hasFrigo) {
        if (staglioAFreddo && phase.id === 'impasto') {
          const staglioTime = schedule[phase.id]?.end;
          const staglioLabel = staglioTime !== undefined ? absToLabel(staglioTime) : '';
          phaseRowsHtml.push(`
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 14px; border-radius:10px; border-left:4px solid ${STAGLIO_COLOR}; background:#f5f0ff; margin-bottom:4px;">
              <span style="font-size:14px; font-weight:600; color:${STAGLIO_COLOR};">✂️ Staglio</span>
              <span style="font-size:12px; color:${STAGLIO_COLOR}; font-weight:600;">${staglioLabel}</span>
            </div>`);
        } else if (!staglioAFreddo && phase.id === 'frigo') {
          const staglioTime = schedule[phase.id]?.end;
          const staglioLabel = staglioTime !== undefined ? absToLabel(staglioTime) : '';
          phaseRowsHtml.push(`
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 14px; border-radius:10px; border-left:4px solid ${STAGLIO_COLOR}; background:#f5f0ff; margin-bottom:4px;">
              <span style="font-size:14px; font-weight:600; color:${STAGLIO_COLOR};">✂️ Staglio</span>
              <span style="font-size:12px; color:${STAGLIO_COLOR}; font-weight:600;">${staglioLabel}</span>
            </div>`);
        }
      }
    });

    // Ingredienti HTML
    let ingredientsHtml = '';
    if (prefermentiSplit) {
      const { prefermento, mainDough } = prefermentiSplit;
      const pColor = prefermento.type === 'biga' ? '#fb923c' : '#c084fc';
      const pBg = prefermento.type === 'biga' ? '#fff7ed' : '#faf5ff';
      const pTextColor = prefermento.type === 'biga' ? '#c2410c' : '#7e22ce';
      ingredientsHtml = `
        <div style="border:2px solid ${pColor}; border-radius:10px; padding:12px; margin-bottom:12px; background:${pBg};">
          <p style="font-size:12px; font-weight:700; color:${pTextColor}; text-transform:uppercase; margin:0 0 8px 0;">
            ${prefermento.type === 'biga' ? '🍞 Biga' : '💧 Poolish'} — prepara ${prefermento.hours}h prima a ${prefermento.temperatureCelsius}°C
          </p>
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <tr style="border-bottom:1px solid rgba(0,0,0,0.08);">
              <td style="padding:4px;">Farina (${prefermento.flourPercent}%)</td>
              <td style="padding:4px; text-align:right; font-weight:700;">${prefermento.flour}g</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(0,0,0,0.08);">
              <td style="padding:4px;">Acqua (idro ${prefermento.hydration}%)</td>
              <td style="padding:4px; text-align:right; font-weight:700;">${prefermento.water}g</td>
            </tr>
            <tr>
              <td style="padding:4px; font-weight:700; color:#ea580c;">${yeastTypeLabel(effectiveYeastType)}</td>
              <td style="padding:4px; text-align:right; font-weight:700; color:#ea580c;">${prefermento.yeast}g</td>
            </tr>
            <tr style="border-top:2px solid rgba(0,0,0,0.1);">
              <td style="padding:4px; font-size:11px; color:#888;">Totale ${prefermento.type}</td>
              <td style="padding:4px; text-align:right; font-weight:700; color:#555;">${prefermento.totalWeight}g</td>
            </tr>
          </table>
        </div>
        <div style="border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-bottom:12px;">
          <p style="font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase; margin:0 0 8px 0;">Impasto finale</p>
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:4px; font-weight:600;">Farina da aggiungere</td><td style="padding:4px; text-align:right; font-weight:700;">${mainDough.flourToAdd}g</td></tr>
            <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:4px;">Acqua da aggiungere</td><td style="padding:4px; text-align:right; font-weight:700;">${mainDough.waterToAdd}g</td></tr>
            <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:4px;">Sale</td><td style="padding:4px; text-align:right; font-weight:700;">${mainDough.salt}g</td></tr>
            ${oil > 0 ? `<tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:4px;">Olio EVO</td><td style="padding:4px; text-align:right; font-weight:700;">${mainDough.oil}g</td></tr>` : ''}
            <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:4px; color:#888;">+ ${prefermento.type === 'biga' ? 'Biga' : 'Poolish'} (${mainDough.prefermentiToAdd}g)</td><td></td></tr>
            <tr style="background:#f9fafb;"><td style="padding:4px; font-size:11px; color:#888; border-top:2px solid #e5e7eb;">Impasto totale</td><td style="padding:4px; text-align:right; font-weight:700; color:#555; border-top:2px solid #e5e7eb;">${prefermentiSplit.totalFinalDough}g</td></tr>
          </table>
        </div>`;
    } else {
      ingredientsHtml = `
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          ${mainRows.map(r => `<tr style="border-bottom:1px solid #f0f0f0;">
            <td style="padding:5px 4px; ${r.bold ? 'font-weight:600;' : ''}">${r.label}</td>
            <td style="padding:5px 4px; text-align:right; font-weight:700;">${r.value}</td>
          </tr>`).join('')}
          <tr style="background:#f9fafb;">
            <td style="padding:6px 4px; font-size:11px; color:#888; border-top:2px solid #e5e7eb;">Impasto totale</td>
            <td style="padding:6px 4px; text-align:right; font-weight:700; color:#555; border-top:2px solid #e5e7eb;">${totalWeight}g</td>
          </tr>
        </table>`;
    }

    // Fermentation summary (only totals — individual phases are already shown above)
    const totalH = phases.reduce((s, p) => s + p.hours, 0);

    el.innerHTML = `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Lobster&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="font-family:'Inter',sans-serif; max-width:100%; margin:0 auto; color:#1a1a1a; font-size:11px;">

        <!-- HEADER -->
        <div style="background:linear-gradient(135deg,#ea580c,#f97316); border-radius:10px; padding:12px 16px; margin-bottom:14px; color:white; print-color-adjust:exact; -webkit-print-color-adjust:exact;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <h1 style="font-family:'Lobster',cursive; font-size:24px; margin:0; letter-spacing:0.5px; text-shadow:0 1px 3px rgba(0,0,0,0.35);">LievitoMath</h1>
            <div style="text-align:right; font-size:12px; opacity:0.85;">${date}</div>
          </div>
          <div style="margin-top:6px; font-size:13px; font-weight:600;">${MODE_NAME[mode]} — ${pieces} × ${weightPerPiece}g</div>
          <div style="margin-top:4px; font-size:12px; opacity:0.85;">
            Idratazione ${hydration}% · Sale ${salt.toFixed(1)}%${oil > 0 ? ' · Olio EVO ' + oil + '%' : ''}
          </div>
        </div>

        <!-- INGREDIENTI -->
        <div style="margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div style="width:4px; height:20px; background:#ea580c; border-radius:2px;"></div>
            <h2 style="font-size:14px; font-weight:700; color:#ea580c; text-transform:uppercase; letter-spacing:0.06em; margin:0;">Ingredienti</h2>
          </div>
          ${ingredientsHtml}
          <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; padding:8px 12px; margin-top:10px; font-size:12px; color:#9a3412;">
            ${yeastTypeLabel(effectiveYeastType)}: <strong>${yeastPercent.toFixed(2)}%</strong> sulla farina
          </div>
        </div>

        <!-- FASI DI FERMENTAZIONE -->
        <div style="margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div style="width:4px; height:20px; background:#0ea5e9; border-radius:2px;"></div>
            <h2 style="font-size:14px; font-weight:700; color:#0ea5e9; text-transform:uppercase; letter-spacing:0.06em; margin:0;">Fasi di fermentazione</h2>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${phaseRowsHtml.join('')}
          </div>
        </div>

        <!-- RIEPILOGO FERMENTAZIONE -->
        <div style="margin-bottom:12px; border-top:2px solid #f0f0f0; padding-top:12px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div style="width:4px; height:20px; background:#8b5cf6; border-radius:2px;"></div>
            <h2 style="font-size:14px; font-weight:700; color:#8b5cf6; text-transform:uppercase; letter-spacing:0.06em; margin:0;">Riepilogo fermentazione</h2>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
            <div style="background:#f5f5f5; border-radius:8px; padding:10px; text-align:center;">
              <div style="font-size:11px; color:#888; margin-bottom:4px;">Ore totali</div>
              <div style="font-size:18px; font-weight:700; color:#333;">${totalH}h</div>
            </div>
            <div style="background:#fff7ed; border-radius:8px; padding:10px; text-align:center;">
              <div style="font-size:11px; color:#888; margin-bottom:4px;">Ferment. equiv. 24°C</div>
              <div style="font-size:18px; font-weight:700; color:#ea580c;">${cumulativeF.toFixed(1)}h</div>
            </div>
          </div>
          <div style="font-size:11px; color:#888; font-style:italic; margin-bottom:8px;">${quality}</div>
        </div>

        <!-- FARINA CONSIGLIATA -->
        <div style="margin-bottom:16px; border:1px solid #e5e7eb; border-radius:10px; padding:12px;">
          <p style="font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase; margin:0 0 6px 0;">🌾 Farina consigliata</p>
          <p style="font-size:14px; font-weight:700; margin:0;">${suggestedFlour.brand} ${suggestedFlour.name}</p>
          <p style="font-size:12px; color:#888; margin:2px 0 0 0;">W${suggestedFlour.w} · Target W${targetW}${suggestedFlour.notes ? ' · ' + suggestedFlour.notes : ''}</p>
        </div>

        <p style="font-size:10px; color:#ccc; text-align:center; margin-top:28px; padding-top:12px; border-top:1px solid #f0f0f0;">
          Generato con <strong style="color:#ea580c;">LievitoMath</strong> · Modalità Guidata · Algoritmo Q10 fermentativo
        </p>
      </div>
    `;

    window.print();
  }

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
            {isNaturalPrefermento ? 'Starter' : yeastTypeLabel(effectiveYeastType)}: <strong className="text-gray-700 dark:text-gray-200">{isNaturalPrefermento ? yeastPercent.toFixed(1) : yeastPercent.toFixed(2)}%</strong> sulla farina
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
          {displayItems.map((item, i) => (
            <div key={i} className="flex items-center gap-0 flex-shrink-0">
              {item.kind === 'staglio' ? (
                <div
                  className="px-3 py-2 rounded-lg text-white text-center shadow-sm flex flex-col justify-center items-center"
                  style={{ backgroundColor: STAGLIO_COLOR, minWidth: 70, minHeight: 88 }}
                >
                  <div className="text-[11px] font-semibold">✂️ Staglio</div>
                  {item.atMinutes !== undefined && (
                    <div className="text-[9px] font-mono opacity-90 mt-0.5">
                      {absToLabel(item.atMinutes)}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="px-3 py-2 rounded-lg text-white text-center shadow-sm"
                  style={{ backgroundColor: PHASE_COLOR[item.phase.id] ?? '#616B8F', minWidth: 70 }}
                >
                  <div className="text-[11px] font-semibold capitalize">{item.phase.label}</div>
                  <div className="text-sm font-bold">{phaseLabel(item.phase.hours)}</div>
                  <div className="text-[10px] opacity-80">{item.phase.temperatureCelsius}°C</div>
                  {schedule[item.phase.id] && (
                    <div className="text-[9px] font-mono opacity-75 mt-0.5 leading-tight">
                      <div>{absToLabel(schedule[item.phase.id].start)}</div>
                      <div>→ {absToLabel(schedule[item.phase.id].end)}</div>
                    </div>
                  )}
                </div>
              )}
              {i < displayItems.length - 1 && (
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
          onClick={handlePrintGuided}
          className="w-full py-3 px-6 rounded-xl border-2 border-white/30 dark:border-[#616B8F]/40 text-white/80 dark:text-white/70 hover:text-white hover:border-white/50 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Stampa
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
