export interface KnownFlour {
  brand: string;
  name: string;
  w: number;
  type?: '00' | '0' | '1' | '2' | 'integrale' | 'farro' | 'manitoba' | 'semola' | 'altro';
  notes?: string;
}

// Database farine note — aggiungere nuove marche/W nel tempo
export const KNOWN_FLOURS: KnownFlour[] = [
  // --- CAPUTO ---
  { brand: 'Caputo', name: 'Pizzeria (Blu)',      w: 260, type: '00',       notes: 'Napoletana, lievitazione 6-8h TA' },
  { brand: 'Caputo', name: 'Cuoco',               w: 300, type: '00',       notes: 'Lievitazione 8-16h' },
  { brand: 'Caputo', name: 'Nuvola',              w: 270, type: '0',        notes: 'Napoletana, alta estensibilità' },
  { brand: 'Caputo', name: 'Nuvola Super',        w: 320, type: '0',        notes: 'Lunga lievitazione, alta idratazione' },
  { brand: 'Caputo', name: 'Rossa',               w: 330, type: '00',       notes: 'Lunghe lievitazioni, teglia' },
  { brand: 'Caputo', name: 'Criscito (Manitoba)', w: 380, type: 'manitoba', notes: 'Rinforzo blend, max 30%' },
  { brand: 'Caputo', name: 'Fioreglut (gluten free)', w: 0, type: 'altro',  notes: 'Senza glutine, W non applicabile' },

  // --- COOP ---
  { brand: 'Coop', name: 'Farina 00',             w: 150, type: '00',       notes: 'W 140-160, biscotti e dolci' },
  { brand: 'Coop', name: 'Farina 0',              w: 225, type: '0',        notes: 'W 200-250, pane e pizza base' },
  { brand: 'Coop', name: 'Farina Tipo 1',         w: 200, type: '1',        notes: 'W 180-220, pane e lievitati base' },
  { brand: 'Coop', name: 'Farina Tipo 2',         w: 200, type: '2',        notes: 'W 180-220, pane e focacce' },
  { brand: 'Coop', name: 'Manitoba 0',            w: 325, type: 'manitoba', notes: 'W 300-350, pizza lunga e dolci lievitati' },

  // --- PETRA (Molino Quaglia) ---
  { brand: 'Petra', name: '1',                    w: 300, type: '1',        notes: 'W stimato da prot. 14% (non dichiarato). Pane, dolci lievitati.' },
  { brand: 'Petra', name: '9',                    w: 310, type: '0',        notes: 'W stimato da prot. 14.4% (non dichiarato). Pizza media-lunga lievitazione.' },
  { brand: 'Petra', name: '5063',                 w: 270, type: '00',       notes: 'W 260-280. Pizza e pane diretti.' },
  { brand: 'Petra', name: '0102HP',               w: 330, type: '1',        notes: 'Tipo 1, parzialmente da grano germogliato. W 320-340, P/L 0.55-0.65. Pizza e pane 24-48h (anche frigo).' },
  { brand: 'Petra', name: '5072',                 w: 330, type: '0',        notes: 'W 320-340. Pizza e pane lunga lievitazione.' },
  { brand: 'Petra', name: '5078 (Più Snella)',    w: 365, type: '0',        notes: 'W 350-380. Pizza molto idratata, teglia.' },
  { brand: 'Petra', name: '6384',                 w: 380, type: 'altro',    notes: 'W 370-390. Panettone, pandoro, colombe.' },
  { brand: 'Petra', name: '3',                    w: 300, type: '1',        notes: 'Tipo 1 macinata a pietra (Augmented Stone Milling), ricca di fibre. W non dichiarato (fibra): valore indicativo per calcoli. Idro medie 55-75%.' },

  // --- GENERICHE ---
  { brand: 'Generica', name: 'Farina 00 debole',  w: 150, type: '00',       notes: 'Farine comuni supermercato' },
  { brand: 'Generica', name: 'Farina 00 media',   w: 220, type: '00' },
  { brand: 'Generica', name: 'Farina 0',          w: 240, type: '0' },
  { brand: 'Generica', name: 'Farina Tipo 1',     w: 200, type: '1',        notes: 'Semi-integrale, W approssimativo' },
  { brand: 'Generica', name: 'Farina Tipo 2',     w: 170, type: '2',        notes: 'Quasi integrale, W approssimativo' },
  { brand: 'Generica', name: 'Manitoba',          w: 350, type: 'manitoba' },
  { brand: 'Generica', name: 'Semola rimacinata', w: 180, type: 'semola' },
  { brand: 'Generica', name: 'Farro integrale',   w: 100, type: 'farro',    notes: 'W approssimativo' },
];

// Raggruppa per brand per uso nei dropdown
export function getFloursByBrand(): Record<string, KnownFlour[]> {
  return KNOWN_FLOURS.reduce((acc, flour) => {
    if (!acc[flour.brand]) acc[flour.brand] = [];
    acc[flour.brand].push(flour);
    return acc;
  }, {} as Record<string, KnownFlour[]>);
}

// Etichetta display completa
export function flourLabel(f: KnownFlour): string {
  const wLabel = f.w > 0 ? `W${f.w}` : 'W n/d';
  return `${f.brand} ${f.name}${f.type ? ` (${f.type})` : ''} — ${wLabel}`;
}
