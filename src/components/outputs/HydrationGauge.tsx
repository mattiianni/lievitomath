import { useDoughStore } from '../../store/useDoughStore';
import { getHydrationStatus, getSaltStatus, getOilStatus } from '../../engine/flour';
import { HYDRATION_RANGES } from '../../constants/modes';
import type { HydrationStatus, SimpleStatus } from '../../types/results';

const HYDRO_CONFIG: Record<HydrationStatus, { label: string; color: string; bg: string; border: string }> = {
  too_low:  { label: 'Idrat. troppo bassa',  color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',      border: 'border-red-400' },
  low:      { label: 'Idrat. un po\' bassa', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-400' },
  optimal:  { label: 'In disciplinare ✓',   color: 'text-green-700 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-400' },
  high:     { label: 'Idrat. un po\' alta',  color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-400' },
  too_high: { label: 'Idrat. troppo alta',   color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',      border: 'border-red-400' },
};

const SEGMENTS: HydrationStatus[] = ['too_low', 'low', 'optimal', 'high', 'too_high'];
const SEG_COLOR: Record<HydrationStatus, string> = {
  too_low: 'bg-red-500', low: 'bg-orange-400', optimal: 'bg-green-500', high: 'bg-orange-400', too_high: 'bg-red-500',
};

const STATUS_DOT: Record<SimpleStatus, { dot: string; label: string }> = {
  ok:   { dot: 'bg-green-500',  label: 'ok' },
  warn: { dot: 'bg-orange-400', label: 'attenzione' },
  bad:  { dot: 'bg-red-500',    label: 'fuori range' },
};

const MODE_LABELS: Record<string, string> = {
  napoletana: 'Disciplinare AVPN',
  teglia: 'Riferimento Bonci',
  pane: 'Range consigliato',
};

export function HydrationGauge() {
  const mode = useDoughStore(s => s.state.mode);
  const hydration = useDoughStore(s => s.state.hydration);
  const salt = useDoughStore(s => s.state.salt);
  const oil = useDoughStore(s => s.state.oil);

  const hydStatus = getHydrationStatus(hydration, mode);
  const saltStatus = getSaltStatus(salt, mode);
  const oilStatus = getOilStatus(oil, mode);

  const cfg = HYDRO_CONFIG[hydStatus];
  const r = HYDRATION_RANGES[mode];

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{MODE_LABELS[mode]}</p>
          <p className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${cfg.color}`}>{hydration}%</p>
          <p className="text-xs text-neutral-400">idratazione</p>
        </div>
      </div>

      {/* Barra 5 segmenti */}
      <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-1">
        {SEGMENTS.map(seg => (
          <div
            key={seg}
            className={`flex-1 ${SEG_COLOR[seg]} ${hydStatus === seg ? 'opacity-100 ring-2 ring-white/70' : 'opacity-25'} transition-all`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-neutral-400 mb-4">
        <span>{r.too_low}%</span>
        <span className="text-green-600 dark:text-green-400 font-medium">{r.low}–{r.too_high_start}% ottimale</span>
        <span>{r.too_high}%</span>
      </div>

      {/* Indicatori sale e olio */}
      <div className="flex gap-3 pt-3 border-t border-current border-opacity-20">
        <ParamPill label="Sale" value={`${salt.toFixed(1)}%`} status={saltStatus} />
        {mode !== 'pane' && (
          <ParamPill label="Olio EVO" value={`${oil}%`} status={oilStatus} />
        )}
      </div>
    </div>
  );
}

function ParamPill({ label, value, status }: { label: string; value: string; status: SimpleStatus }) {
  const { dot, label: statusLabel } = STATUS_DOT[status];
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <span className="text-neutral-600 dark:text-neutral-400 font-medium">{label}:</span>
      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{value}</span>
      <span className="text-neutral-400">({statusLabel})</span>
    </div>
  );
}
