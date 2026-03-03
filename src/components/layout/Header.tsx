import { useTheme } from '../../hooks/useTheme';
import { APP_VERSION, APP_DATE } from '../../version';

export function Header() {
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 bg-[#B6BFE0] dark:bg-[#0A1228] border-b border-[#A19677]/25 dark:border-[#616B8F]/20 shadow-sm print-hidden">
      <div className="flex items-center gap-3">
        {/* Metti il file logo.png nella cartella /public/ del progetto */}
        <img
          src="/logo.png"
          alt="Pizzeria da Mattia"
          className="h-[110px] w-auto object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div>
          <h1
            className="text-4xl md:text-5xl text-white dark:text-brand-400 leading-none"
            style={{ fontFamily: 'Lobster, cursive' }}
          >
            LievitoMath
          </h1>
          <p className="text-[11px] text-white/80 dark:text-neutral-500 mt-0.5 tracking-wide">
            © Mattia Ianniello · v{APP_VERSION} · {APP_DATE}
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        aria-label="Cambia tema"
        className="p-2 rounded-lg text-[#616B8F] dark:text-[#A19677] hover:bg-[#A19677]/15 dark:hover:bg-[#616B8F]/15 transition-colors"
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
