import { create } from 'zustand';
import type { DoughState, DoughMode, YeastType, Flour, FermentationPhase } from '../types/dough';
import { getDefaultState } from '../constants/modes';

interface DoughStore {
  state: DoughState;

  userFlourBanner: string | null;
  setUserFlourBanner: (msg: string | null) => void;

  cookingDay: number;   // 0=LUN … 6=DOM
  cookingTime: number;  // minuti dalla mezzanotte (es. 1200 = 20:00)
  setCookingDay: (day: number) => void;
  setCookingTime: (time: number) => void;

  setMode: (mode: DoughMode) => void;
  setPieces: (n: number) => void;
  setWeightPerPiece: (w: number) => void;
  setHydration: (h: number) => void;
  setSalt: (s: number) => void;
  setOil: (o: number) => void;
  setYeastType: (y: YeastType) => void;
  setStaglioImmediato: (v: boolean) => void;
  setStaglioAFreddo: (v: boolean) => void;

  updatePhase: (id: string, changes: Partial<FermentationPhase>) => void;
  togglePhase: (id: string) => void;

  addFlour: () => void;
  updateFlour: (id: string, changes: Partial<Flour>) => void;
  removeFlour: (id: string) => void;
  setFlours: (flours: Omit<Flour, 'id'>[]) => void;
  normalizeFlourPercentages: () => void;

  resetToMode: (mode: DoughMode) => void;
}

export const useDoughStore = create<DoughStore>()((set) => ({
  state: getDefaultState('napoletana'),
  userFlourBanner: null,

  cookingDay:  5,     // SAB
  cookingTime: 1200,  // 20:00

  setUserFlourBanner: (msg) => set(() => ({ userFlourBanner: msg })),
  setCookingDay:  (day)  => set(() => ({ cookingDay: day })),
  setCookingTime: (time) => set(() => ({ cookingTime: time })),

  setMode: (mode) => set(s => ({ state: { ...s.state, mode } })),
  setPieces: (pieces) => set(s => ({ state: { ...s.state, pieces } })),
  setWeightPerPiece: (w) => set(s => ({ state: { ...s.state, weightPerPiece: w } })),
  setHydration: (h) => set(s => ({ state: { ...s.state, hydration: h } })),
  setSalt: (salt) => set(s => ({ state: { ...s.state, salt } })),
  setOil: (oil) => set(s => ({ state: { ...s.state, oil } })),
  setYeastType: (yeastType) => set(s => {
    // Biga non è compatibile con madre/licoli → la disattiviamo automaticamente
    const isSourdough = yeastType === 'madre' || yeastType === 'licoli';
    const phases = isSourdough
      ? s.state.phases.map(p => p.id === 'biga' ? { ...p, active: false } : p)
      : s.state.phases;
    return { state: { ...s.state, yeastType, phases } };
  }),
  setStaglioImmediato: (v) => set(s => ({ state: { ...s.state, staglioImmediato: v } })),
  setStaglioAFreddo: (v) => set(s => ({ state: { ...s.state, staglioAFreddo: v } })),

  updatePhase: (id, changes) =>
    set(s => ({
      state: {
        ...s.state,
        phases: s.state.phases.map(p => p.id === id ? { ...p, ...changes } : p),
      },
    })),

  togglePhase: (id) =>
    set(s => {
      const PREFERMENTI = ['biga', 'poolish'];
      const current = s.state.phases.find(p => p.id === id);
      const willBeActive = current ? !current.active : false;
      const phases = s.state.phases.map(p => {
        if (p.id === id && !p.locked) return { ...p, active: !p.active };
        // Attivare un prefermento → disattiva l'altro prefermento E l'autolisi
        if (PREFERMENTI.includes(id) && willBeActive) {
          if (PREFERMENTI.includes(p.id) && p.id !== id) return { ...p, active: false };
          if (p.id === 'autolisi') return { ...p, active: false };
        }
        return p;
      });
      return { state: { ...s.state, phases } };
    }),

  addFlour: () =>
    set(s => {
      const existing = s.state.flours;
      const newFlour: Flour = {
        id: crypto.randomUUID(),
        brand: '',
        name: 'Nuova farina',
        w: 260,
        percentage: 0,
      };
      const count = existing.length + 1;
      const flours = [...existing, newFlour].map(f => ({
        ...f,
        percentage: Math.round(100 / count),
      }));
      const total = flours.reduce((s, f) => s + f.percentage, 0);
      flours[flours.length - 1].percentage += 100 - total;
      return { state: { ...s.state, flours } };
    }),

  updateFlour: (id, changes) =>
    set(s => ({
      state: {
        ...s.state,
        flours: s.state.flours.map(f => f.id === id ? { ...f, ...changes } : f),
      },
    })),

  removeFlour: (id) =>
    set(s => {
      const flours = s.state.flours.filter(f => f.id !== id);
      if (flours.length === 0) return s;
      const total = flours.reduce((sum, f) => sum + f.percentage, 0);
      if (total === 0) {
        const eq = Math.round(100 / flours.length);
        const normalized = flours.map((f, i) =>
          i === flours.length - 1
            ? { ...f, percentage: 100 - eq * (flours.length - 1) }
            : { ...f, percentage: eq }
        );
        return { state: { ...s.state, flours: normalized } };
      }
      const normalized = flours.map(f => ({
        ...f,
        percentage: Math.round((f.percentage / total) * 100),
      }));
      const diff = 100 - normalized.reduce((sum, f) => sum + f.percentage, 0);
      normalized[normalized.length - 1].percentage += diff;
      return { state: { ...s.state, flours: normalized } };
    }),

  setFlours: (newFlours) =>
    set(s => ({
      state: {
        ...s.state,
        flours: newFlours.map(f => ({ ...f, id: crypto.randomUUID() })),
      },
    })),

  normalizeFlourPercentages: () =>
    set(s => {
      const flours = s.state.flours;
      if (flours.length === 0) return s;
      const eq = Math.round(100 / flours.length);
      const normalized = flours.map((f, i) =>
        i === flours.length - 1
          ? { ...f, percentage: 100 - eq * (flours.length - 1) }
          : { ...f, percentage: eq }
      );
      return { state: { ...s.state, flours: normalized } };
    }),

  resetToMode: (mode) => set(() => ({ state: getDefaultState(mode) })),
}));
