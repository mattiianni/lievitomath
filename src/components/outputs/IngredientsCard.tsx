import { useEffect } from 'react';
import { useCalculation } from '../../hooks/useCalculation';
import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';
import { yeastTypeLabel } from '../../engine/fermentation';

const MODE_NAME: Record<string, string> = {
  napoletana: 'Pizza Napoletana',
  teglia: 'Pizza in Teglia',
  pane: 'Pane',
};

export function IngredientsCard() {
  const result = useCalculation();
  const yeastType = useDoughStore(s => s.state.yeastType);
  const mode = useDoughStore(s => s.state.mode);
  const state = useDoughStore(s => s.state);
  const userFlourBanner = useDoughStore(s => s.userFlourBanner);
  const setUserFlourBanner = useDoughStore(s => s.setUserFlourBanner);

  // Auto-dismiss banner dopo 7 secondi
  useEffect(() => {
    if (!userFlourBanner) return;
    const t = setTimeout(() => setUserFlourBanner(null), 7000);
    return () => clearTimeout(t);
  }, [userFlourBanner, setUserFlourBanner]);

  if (!result) {
    return (
      <SectionCard title="Ingredienti">
        <p className="text-sm text-neutral-400 text-center py-4">Inserisci i dati per calcolare</p>
      </SectionCard>
    );
  }

  const { ingredients, yeastPercent, totalDoughWeight, prefermentiSplit } = result;

  const rows = [
    { label: 'Farina totale',       value: ingredients.flour, unit: 'g', bold: true },
    { label: 'Acqua',               value: ingredients.water, unit: 'g', bold: false },
    { label: 'Sale',                value: ingredients.salt,  unit: 'g', bold: false },
    ...(mode !== 'pane' && ingredients.oil > 0
      ? [{ label: 'Olio EVO',       value: ingredients.oil,   unit: 'g', bold: false }]
      : []),
    { label: yeastTypeLabel(yeastType), value: ingredients.yeast, unit: 'g', bold: true, accent: true },
  ];

  function handlePrint() {
    const el = document.getElementById('print-view');
    if (!el) return;

    const date = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    const phases = state.phases.filter(p => p.active && p.hours > 0);

    const phaseColors: Record<string, string> = {
      biga:     '#f97316',
      poolish:  '#a855f7',
      autolisi: '#6366f1',
      puntata:  '#ea580c',
      frigo:    '#0ea5e9',
      appretto: '#16a34a',
      riposo:   '#16a34a',
    };

    function phaseHoursLabel(hours: number): string {
      if (hours === 1) return '1 ora';
      if (Number.isInteger(hours)) return `${hours} ore`;
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return h > 0 ? `${h}h ${m}min` : `${m} min`;
    }

    el.innerHTML = `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Lobster&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <div style="font-family:'Inter',sans-serif; max-width:100%; margin:0 auto; color:#1a1a1a; font-size:11px;">

        <!-- HEADER -->
        <div style="background:linear-gradient(135deg,#ea580c,#f97316); border-radius:10px; padding:12px 16px; margin-bottom:14px; color:white;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <h1 style="font-family:'Lobster',cursive; font-size:24px; margin:0; letter-spacing:0.5px;">LievitoMath</h1>
            <div style="text-align:right; font-size:12px; opacity:0.85;">${date}</div>
          </div>
          <div style="margin-top:6px; font-size:13px; font-weight:600;">
            ${MODE_NAME[mode]} — ${state.pieces} × ${state.weightPerPiece}g
          </div>
          <div style="margin-top:4px; font-size:12px; opacity:0.85;">
            Idratazione ${state.hydration}% · Sale ${state.salt.toFixed(1)}%${mode !== 'pane' && state.oil > 0 ? ' · Olio EVO ' + state.oil + '%' : ''}
          </div>
        </div>

        <!-- INGREDIENTI -->
        <div style="margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div style="width:4px; height:20px; background:#ea580c; border-radius:2px;"></div>
            <h2 style="font-size:14px; font-weight:700; color:#ea580c; text-transform:uppercase; letter-spacing:0.06em; margin:0;">Ingredienti</h2>
          </div>
          ${prefermentiSplit ? `
            <!-- BIGA/POOLISH SECTION -->
            <div style="border:2px solid ${prefermentiSplit.prefermento.type === 'biga' ? '#fb923c' : '#c084fc'}; border-radius:10px; padding:12px; margin-bottom:12px; background:${prefermentiSplit.prefermento.type === 'biga' ? '#fff7ed' : '#faf5ff'};">
              <p style="font-size:12px; font-weight:700; color:${prefermentiSplit.prefermento.type === 'biga' ? '#c2410c' : '#7e22ce'}; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px 0;">
                ${prefermentiSplit.prefermento.type === 'biga' ? '🍞 Biga' : '💧 Poolish'} — prepara ${prefermentiSplit.prefermento.hours}h prima a ${prefermentiSplit.prefermento.temperatureCelsius}°C
              </p>
              <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr style="border-bottom:1px solid rgba(0,0,0,0.08);">
                  <td style="padding:4px 4px;">Farina <span style="font-size:10px; color:#999;">(${prefermentiSplit.prefermento.flourPercent}%)</span></td>
                  <td style="padding:4px 4px; text-align:right; font-size:14px; font-weight:700;">${prefermentiSplit.prefermento.flour}<span style="font-size:11px; font-weight:400; color:#888;">g</span></td>
                </tr>
                <tr style="border-bottom:1px solid rgba(0,0,0,0.08);">
                  <td style="padding:4px 4px;">Acqua <span style="font-size:10px; color:#999;">(idro ${prefermentiSplit.prefermento.hydration}%)</span></td>
                  <td style="padding:4px 4px; text-align:right; font-size:14px; font-weight:700;">${prefermentiSplit.prefermento.water}<span style="font-size:11px; font-weight:400; color:#888;">g</span></td>
                </tr>
                <tr>
                  <td style="padding:4px 4px; font-weight:700; color:#ea580c;">${yeastTypeLabel(yeastType)}</td>
                  <td style="padding:4px 4px; text-align:right; font-size:14px; font-weight:700; color:#ea580c;">${prefermentiSplit.prefermento.yeast}<span style="font-size:11px; font-weight:400; color:#888;">g</span></td>
                </tr>
                <tr style="border-top:2px solid rgba(0,0,0,0.1);">
                  <td style="padding:4px 4px; font-size:11px; color:#888;">Totale ${prefermentiSplit.prefermento.type}</td>
                  <td style="padding:4px 4px; text-align:right; font-size:12px; font-weight:700; color:#555;">${prefermentiSplit.prefermento.totalWeight}<span style="font-size:10px; color:#888;">g</span></td>
                </tr>
              </table>
            </div>
            <!-- IMPASTO FINALE SECTION -->
            <div style="border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-bottom:12px;">
              <p style="font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px 0;">Impasto finale</p>
              <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:4px 4px; font-weight:600;">Farina da aggiungere</td>
                  <td style="padding:4px 4px; text-align:right; font-size:17px; font-weight:700;">${prefermentiSplit.mainDough.flourToAdd}<span style="font-size:12px; font-weight:400; color:#888;">g</span></td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:4px 4px;">Acqua da aggiungere</td>
                  <td style="padding:4px 4px; text-align:right; font-size:17px; font-weight:700;">${prefermentiSplit.mainDough.waterToAdd}<span style="font-size:12px; font-weight:400; color:#888;">g</span></td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:4px 4px;">Sale</td>
                  <td style="padding:4px 4px; text-align:right; font-size:17px; font-weight:700;">${prefermentiSplit.mainDough.salt}<span style="font-size:12px; font-weight:400; color:#888;">g</span></td>
                </tr>
                ${prefermentiSplit.mainDough.oil > 0 ? `
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:4px 4px;">Olio EVO</td>
                  <td style="padding:4px 4px; text-align:right; font-size:17px; font-weight:700;">${prefermentiSplit.mainDough.oil}<span style="font-size:12px; font-weight:400; color:#888;">g</span></td>
                </tr>` : ''}
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:4px 4px; color:#888;">+ ${prefermentiSplit.prefermento.type === 'biga' ? 'Biga' : 'Poolish'} (${prefermentiSplit.mainDough.prefermentiToAdd}g)</td>
                  <td></td>
                </tr>
                <tr style="background:#f9fafb;">
                  <td style="padding:4px 4px; font-size:12px; color:#888; border-top:2px solid #e5e7eb;">Impasto totale</td>
                  <td style="padding:4px 4px; text-align:right; font-size:14px; font-weight:600; color:#555; border-top:2px solid #e5e7eb;">${prefermentiSplit.totalFinalDough}<span style="font-size:12px; font-weight:400; color:#888;">g</span></td>
                </tr>
              </table>
            </div>
          ` : `
            <table style="width:100%; border-collapse:collapse; font-size:15px;">
              ${rows.map(r => `
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:4px 4px; ${r.accent ? 'font-weight:700; color:#ea580c;' : r.bold ? 'font-weight:600;' : ''}">${r.label}</td>
                  <td style="padding:4px 4px; text-align:right; font-size:14px; font-weight:700; ${r.accent ? 'color:#ea580c;' : 'color:#111;'}">${r.value}<span style="font-size:11px; font-weight:400; color:#888;">${r.unit}</span></td>
                </tr>
              `).join('')}
              <tr style="background:#f9fafb;">
                <td style="padding:8px 4px; font-size:12px; color:#888; border-top:2px solid #e5e7eb;">Impasto totale</td>
                <td style="padding:8px 4px; text-align:right; font-size:14px; font-weight:600; color:#555; border-top:2px solid #e5e7eb;">${totalDoughWeight}<span style="font-size:12px; font-weight:400; color:#888;">g</span></td>
              </tr>
            </table>
          `}
          <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; padding:8px 12px; margin-top:10px; font-size:12px; color:#9a3412;">
            % lievito sulla farina: <strong>${yeastPercent.toFixed(3)}%</strong> · ${yeastTypeLabel(yeastType)}
          </div>
        </div>

        <!-- FASI DI FERMENTAZIONE -->
        <div style="margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div style="width:4px; height:20px; background:#0ea5e9; border-radius:2px;"></div>
            <h2 style="font-size:14px; font-weight:700; color:#0ea5e9; text-transform:uppercase; letter-spacing:0.06em; margin:0;">Fasi di fermentazione</h2>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${phases.map(p => {
              const color = phaseColors[p.id] ?? '#6b7280';
              return `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:10px; border-left:4px solid ${color}; background:#fafafa;">
                <span style="font-size:14px; font-weight:600; color:#222;">${p.label}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="background:${color}; color:white; border-radius:6px; padding:3px 10px; font-size:13px; font-weight:700;">${phaseHoursLabel(p.hours)}</span>
                  <span style="font-size:13px; color:#555;">a</span>
                  <span style="background:#1e3a5f; color:white; border-radius:6px; padding:3px 10px; font-size:13px; font-weight:700;">${p.temperatureCelsius}°C</span>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- FARINE -->
        <div style="margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div style="width:4px; height:20px; background:#16a34a; border-radius:2px;"></div>
            <h2 style="font-size:14px; font-weight:700; color:#16a34a; text-transform:uppercase; letter-spacing:0.06em; margin:0;">Blend farine</h2>
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            ${state.flours.map((f, i) => `
              <tr style="background:${i % 2 === 0 ? '#f9fafb' : 'white'}; border-radius:6px;">
                <td style="padding:8px 8px; font-weight:600;">${f.brand} ${f.name}</td>
                <td style="padding:8px 4px; text-align:center; color:#888; font-size:12px;">W${f.w}</td>
                <td style="padding:8px 8px; text-align:right; font-weight:700; color:#ea580c;">${f.percentage}%</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <p style="font-size:10px; color:#ccc; text-align:center; margin-top:28px; padding-top:12px; border-top:1px solid #f0f0f0;">
          Generato con <strong style="color:#ea580c;">LievitoMath</strong> · Algoritmo Q10 fermentativo · Disciplinare AVPN
        </p>
      </div>
    `;

    window.print();
  }

  return (
    <div id="ingredients-card">
    <SectionCard title="Ingredienti">
      {/* Banner CALCOLO AGGIORNATO */}
      {userFlourBanner && (
        <div className="mb-4 rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wide">
                ✓ Calcolo aggiornato con farine utente
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">{userFlourBanner}</p>
            </div>
            <button
              onClick={() => setUserFlourBanner(null)}
              className="text-green-400 hover:text-green-600 dark:hover:text-green-200 text-lg leading-none flex-shrink-0 mt-0.5"
            >×</button>
          </div>
        </div>
      )}
      {prefermentiSplit ? (
        /* ── MODALITÀ PREFERMENTO: due sezioni ── */
        <>
          {/* BOX 1: Biga / Poolish */}
          <div className={`rounded-xl border-2 p-3 mb-3 ${
            prefermentiSplit.prefermento.type === 'biga'
              ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
              : 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'
          }`}>
            <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${
              prefermentiSplit.prefermento.type === 'biga'
                ? 'text-orange-700 dark:text-orange-300'
                : 'text-purple-700 dark:text-purple-300'
            }`}>
              {prefermentiSplit.prefermento.type === 'biga' ? '🍞 Biga' : '💧 Poolish'}
              {' '}— prepara {prefermentiSplit.prefermento.hours}h prima a {prefermentiSplit.prefermento.temperatureCelsius}°C
            </p>
            <div className="space-y-1">
              {[
                { label: 'Farina', value: prefermentiSplit.prefermento.flour, unit: 'g', sub: `${prefermentiSplit.prefermento.flourPercent}% del totale` },
                { label: 'Acqua',  value: prefermentiSplit.prefermento.water,  unit: 'g', sub: `idro ${prefermentiSplit.prefermento.hydration}%` },
                { label: yeastTypeLabel(yeastType), value: prefermentiSplit.prefermento.yeast, unit: 'g', sub: null },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-1 border-b border-current/10 last:border-0">
                  <div>
                    <span className="text-sm font-medium">{r.label}</span>
                    {r.sub && <span className="text-xs opacity-60 ml-1">({r.sub})</span>}
                  </div>
                  <span className="text-sm font-bold">{r.value}{r.unit}</span>
                </div>
              ))}
            </div>
            <div className={`mt-2 pt-2 border-t flex justify-between text-xs font-semibold ${
              prefermentiSplit.prefermento.type === 'biga'
                ? 'border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                : 'border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300'
            }`}>
              <span>Totale {prefermentiSplit.prefermento.type}</span>
              <span>{prefermentiSplit.prefermento.totalWeight}g</span>
            </div>
          </div>

          {/* BOX 2: Impasto finale */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 mb-3">
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Impasto finale
            </p>
            <div className="space-y-1">
              {[
                { label: 'Farina da aggiungere', value: prefermentiSplit.mainDough.flourToAdd, unit: 'g' },
                { label: 'Acqua da aggiungere',  value: prefermentiSplit.mainDough.waterToAdd,  unit: 'g' },
                { label: 'Sale',                  value: prefermentiSplit.mainDough.salt,        unit: 'g' },
                ...(mode !== 'pane' && prefermentiSplit.mainDough.oil > 0
                  ? [{ label: 'Olio EVO', value: prefermentiSplit.mainDough.oil, unit: 'g' }]
                  : []),
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{r.label}</span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{r.value}{r.unit}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-1 text-neutral-500 dark:text-neutral-400">
                <span className="text-sm">
                  + {prefermentiSplit.prefermento.type === 'biga' ? 'Biga' : 'Poolish'} ({prefermentiSplit.mainDough.prefermentiToAdd}g)
                </span>
              </div>
              <div className="text-xs text-neutral-400 dark:text-neutral-500 pt-1 italic">
                Nessun lievito aggiuntivo — il lievito nella {prefermentiSplit.prefermento.type === 'biga' ? 'biga' : 'poolish'} continua a lavorare
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              <span>Impasto totale</span>
              <span>{prefermentiSplit.totalFinalDough}g</span>
            </div>
          </div>
        </>
      ) : (
        /* ── MODALITÀ DIRETTA: tabella unica ── */
        <>
          <div className="space-y-1 mb-4">
            {rows.map(row => (
              <div
                key={row.label}
                className={`flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0 ${
                  row.accent ? 'rounded-lg bg-brand-50 dark:bg-brand-900/20 px-2 -mx-2' : ''
                }`}
              >
                <span className={`text-sm ${row.bold ? 'font-semibold text-neutral-800 dark:text-neutral-200' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  {row.label}
                </span>
                <span className={`text-sm font-bold ${row.accent ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                  {row.value}{row.unit}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700 mb-3">
            <span className="text-xs text-neutral-400">Impasto totale</span>
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{totalDoughWeight}g</span>
          </div>
        </>
      )}

      <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-500 mb-3">
        % lievito: <strong>{yeastPercent.toFixed(3)}%</strong> sulla farina
      </div>

      {/* Pulsante STAMPA */}
      <button
        onClick={handlePrint}
        className="w-full py-2.5 rounded-xl border-2 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 font-semibold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Stampa / Salva PDF
      </button>
    </SectionCard>
    </div>
  );
}
