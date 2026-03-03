export type DoughMode = 'napoletana' | 'teglia' | 'pane';

export type YeastType = 'fresh' | 'instant_dry' | 'sourdough';

export interface Flour {
  id: string;
  brand: string;
  name: string;
  w: number;
  percentage: number; // somma deve essere 100
}

export interface FermentationPhase {
  id: string;
  label: string;
  hours: number;
  temperatureCelsius: number;
  k: number;        // coefficiente fase: 1.0 puntata, 0.2 frigo, 0.6 appretto
  active: boolean;  // il frigo può essere disattivato
  locked?: boolean; // fase non disattivabile (puntata base)
  flourPercent?: number;      // solo biga/poolish: % della farina totale nel prefermento
  hydrationPercent?: number;  // solo biga/poolish: % idratazione del prefermento
}

export interface DoughState {
  mode: DoughMode;
  pieces: number;
  weightPerPiece: number; // grammi per panetto/teglia/pagnotta
  hydration: number;      // %, es. 65
  salt: number;           // % su farina, es. 2.8
  oil: number;            // % su farina, es. 2 (0 per pane)
  yeastType: YeastType;
  flours: Flour[];
  phases: FermentationPhase[];
}
