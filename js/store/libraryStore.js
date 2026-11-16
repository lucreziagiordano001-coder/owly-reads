// libraryStore.js — DESIGN PATTERN: Observer (subscribe/notify) con storage iniettato.
// Lo stato della libreria vive qui; la UI si registra con subscribe() e si
// ridisegna quando cambia. Lo storage è un parametro, quindi nei test si usa
// una memoria finta al posto di localStorage.
import { STATUS } from './constants.js';

const KEY = 'owly-reads:v1';
const VALID_STATUS = new Set(Object.values(STATUS));

/** Storage in memoria: fallback se localStorage non è disponibile e doppione per i test. */
export function createMemoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

export function getBrowserStorage() {
  try {
    const s = window.localStorage;
    s.setItem('__t', '1');
    s.removeItem('__t');
    return s;
  } catch {
    return createMemoryStorage();
  }
}

export function createLibraryStore(storage) {
  const defaults = () => ({ library: {}, goal: { yearly: 12 } });

  function load() {
    try {
      const raw = JSON.parse(storage.getItem(KEY));
      if (!raw || typeof raw !== 'object') return defaults();
      return { ...defaults(), ...raw };
    } catch {
      return defaults(); // JSON corrotto: si riparte da zero
    }
  }

  let state = load();
  const listeners = new Set();

  function commit(next) {
    state = next;
    try {
      storage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota piena: l'app continua in memoria */
    }
    listeners.forEach((fn) => fn(state));
  }

  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getLibrary: () => Object.values(state.library),
    getEntry: (id) => state.library[id] ?? null,
    getGoal: () => state.goal,

    setStatus(book, status, now = Date.now()) {
      if (!VALID_STATUS.has(status)) throw new Error(`Stato non valido: ${status}`);
      const prev = state.library[book.id];
      const entry = {
        book: { id: book.id, title: book.title, authors: book.authors },
        status,
        rating: prev?.rating ?? 0,
        addedAt: prev?.addedAt ?? now,
        finishedAt: status === STATUS.READ ? prev?.finishedAt ?? now : null,
      };
      commit({ ...state, library: { ...state.library, [book.id]: entry } });
      return entry;
    },

    setRating(id, rating) {
      if (!Number.isInteger(rating) || rating < 0 || rating > 5) throw new Error('Il voto deve essere tra 0 e 5');
      if (!state.library[id]) return;
      commit({ ...state, library: { ...state.library, [id]: { ...state.library[id], rating } } });
    },

    removeBook(id) {
      if (!state.library[id]) return;
      const { [id]: _removed, ...rest } = state.library;
      commit({ ...state, library: rest });
    },

    setYearlyGoal(n) {
      if (!Number.isInteger(n) || n < 1) throw new Error("L'obiettivo deve essere un intero positivo");
      commit({ ...state, goal: { ...state.goal, yearly: n } });
    },
  };
}
