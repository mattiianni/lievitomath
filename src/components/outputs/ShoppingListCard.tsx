import { useMemo, useState } from 'react';
import { SectionCard } from '../ui/SectionCard';
import { MENU_PIZZAS, type PizzaMenuItem } from '../../data/pizzasMenu';
import { useDoughStore } from '../../store/useDoughStore';
import { computeShoppingList, formatAmount } from '../../utils/shoppingList';

function formatShoppingAmount(name: string, grams: number) {
  if (name === 'Pecorino Grattugiato') return '~';
  return formatAmount(grams);
}

export function ShoppingListCard() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const selected = useDoughStore(s => s.shoppingPizzas);
  const addShoppingPizza = useDoughStore(s => s.addShoppingPizza);
  const setShoppingPizzaQuantity = useDoughStore(s => s.setShoppingPizzaQuantity);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return MENU_PIZZAS.filter(pizza => pizza.name.toLowerCase().includes(normalized));
  }, [query]);

  const shopping = useMemo(() => computeShoppingList(selected), [selected]);

  const addPizza = (pizza: PizzaMenuItem) => {
    addShoppingPizza(pizza.id);
    setQuery('');
    setMenuOpen(false);
  };

  const updateQuantity = (pizzaId: string, delta: number) => {
    const current = selected.find(item => item.id === pizzaId)?.quantity ?? 0;
    setShoppingPizzaQuantity(pizzaId, current + delta);
  };

  const handlePrint = () => {
    const el = document.getElementById('print-view');
    if (!el) return;

    const date = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
    const selectedRows = shopping.selectedRows
      .map(item => `
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:6px 8px; font-size:12.5px; font-weight:600; color:#222;">${item.name}</td>
          <td style="padding:6px 8px; text-align:right;">
            <span style="display:inline-block; min-width:34px; background:#ea580c; color:white; border-radius:6px; padding:2px 8px; font-size:12px; font-weight:700;">× ${item.quantity}</span>
          </td>
        </tr>`)
      .join('');

    const shoppingItems = shopping.items
      .map(([name, item], index) => `
        <div class="lm-item ${index % 2 === 0 ? 'lm-item-alt' : ''}">
          <span class="lm-box" aria-hidden="true"></span>
          <div class="lm-name">${name}${item.kind === 'tilde' && item.count > 1 ? ` <span class="lm-multi">[x${item.count}]</span>` : ''}</div>
          <div class="lm-amt">${item.kind === 'grams' ? formatShoppingAmount(name, item.grams) : '~'}</div>
        </div>`)
      .join('');

    el.innerHTML = `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Lobster&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 portrait; margin: 6mm 8mm; }
        * { box-sizing: border-box; }
        html, body { padding: 0; margin: 0; }
        .lm-wrap { font-family: 'Inter', sans-serif; max-width: 100%; margin: 0 auto; color: #1a1a1a; font-size: 10.5px; }
        .lm-hero { background: linear-gradient(135deg,#ea580c,#f97316); border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; color: #fff; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .lm-hero-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .lm-brand { font-family: 'Lobster', cursive; font-size: 22px; margin: 0; letter-spacing: 0.5px; text-shadow: 0 1px 3px rgba(0,0,0,0.35); }
        .lm-date { text-align: right; font-size: 11px; opacity: 0.85; }
        .lm-title { margin-top: 4px; font-size: 12.5px; font-weight: 700; }
        .lm-sub { margin-top: 2px; font-size: 11px; opacity: 0.85; }
        .lm-section { margin-bottom: 10px; }
        .lm-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
        .lm-bar { width: 4px; height: 18px; border-radius: 2px; }
        .lm-h2 { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; }
        .lm-card { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
        .lm-table { width: 100%; border-collapse: collapse; }
        .lm-empty { padding: 10px; font-size: 12px; color: #888; }

        .lm-columns { column-count: 2; column-gap: 10px; padding: 6px; }
        .lm-item { break-inside: avoid; display: grid; grid-template-columns: 20px 1fr auto; gap: 8px; align-items: center; padding: 5px 6px; border-radius: 8px; }
        .lm-item-alt { background: #f9fafb; }
        .lm-box { width: 14px; height: 14px; border: 2px solid #cbd5e1; border-radius: 3px; justify-self: center; }
        .lm-name { font-size: 12px; font-weight: 650; color: #222; }
        .lm-multi { font-weight: 800; color: #6b7280; }
        .lm-amt { font-size: 12px; font-weight: 800; color: #ea580c; white-space: nowrap; }
        .lm-footer { font-size: 9.5px; color: #bdbdbd; text-align: center; margin-top: 14px; padding-top: 8px; border-top: 1px solid #f0f0f0; }
      </style>

      <div class="lm-wrap">
        <div class="lm-hero">
          <div class="lm-hero-row">
            <h1 class="lm-brand">LievitoMath</h1>
            <div class="lm-date">${date}</div>
          </div>
          <div class="lm-title">Lista della spesa</div>
          <div class="lm-sub">${shopping.pizzaCount} pizze selezionate</div>
        </div>

        <div class="lm-section">
          <div class="lm-hdr">
            <div class="lm-bar" style="background:#0ea5e9;"></div>
            <h2 class="lm-h2" style="color:#0ea5e9;">Pizze</h2>
          </div>
          <div class="lm-card">
            <table class="lm-table">
              ${selectedRows || `
                <tr>
                  <td class="lm-empty">Nessuna pizza selezionata.</td>
                </tr>`}
            </table>
          </div>
        </div>

        <div class="lm-section">
          <div class="lm-hdr">
            <div class="lm-bar" style="background:#ea580c;"></div>
            <h2 class="lm-h2" style="color:#ea580c;">Lista della spesa</h2>
          </div>
          <div class="lm-card">
            ${shoppingItems ? `<div class="lm-columns">${shoppingItems}</div>` : `<div class="lm-empty">Aggiungi pizze dal menù.</div>`}
          </div>
        </div>

        <p class="lm-footer">
          Generato con <strong style="color:#ea580c;">LievitoMath</strong> · Lista della spesa
        </p>
      </div>
    `;

    window.print();
  };

  return (
    <SectionCard title="Lista della spesa">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Menù pizze
          </label>
          <div className="relative mt-1">
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              onFocus={() => setMenuOpen(true)}
              onBlur={() => window.setTimeout(() => setMenuOpen(false), 120)}
              placeholder="Cerca e aggiungi una pizza"
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#142044] px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:border-brand-500"
            />
            {menuOpen && filteredOptions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#142044] shadow-lg">
                {filteredOptions.map(pizza => (
                  <button
                    key={pizza.id}
                    type="button"
                    onClick={() => addPizza(pizza)}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-200 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                  >
                    {pizza.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
            Selezionate
          </p>
          {selected.length === 0 ? (
            <p className="text-sm text-neutral-400">Nessuna pizza selezionata.</p>
          ) : (
            <div className="space-y-2">
              {selected.map(item => {
                const pizza = MENU_PIZZAS.find(option => option.id === item.id);
                if (!pizza) return null;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 dark:bg-[#142044] px-3 py-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{pizza.name}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 rounded-lg bg-white dark:bg-[#0A1228] font-bold text-neutral-600 dark:text-neutral-200">−</button>
                      <span className="w-7 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 rounded-lg bg-white dark:bg-[#0A1228] font-bold text-neutral-600 dark:text-neutral-200">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
          {shopping.items.length === 0 ? (
            <p className="text-sm text-neutral-400">Aggiungi pizze dal menù.</p>
          ) : (
            <div className="space-y-1">
              {shopping.items.map(([name, item]) => (
                <div key={name} className="flex justify-between gap-3 text-sm">
                  <span className="text-neutral-600 dark:text-neutral-300">
                    {name}{item.kind === 'tilde' && item.count > 1 ? ` [x${item.count}]` : ''}
                  </span>
                  <strong className="text-neutral-800 dark:text-neutral-100">
                    {item.kind === 'grams' ? formatShoppingAmount(name, item.grams) : '~'}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          Stampa / Salva PDF
        </button>
      </div>
    </SectionCard>
  );
}
