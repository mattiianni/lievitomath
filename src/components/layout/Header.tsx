import { useTheme } from '../../hooks/useTheme';
import { APP_VERSION, APP_DATE } from '../../version';

export function Header() {
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm print-hidden">
      <div className="flex items-center gap-3">
        {/* Metti il file logo.png nella cartella /public/ del progetto */}
        <img
          src="/logo.png"
          alt="Pizzeria da Mattia"
          className="h-[90px] w-auto object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div>
          <h1
            className="text-3xl md:text-4xl text-brand-600 dark:text-brand-400 leading-none"
            style={{ fontFamily: 'Lobster, cursive' }}
          >
            LievitoMath
          </h1>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 tracking-wide">
            © Mattia Ianniello · v{APP_VERSION} · {APP_DATE}
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        aria-label="Cambia tema"
        className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        {dark ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
        )}
      </button>
    </header>
  );
}
