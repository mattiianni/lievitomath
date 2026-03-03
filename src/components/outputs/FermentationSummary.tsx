import { useCalculation } from '../../hooks/useCalculation';
import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';

export function FermentationSummary() {
  const result = useCalculation();
  const phases = useDoughStore(s => s.state.phases);

  if (!result) return null;

  const { cumulativeF } = result;
  const totalHours = phases.filter(p => p.active).reduce((s, p) => s + p.hours, 0);

  // Descrizione qualitativa della fermentazione
  let quality = '';
  if (cumulativeF < 3) quality = 'Fermentazione rapida — impasto giovane';
  else if (cumulativeF < 8) quality = 'Fermentazione breve — per cottura in giornata';
  else if (cumulativeF < 16) quality = 'Fermentazione media — buon equilibrio aromi';
  else if (cumulativeF < 28) quality = 'Fermentazione lunga — aromi complessi, buona digeribilità';
  else quality = 'Fermentazione molto lunga — massima maturazione';

  return (
    <SectionCard title="Riepilogo fermentazione">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-3 text-center">
          <p className="text-xs text-neutral-400 mb-1">Ore totali</p>
          <p className="text-xl font-bold text-neutral-800 dark:text-neutral-200">{totalHours}h</p>
        </div>
        <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3 text-center">
          <p className="text-xs text-neutral-400 mb-1">Ferment. equiv. (24°C)</p>
          <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{cumulativeF.toFixed(1)}h</p>
        </div>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">{quality}</p>

      {/* Dettaglio fasi attive */}
      <div className="mt-3 space-y-1">
        {phases.filter(p => p.active && p.hours > 0).map(p => (
          <div key={p.id} className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{p.label}</span>
            <span>{p.hours}h @ {p.temperatureCelsius}°C</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
