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

  // --- LE 5 STAGIONI ---
  { brand: 'Le 5 Stagioni', name: 'Napoletana',   w: 280, type: '00' },
  { brand: 'Le 5 Stagioni', name: 'Pizza',        w: 320, type: '00',       notes: 'Teglia e napoletana lunga' },
  { brand: 'Le 5 Stagioni', name: 'Oro',          w: 390, type: '0',        notes: 'Prefermenti e biga' },
  { brand: 'Le 5 Stagioni', name: 'Integrale',    w: 180, type: 'integrale' },

  // --- MOLINO DALLAGIOVANNA ---
  { brand: 'Molino Dallagiovanna', name: 'ORO',   w: 370, type: '00',       notes: 'Lunghe lievitazioni' },
  { brand: 'Molino Dallagiovanna', name: 'Uniqua Blu', w: 320, type: '0',   notes: 'Polifunzionale' },

  // --- MULINO MARINO ---
  { brand: 'Mulino Marino', name: 'Tipo 1',       w: 200, type: '1',        notes: 'Macinata a pietra' },
  { brand: 'Mulino Marino', name: 'Semintegrale', w: 210, type: '1' },

  // --- GAROFALO ---
  { brand: 'Garofalo', name: 'Farina 0',          w: 290, type: '0' },
  { brand: 'Garofalo', name: 'Manitoba',          w: 400, type: 'manitoba', notes: 'Rinforzo blend' },

  // --- GENERICHE / SUPERMARKET ---
  { brand: 'Generica', name: 'Farina 00 debole',  w: 150, type: '00',       notes: 'Farine comuni supermercato' },
  { brand: 'Generica', name: 'Farina 00 media',   w: 220, type: '00' },
  { brand: 'Generica', name: 'Manitoba supermarket', w: 350, type: 'manitoba' },
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
  return `${f.brand} ${f.name}${f.type ? ` (${f.type})` : ''} — W${f.w}`;
}
