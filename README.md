# LievitoMath

**LievitoMath** è un calcolatore avanzato per impasti lievitati pensato per **pizza verace**, **pizza in teglia** e **pane**.  
Ti aiuta a progettare la ricetta, stimare i parametri principali e soprattutto costruire una **timeline di fermentazione** chiara, modificabile e stampabile.

**Versione:** 0.9.55 — Mag 2026

## Cosa puoi fare

### Modalità impasto
- **Verace (AVPN)**: configurazione per pizza stile napoletano.
- **Teglia (metodo Bonci)**: parametri adatti a idratazioni e gestione tipiche della teglia.
- **Pane**: impostazioni dedicate (peso e workflow pane).

### Ricetta (ingredienti) e parametri
- Calcolo di:
  - **farina totale**
  - **acqua** (in base a idratazione)
  - **sale**
  - **olio EVO** (quando previsto)
  - **lievito** (fresco / secco / naturale)
- Gestione di **numero pezzi** e **peso unitario** (con stepper e inserimento manuale).

### Lieviti e prefermenti
- Supporto a:
  - **Lievito di birra fresco**
  - **Lievito secco (IDY)**
  - **Lievito naturale**: **Madre (50%)** e **Li.Co.Li (100%)**
- Prefermenti:
  - **Biga**
  - **Poolish**
- Controlli e vincoli per evitare combinazioni non coerenti.

### Timeline di fermentazione (roadmap)
- Timeline delle fasi con:
  - toggle **ON/OFF** per attivare/disattivare una fase
  - regolazione di **durata** e **temperatura**
  - calcolo degli **orari di inizio/fine** in base a una “ora obiettivo” (cooking time)
- Riepilogo di fermentazione e qualità attesa (indicazioni sintetiche).

### Stampa PDF
- **Stampa / Salva PDF** della ricetta con:
  - riepilogo ingredienti
  - riepilogo fermentazione
  - blend farine (se presente)
- **Lista della spesa** (solo modalità Verace): se attiva e se hai selezionato pizze dal menù, la stampa include anche:
  - pagina “Pizze” (quantità)
  - pagina “Lista della spesa” con **checkbox** stampabili per spuntare gli acquisti.

## PWA / cache
L’app è una **PWA**: funziona in modalità “app” e usa un Service Worker per gestire cache e aggiornamenti.  
Quando è disponibile una nuova versione, il Service Worker forza il refresh per evitare contenuti vecchi in cache.

## Sviluppo

### Installazione
```bash
npm install
```

### Dev server
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Note tecniche
- Stack: **React + TypeScript + Vite**, styling con **Tailwind**, stato con **Zustand**.
- Obiettivo: mantenere la logica di calcolo separata dalla UI, così da poter evolvere l’interfaccia senza rompere le formule.
