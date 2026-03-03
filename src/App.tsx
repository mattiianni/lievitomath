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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans">
      <Header />

      {/* Print view — visibile solo in stampa */}
      <div id="print-view" className="print-only px-8 py-6" />

      <main className="max-w-5xl mx-auto px-4 py-5 print-hidden">
        <div className="mb-5">
          <ModeTab />
        </div>

        {/*
          Mobile: ordine 1→8 (semaforo subito dopo slider)
          Desktop 2 col: col-start + row-start espliciti
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="order-1 lg:col-start-1 lg:row-start-1"><BaseInputs /></div>
          <div className="order-2 lg:col-start-2 lg:row-start-1"><HydrationGauge /></div>
          <div className="order-3 lg:col-start-1 lg:row-start-2"><YeastSelector /></div>
          <div className="order-4 lg:col-start-2 lg:row-start-2"><WBlendCard /></div>
          <div className="order-5 lg:col-start-1 lg:row-start-3"><FermentationPhases /></div>
          <div className="order-6 lg:col-start-2 lg:row-start-3"><IngredientsCard /></div>
          <div className="order-7 lg:col-start-1 lg:row-start-4"><FlourActual /></div>
          <div className="order-8 lg:col-start-2 lg:row-start-4"><FermentationSummary /></div>
        </div>

        <footer className="mt-10 text-center text-xs text-neutral-400 dark:text-neutral-600 pb-6">
          <span style={{ fontFamily: 'Lobster, cursive' }} className="text-brand-400">LievitoMath</span>
          {' '}— Algoritmo Q10 fermentativo · Disciplinare AVPN · Metodo Bonci per teglia
        </footer>
      </main>
    </div>
  );
}
