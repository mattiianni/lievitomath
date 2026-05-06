export interface PizzaMenuItem {
  id: string;
  name: string;
  pomodoroGrams: number;   // g per pizza
  noteIngredients: string[]; // q.b. (no olio)
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizePizzaName(name: string) {
  return name
    .replace(/\s*\((?:[^)]*?\bmenu\b[^)]*?)\)\s*$/i, '') // "… (menu)" a fine nome
    .replace(/\s*\(([^)]*?)\bmenu\b([^)]*?)\)\s*/gi, (_, a, b) => ` (${`${a}${b}`.trim()})`) // "… (bianca menu)" -> "… (bianca)"
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeWord(word: string) {
  const w = word.trim();
  if (!w) return '';
  if (w.toLowerCase() === 'mortazza') return 'mortadella';
  if (/^mortazza\b/i.test(w)) return w.replace(/^mortazza\b/i, 'mortadella');
  return w;
}

function splitNotes(notes: string) {
  return notes
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(normalizeWord)
    .filter(s => !/^olio\b/i.test(s) && !/\bolio\b/i.test(s));
}

const RAW_MENU: Array<{ name: string; pomodoro: number; notes: string }> = [
  { name: 'Margherita', pomodoro: 90, notes: 'Basilico fresco, olio extravergine' },
  { name: 'Margherita DOP', pomodoro: 90, notes: 'Basilico fresco, olio extravergine' },
  { name: 'Marinara / Romana (menu)', pomodoro: 90, notes: 'Aglio, capperi, alici, olio extravergine' },
  { name: 'Cosacca', pomodoro: 90, notes: 'Pecorino romano grattugiato, olio extravergine' },
  { name: 'Prosciutto cotto', pomodoro: 0, notes: 'Prosciutto cotto, pecorino grattugiato' },
  { name: 'Crudo e rucola', pomodoro: 90, notes: 'Prosciutto crudo, rucola' },
  { name: 'Pesto e pomodorini', pomodoro: 0, notes: 'Scamorza affumicata, pomodorini ciliegini, pesto di basilico' },
  { name: 'Diavola (menu)', pomodoro: 90, notes: 'Salame piccante' },
  { name: 'Tonno e cipolla', pomodoro: 90, notes: 'Tonno, cipolla di Tropea, olio' },
  { name: '4 formaggi (bianca menu)', pomodoro: 0, notes: 'Scamorza affumicata, gorgonzola dolce, pecorino romano' },
  { name: 'Salsiccia e stracchino', pomodoro: 90, notes: 'Salsiccia toscana, stracchino' },
  { name: 'Fiori di zucca', pomodoro: 0, notes: 'Fiori di zucca, scamorza affumicata, acciughe' },
  { name: 'Arma di Taggia', pomodoro: 0, notes: 'Olive taggiasche, pomodorini secchi' },
  { name: 'Carbonara (menu)', pomodoro: 0, notes: 'Pecorino romano, pancetta, tuorlo marinato' },
  { name: 'Nord', pomodoro: 90, notes: 'Salamino piccante, gorgonzola dolce' },
  { name: 'Italian DOP', pomodoro: 0, notes: 'Pomodori datterini, scaglie di Grana, pancetta affumicata' },
  { name: 'Mortazza e pistacchi', pomodoro: 0, notes: 'Mortadella, pistacchi, granella di pistacchi, Crema di Tartufo' },
  { name: 'Cornicione farcito speck e provola', pomodoro: 0, notes: 'Scamorza per il cornicione, provola affumicata, speck' },
  { name: 'Olive', pomodoro: 90, notes: 'Olive nere, scaglie di Parmigiano' },
];

export const MENU_PIZZAS: PizzaMenuItem[] = RAW_MENU.map(entry => ({
  id: slugify(entry.name),
  name: normalizePizzaName(entry.name.replace(/Mortazza/i, 'Mortadella')),
  pomodoroGrams: entry.pomodoro,
  noteIngredients: splitNotes(entry.notes),
}));
