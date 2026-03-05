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
import { FermentationSummary } from './components/outputs/FermentationSummary';
import { GuidedModeToggle } from './components/GuidedModeToggle';
import { GuidedModePage } from './components/GuidedModePage';

export default function App() {
  const [guidedMode, setGuidedMode] = useState(false);

  return (
    <div className="min-h-screen font-sans">
      <Header />

      {/* Print view — visibile solo in stampa */}
      <div id="print-view" className="print-only px-8 py-6" />

      <main className="max-w-3xl mx-auto px-4 py-5 print-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <ModeTab />
          </div>
          <GuidedModeToggle enabled={guidedMode} onToggle={() => setGuidedMode(v => !v)} />
        </div>

        {/* Modalità Guidata — placeholder */}
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
                FermentationPhases → IngredientsCard → WBlendCard → FlourActual → FermentationSummary

              Mobile: tutto stack verticale nell'ordine naturale.
            */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start mb-5">
              <div className="lg:row-span-2"><BaseInputs /></div>
              <HydrationGauge />
              <YeastSelector />
            </div>

            <div className="flex flex-col gap-5">
              <FermentationPhases />
              <IngredientsCard />
              <WBlendCard />
              <FlourActual />
              <FermentationSummary />
            </div>

            <footer className="mt-10 text-center pb-6">
              <div style={{ fontFamily: 'Lobster, cursive' }} className="text-xl text-white dark:text-white/80 mb-0.5">
                LievitoMath
              </div>
              <p className="text-xs text-white/75 dark:text-white/70">
                Algoritmo Q10 fermentativo · Disciplinare AVPN · Metodo Bonci per teglia
              </p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
