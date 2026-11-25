# 🦉 Owly Reads

Applicazione web che incentiva la lettura: scegli una **categoria** di libri (per esempio *fantasy*), sfoglia i titoli e i loro autori, leggi la **descrizione completa** e costruisci la tua libreria personale con obiettivi e badge.

Progetto del corso **JavaScript Advanced** — sviluppato come parte del team di Owly, piattaforma SaaS per l'educazione nella scuola primaria. I dati arrivano dalle API di [Open Library](https://openlibrary.org/dev/docs/api/subjects).

**👉 [Prova Owly Reads online](https://owly-reads.netlify.app)**

## ✨ Funzionalità

**Requisiti della traccia**
- Campo di ricerca in stile Google per inserire una categoria (`fantasy`, `science fiction`, …).
- Richiesta a `https://openlibrary.org/subjects/{categoria}.json` e elenco dei libri con **solo titolo e autori**.
- Click sul titolo: seconda richiesta a `/works/{key}.json` (la `key` arriva dalla risposta precedente) e visualizzazione della **descrizione completa**.

**Extra**
- Paginazione con "Carica altri libri", suggerimenti di categorie, indicatori di caricamento e gestione degli errori (rete, categoria inesistente, descrizione mancante).
- **La mia libreria**: segna i libri come *Da leggere*, *In lettura*, *Letto* e assegna un voto da 1 a 5 (salvataggio in `localStorage`).
- **Obiettivi**: obiettivo annuale di libri letti, statistiche e 7 badge da sbloccare.
- Accessibilità: skip-link, ruoli ARIA, focus visibile, supporto a `prefers-reduced-motion` e tema chiaro/scuro.

## 🛠️ Tecnologie

| Strumento | Uso |
|-----------|-----|
| JavaScript ES6+ (moduli ES) | Tutto il codice dell'applicazione |
| [Vite](https://vite.dev) | Dev server e bundling (build di produzione) |
| [Vitest](https://vitest.dev) | Unit test |
| [Axios](https://axios-http.com) | Chiamate HTTP verso Open Library |
| [Lodash](https://lodash.com) (`lodash-es`) | `_.get()` per leggere in sicurezza le risposte dell'API |
| Netlify | Hosting |

## 🏗️ Architettura e design pattern

Il codice separa le responsabilità in modo che la logica sia testabile senza browser né rete.

- **Repository + Dependency Injection** (`js/api/bookRepository.js`)
  *Problema:* la UI non deve conoscere URL, Axios, paginazione o formato delle risposte.
  *Soluzione:* il repository espone `getBooksBySubject()` e `getWorkDetails()` e restituisce oggetti già normalizzati. Il client HTTP è iniettato: nei test si usa un client finto, in produzione Axios (`js/api/httpClient.js`, l'unico file che importa Axios).
- **Observer** (`js/store/libraryStore.js`)
  *Problema:* più parti dell'interfaccia (contatore, libreria, obiettivi) devono aggiornarsi quando cambia la libreria.
  *Soluzione:* lo store espone `subscribe()` e notifica gli osservatori a ogni modifica. Anche lo storage è iniettato, quindi nei test si usa una memoria finta al posto di `localStorage`.
- **Funzioni pure** (`js/api/normalizers.js`, `js/domain/gamification.js`): trasformazioni dei dati e calcoli di statistiche, obiettivi e badge, senza effetti collaterali.
- **Composition root** (`js/main.js`): crea repository e store e li collega all'interfaccia.

### Struttura delle cartelle

```
owly-reads/
├── index.html            # tutto il markup
├── css/style.css         # stili
├── img/owl.svg           # immagini e icona
├── js/
│   ├── main.js           # punto di ingresso
│   ├── api/              # httpClient, bookRepository, normalizers
│   ├── store/            # libraryStore, costanti
│   ├── domain/           # gamification (statistiche, badge, obiettivo)
│   └── ui/               # rendering (dom, components, dialog, views)
├── tests/                # test Vitest
├── vite.config.js
├── netlify.toml
└── package.json
```

## 🚀 Avvio del progetto

Requisiti: Node.js 20+ e npm.

```bash
npm install        # installa le dipendenze
npm run dev        # server di sviluppo (http://localhost:5173)
npm run build      # build di produzione nella cartella dist/
npm run preview    # anteprima della build
npm test           # esegue i test una volta
npm run test:watch # test in modalità watch
```

## ✅ Test

I test (Vitest, cartella `tests/`) coprono le funzioni critiche di calcolo e gestione dei dati:

- `normalizers.test.js` — normalizzazione della categoria, estrazione di titoli/autori/descrizione, campi mancanti o `null`.
- `bookRepository.test.js` — URL e parametri delle due chiamate, cache, annullamento delle ricerche superate, errori 404/500/rete, chiavi non valide (con client HTTP finto).
- `libraryStore.test.js` — stati, data di fine lettura, voti, obiettivo, notifiche agli osservatori, persistenza, dati corrotti, storage pieno.
- `gamification.test.js` — statistiche, percentuale dell'obiettivo, soglie dei badge.

## ☁️ Deploy

Il sito è pubblicato su Netlify con le impostazioni di `netlify.toml` (comando `npm run build`, cartella `dist`). Per ripubblicarlo: collega il repository GitHub a Netlify oppure carica la cartella `dist/` dopo `npm run build`.

## 📝 Note di sviluppo

- Le categorie vanno scritte **in inglese**, come le conosce Open Library; gli spazi diventano underscore (`science fiction` → `science_fiction`).
- L'API dei subjects di Open Library è indicata come sperimentale e potrebbe cambiare. Documentazione: [Subjects API](https://openlibrary.org/dev/docs/api/subjects).
- I dati dell'utente restano nel browser (`localStorage`): non c'è alcun backend.

Dati forniti da [Open Library](https://openlibrary.org) · [Documentazione delle API](https://openlibrary.org/dev/docs/api/subjects).
