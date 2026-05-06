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
          <td style="padding:8px 10px; font-size:14px; font-weight:600; color:#222;">${item.name}</td>
          <td style="padding:8px 10px; text-align:right;">
            <span style="display:inline-block; min-width:34px; background:#ea580c; color:white; border-radius:7px; padding:3px 10px; font-size:13px; font-weight:700;">× ${item.quantity}</span>
          </td>
        </tr>`)
      .join('');

    const shoppingRows = shopping.items
      .map(([name, item], index) => `
        <tr style="background:${index % 2 === 0 ? '#f9fafb' : 'white'}; border-bottom:1px solid #f0f0f0;">
          <td style="padding:8px 10px; font-size:14px; font-weight:600; color:#222;">${name}${item.kind === 'tilde' && item.count > 1 ? ` [x${item.count}]` : ''}</td>
          <td style="padding:8px 10px; text-align:right; font-size:14px; font-weight:700; color:#ea580c;">${item.kind === 'grams' ? formatShoppingAmount(name, item.grams) : '~'}</td>
        </tr>`)
      .join('');

    el.innerHTML = `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Lobster&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>@page { size: A4 portrait; margin: 8mm 10mm; } * { box-sizing: border-box; }</style>
      <div style="font-family:'Inter',sans-serif; max-width:100%; margin:0 auto; color:#1a1a1a; font-size:11px;">
        <div style="background:linear-gradient(135deg,#ea580c,#f97316); border-radius:10px; padding:12px 16px; margin-bottom:14px; color:white; print-color-adjust:exact; -webkit-print-color-adjust:exact;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <h1 style="font-family:'Lobster',cursive; font-size:24px; margin:0; letter-spacing:0.5px; text-shadow:0 1px 3px rgba(0,0,0,0.35);">LievitoMath</h1>
            <div style="text-align:right; font-size:12px; opacity:0.85;">${date}</div>
          </div>
          <div style="margin-top:6px; font-size:13px; font-weight:600;">Lista della spesa</div>
          <div style="margin-top:4px; font-size:12px; opacity:0.85;">
            ${shopping.pizzaCount} pizze selezionate
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div style="width:4px; height:20px; background:#0ea5e9; border-radius:2px;"></div>
            <h2 style="font-size:14px; font-weight:700; color:#0ea5e9; text-transform:uppercase; letter-spacing:0.06em; margin:0;">Pizze</h2>
          </div>
          <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
            ${selectedRows || `
              <tr>
                <td style="padding:12px; font-size:13px; color:#888;">Nessuna pizza selezionata.</td>
              </tr>`}
          </table>
        </div>

        <div style="margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <div style="width:4px; height:20px; background:#ea580c; border-radius:2px;"></div>
            <h2 style="font-size:14px; font-weight:700; color:#ea580c; text-transform:uppercase; letter-spacing:0.06em; margin:0;">Lista della spesa</h2>
          </div>
          <table style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
            ${shoppingRows || `
              <tr>
                <td style="padding:12px; font-size:13px; color:#888;">Aggiungi pizze dal menù.</td>
              </tr>`}
          </table>
        </div>

        <p style="font-size:10px; color:#ccc; text-align:center; margin-top:28px; padding-top:12px; border-top:1px solid #f0f0f0;">
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
