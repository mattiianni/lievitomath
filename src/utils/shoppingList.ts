import { MENU_PIZZAS } from '../data/pizzasMenu';

export type ShoppingPizzaSelection = { id: string; quantity: number };

export type ShoppingItem =
  | { kind: 'grams'; grams: number }
  | { kind: 'tilde'; count: number };

function normalizeIngredientName(input: string) {
  const name = input.trim();
  if (!name) return '';

  const titleCase = (value: string) =>
    value
      .split(/\s+/g)
      .map(word => {
        const w = word.trim();
        if (!w) return '';
        if (w === w.toUpperCase() && /[A-Z]/.test(w)) return w; // acronimi tipo DOP
        const first = w[0]?.toUpperCase() ?? '';
        const rest = w.slice(1).toLowerCase();
        return `${first}${rest}`;
      })
      .filter(Boolean)
      .join(' ');

  // In lista della spesa lo vogliamo sempre come "Pecorino Grattugiato"
  if (/^pecorino\b/i.test(name)) return 'Pecorino Grattugiato';
  if (/^mortadella\b/i.test(name)) return 'Mortadella';
  if (/^prosciutto cotto\b/i.test(name)) return 'Prosciutto Cotto';
  if (/^prosciutto crudo\b/i.test(name)) return 'Prosciutto Crudo';
  if (/^(?:salame|salamino)\s+piccante\b/i.test(name)) return 'Salamino Piccante';
  if (/^speck\b/i.test(name)) return 'Speck';
  if (/^pancetta\b/i.test(name)) return 'Pancetta';
  return titleCase(name);
}

function isAffettato(name: string) {
  return [
    'Mortadella',
    'Prosciutto Cotto',
    'Prosciutto Crudo',
    'Salamino Piccante',
    'Speck',
    'Pancetta',
  ].includes(name);
}

function addTilde(totals: Record<string, ShoppingItem>, name: string, countDelta: number) {
  const existing = totals[name];
  if (!existing) {
    totals[name] = { kind: 'tilde', count: countDelta };
    return;
  }
  if (existing.kind === 'tilde') {
    totals[name] = { kind: 'tilde', count: existing.count + countDelta };
  }
}

export function computeShoppingList(selection: ShoppingPizzaSelection[]) {
  const selected = selection.filter(p => p.quantity > 0);
  const pizzaCount = selected.reduce((sum, item) => sum + item.quantity, 0);
  const margheritaDopCount = selected.reduce((sum, item) => {
    if (item.id === 'margherita-dop') return sum + item.quantity;
    return sum;
  }, 0);

  const totals: Record<string, ShoppingItem> = {};
  if (pizzaCount > 0) {
    const fiorDiLatteCount = Math.max(0, pizzaCount - margheritaDopCount);
    if (fiorDiLatteCount > 0) totals['Mozzarella Fior Di Latte'] = { kind: 'grams', grams: fiorDiLatteCount * 90 };
    if (margheritaDopCount > 0) totals['Mozzarella Di Bufala'] = { kind: 'grams', grams: margheritaDopCount * 90 };

    // Pecorino sempre presente in lista della spesa (q.b.) e con conteggio per numero pizze
    addTilde(totals, 'Pecorino Grattugiato', pizzaCount);
  }

  selected.forEach(item => {
    const pizza = MENU_PIZZAS.find(option => option.id === item.id);
    if (!pizza) return;

    if (pizza.pomodoroGrams > 0) {
      const existing = totals['Pomodoro'];
      const current = existing && existing.kind === 'grams' ? existing.grams : 0;
      totals['Pomodoro'] = { kind: 'grams', grams: current + pizza.pomodoroGrams * item.quantity };
    }

    pizza.noteIngredients.forEach(name => {
      const normalized = normalizeIngredientName(name);
      if (!normalized) return;

      if (isAffettato(normalized)) {
        const existing = totals[normalized];
        const current = existing && existing.kind === 'grams' ? existing.grams : 0;
        totals[normalized] = { kind: 'grams', grams: current + item.quantity * 90 };
        return;
      }

      addTilde(totals, normalized, item.quantity);
    });
  });

  const items = Object.entries(totals).sort(([a], [b]) => a.localeCompare(b));
  const selectedRows = selected
    .map(item => {
      const pizza = MENU_PIZZAS.find(option => option.id === item.id);
      if (!pizza) return null;
      return { name: pizza.name, quantity: item.quantity };
    })
    .filter(Boolean) as Array<{ name: string; quantity: number }>;

  return { pizzaCount, items, selectedRows };
}

export function formatAmount(grams: number) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg`;
  if (grams < 10 && grams % 1 !== 0) return `${grams.toFixed(1)} g`;
  return `${Math.round(grams)} g`;
}
