export const DAYS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

/** Converte minuti assoluti dalla settimana → "VEN 23:30" */
export function absToLabel(absMin: number): string {
  const wrapped = ((absMin % (7 * 24 * 60)) + 7 * 24 * 60) % (7 * 24 * 60);
  const day = Math.floor(wrapped / (24 * 60));
  const hm  = wrapped % (24 * 60);
  return `${DAYS[day]} ${String(Math.floor(hm / 60)).padStart(2, '0')}:${String(hm % 60).padStart(2, '0')}`;
}

/** Calcola start/end (minuti assoluti) per ogni fase, a ritroso dall'orario di cottura.
 *  Regola speciale: se autolisi è attiva, inserisce 60 min di gap tra autolisi.end
 *  e puntata.start — rappresentano la lavorazione/impasto vero e proprio. */
export function calcSchedule(
  phases: { id: string; hours: number; active: boolean }[],
  cookingDay: number,
  cookingTime: number, // minuti dalla mezzanotte
): Record<string, { start: number; end: number }> {
  let cursor = cookingDay * 24 * 60 + cookingTime;
  const result: Record<string, { start: number; end: number }> = {};
  const activePhases = [...phases].filter(p => p.active).reverse();

  activePhases.forEach((p, idx) => {
    result[p.id] = { start: cursor - Math.round(p.hours * 60), end: cursor };
    cursor -= Math.round(p.hours * 60);

    // Dopo la puntata (andando a ritroso), se la fase precedente è l'autolisi,
    // inserisce 60 min di gap = lavorazione impasto tra fine autolisi e inizio puntata.
    const nextPhase = activePhases[idx + 1];
    if (p.id === 'puntata' && nextPhase?.id === 'autolisi') {
      cursor -= 60;
    }
  });

  return result;
}
