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

export default function App() {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-neutral-950 font-sans">
      <Header />

      {/* Print view — visibile solo in stampa */}
      <div id="print-view" className="print-only px-8 py-6" />

      <main className="max-w-3xl mx-auto px-4 py-5 print-hidden">
        <div className="mb-5">
          <ModeTab />
        </div>

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

        <footer className="mt-10 text-center text-xs text-neutral-400 dark:text-neutral-600 pb-6">
          <span style={{ fontFamily: 'Lobster, cursive' }} className="text-brand-400">LievitoMath</span>
          {' '}— Algoritmo Q10 fermentativo · Disciplinare AVPN · Metodo Bonci per teglia
        </footer>
      </main>
    </div>
  );
}
