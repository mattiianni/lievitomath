import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';

export function StaglioSelector() {
  const mode            = useDoughStore(s => s.state.mode);
  const phases          = useDoughStore(s => s.state.phases);
  const staglioAFreddo  = useDoughStore(s => s.state.staglioAFreddo ?? false);
  const setStaglioAFreddo = useDoughStore(s => s.setStaglioAFreddo);

  // Solo per teglia
  if (mode !== 'teglia') return null;

  const hasFrigo = phases.some(p => p.id === 'frigo' && p.active);

  // Per napoletana: posizione staglio è automatica, nessuna scelta
  // Per teglia con frigo: l'utente sceglie
  const isSelectable = mode === 'teglia' && hasFrigo;

  // Descrizione automatica (napoletana o senza frigo)
  let autoLabel = '';
  if (!hasFrigo) {
    autoLabel = 'Dopo la puntata, prima dell\'appretto';
  } else {
    autoLabel = 'Dopo il frigo, prima dell\'appretto';
  }

  if (!isSelectable) {
    // Mostra solo info
    return (
      <SectionCard title="Momento di Staglio">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
          <span className="text-2xl">✂️</span>
          <div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Staglio</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{autoLabel}</p>
          </div>
        </div>
      </SectionCard>
    );
  }

  // Teglia con frigo: 2 opzioni interattive
  const options = [
    {
      val: false,
      emoji: '🫗',
      label: 'Staglio dopo il frigo',
      sub: 'La massa intera va in frigo. Staglio e appretto lungo all\'uscita.',
    },
    {
      val: true,
      emoji: '🧆',
      label: 'Staglio prima del frigo',
      sub: 'Formi i panetti, poi vanno in frigo. Appretto breve all\'uscita.',
    },
  ];

  return (
    <SectionCard title="Momento di Staglio">
      <div className="flex flex-col gap-3">
        {options.map(opt => (
          <button
            key={String(opt.val)}
            onClick={() => setStaglioAFreddo(opt.val)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left whitespace-normal ${
              staglioAFreddo === opt.val
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-transparent bg-neutral-100 dark:bg-neutral-800 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/10'
            }`}
          >
            <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-neutral-900 dark:text-white">{opt.label}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">{opt.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
