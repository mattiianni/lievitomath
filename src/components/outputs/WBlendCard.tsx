import { useState } from 'react';
import { useCalculation } from '../../hooks/useCalculation';
import { useDoughStore } from '../../store/useDoughStore';
import { SectionCard } from '../ui/SectionCard';
import { suggestBlend, blendSuggestionW } from '../../engine/flour';
import type { BlendIngredient } from '../../engine/flour';

export function WBlendCard() {
  const result = useCalculation();
  const [showBlend, setShowBlend] = useState(false);
  const [blend, setBlend] = useState<BlendIngredient[] | null>(null);
  const flours = useDoughStore(s => s.state.flours);
  const updateFlour = useDoughStore(s => s.updateFlour);
  const addFlour = useDoughStore(s => s.addFlour);
  const removeFlour = useDoughStore(s => s.removeFlour);

  if (!result) return null;

  const { targetW } = result.wBlend;

  const cF = result.cumulativeF;

  function handleCalcBlend() {
    const suggested = suggestBlend(targetW);
    setBlend(suggested);
    setShowBlend(true);
  }

  function handleApplyBlend() {
    if (!blend) return;
    const currentIds = flours.map(f => f.id);
    if (blend.length > 0 && flours.length > 0) {
      updateFlour(flours[0].id, {
        brand: blend[0].brand,
        name: blend[0].name,
        w: blend[0].w,
        percentage: blend[0].percentage,
      });
    }
    for (let i = blend.length; i < currentIds.length; i++) {
      removeFlour(currentIds[i]);
    }
    if (blend.length > 1) {
      if (flours.length >= 2) {
        updateFlour(flours[1]?.id ?? '', {
          brand: blend[1].brand,
          name: blend[1].name,
          w: blend[1].w,
          percentage: blend[1].percentage,
        });
      } else {
        addFlour();
      }
    }
  }

  return (
    <SectionCard title="Forza farina (W)">
      {/* W richiesto — ben in evidenza */}
      <div className="mb-3">
        <p className="text-xs text-neutral-400">W richiesto dalla fermentazione</p>
        <p className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">{targetW}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{cF.toFixed(1)}h equiv. a 24°C</p>
      </div>

      {/* Pulsante CALCOLA BLEND */}
      <button
        onClick={handleCalcBlend}
        className="w-full mt-3 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors"
      >
        CALCOLA BLEND IDEALE →
      </button>

      {/* Blend suggerito */}
      {showBlend && blend && (
        <div className="mt-3 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 uppercase tracking-wide">
              Blend suggerito per W{targetW}
            </p>
            <span className="text-xs text-brand-600 dark:text-brand-400 font-bold">
              → W{blendSuggestionW(blend)} effettivo
            </span>
          </div>

          <div className="space-y-2 mb-3">
            {blend.map((flour, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right font-bold text-brand-700 dark:text-brand-300">
                    {flour.percentage}%
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {flour.brand} {flour.name}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-medium">W{flour.w}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {blend.length > 1 && (
              <button
                onClick={handleApplyBlend}
                className="flex-1 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
              >
                Applica al blend ↑
              </button>
            )}
            <button
              onClick={() => setShowBlend(false)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
