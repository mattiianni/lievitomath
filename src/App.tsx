import { useState } from 'react';
import { Header } from './components/layout/Header';
import { ModeTab } from './components/layout/ModeTab';
import { BaseInputs } from './components/inputs/BaseInputs';
import { YeastSelector } from './components/inputs/YeastSelector';
import { FermentationPhases } from './components/inputs/FermentationPhases';
import { FlourActual } from './components/inputs/FlourActual';
import { HydrationGauge } from './components/outputs/HydrationGauge';
import { IngredientsCard } from './components/outputs/IngredientsCard';
import { WBlendCard } from './components/outputs/WBlendCard';
import { GuidedModeToggle } from './components/GuidedModeToggle';
import { GuidedModePage } from './components/GuidedModePage';
import { CookingTimeInput } from './components/inputs/CookingTimeInput';
import { StaglioSelector } from './components/inputs/StaglioSelector';

export default function App() {
  const [guidedMode, setGuidedMode] = useState(false);
  const [shoppingList, setShoppingList] = useState(false);

  return (
    <div className="min-h-screen font-sans">
      <Header />

      {/* Print view — visibile solo in stampa */}
      <div id="print-view" className="print-only" />

      <main className="max-w-3xl mx-auto px-4 py-5 print-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <ModeTab />
          </div>
          <GuidedModeToggle enabled={guidedMode} onToggle={() => setGuidedMode(v => !v)} />
        </div>

        {guidedMode ? (
          <GuidedModePage onClose={() => setGuidedMode(false)} />
        ) : (
          <>
            {/*
              Layout desktop (lg):
                Col 1 (row-span-2): BaseInputs
                Col 2 row 1: HydrationGauge
                Col 2 row 2: YeastSelector
              Poi full-width sequenziali:
                FermentationPhases → IngredientsCard (con riepilogo fermentazione) → WBlendCard → FlourActual

              Mobile: tutto stack verticale nell'ordine naturale.
            */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start mb-5">
              <div className="lg:row-span-2"><BaseInputs /></div>
              <HydrationGauge />
              <YeastSelector />
            </div>

            <div className="flex flex-col gap-5">
              <StaglioSelector />
              <CookingTimeInput />
              <FermentationPhases />
              <IngredientsCard />
              <WBlendCard />
              <FlourActual />
            </div>
          </>
        )}

        {/* Toggle Lista della Spesa — visibile in entrambe le modalità */}
        <div className="mt-6 flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-lg">🛒</span>
            <div>
              <p className="text-sm font-semibold text-white dark:text-white/90">Lista della Spesa</p>
              <p className="text-xs text-white/60 dark:text-white/50">Prossimamente</p>
            </div>
          </div>
          <button
            onClick={() => setShoppingList(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              shoppingList ? 'bg-brand-500' : 'bg-white/20 dark:bg-white/10'
            }`}
            aria-label="Toggle lista della spesa"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                shoppingList ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <footer className="mt-6 text-center pb-6">
          <div style={{ fontFamily: 'Lobster, cursive' }} className="text-xl text-white dark:text-white/80 mb-0.5">
            LievitoMath
          </div>
          <p className="text-xs text-white/75 dark:text-white/70">
            Algoritmo Q10 fermentativo · Disciplinare AVPN · Metodo Bonci per teglia
          </p>
        </footer>
      </main>
    </div>
  );
}
