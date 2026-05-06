# LievitoMath

Calcolatore di impasti e fermentazione per pizza (napoletana e teglia) e pane, con timeline delle fasi, gestione lieviti e prefermenti, e stampa PDF.

**Versione**: `0.9.53` — **Mag 2026**

## Sviluppo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## PWA / cache

Il Service Worker è configurato per aggiornarsi e forzare il refresh quando è disponibile una nuova versione (per evitare UI/dati da cache vecchie).

## Lista della spesa

La “Lista della spesa” è disponibile solo in modalità **Napoletana**. Quando sono selezionate una o più pizze, la stampa “Stampa / Salva PDF” include anche la pagina 2 con “Pizze” e “Lista della spesa”.
