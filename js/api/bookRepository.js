// bookRepository.js — DESIGN PATTERN: Repository + Dependency Injection.
// La UI chiede "libri per categoria" / "dettagli di un libro" senza sapere nulla
// di URL, Axios, paginazione o formato delle risposte. Il client HTTP viene
// iniettato, quindi nei test si usa un client finto e non serve la rete.
import { normalizeSubject, normalizeSubjectResponse, normalizeWorkDetails } from './normalizers.js';

export const PAGE_SIZE = 20;
const WORK_KEY = /^\/works\/OL\d+W$/;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const isAbortError = (err) => err?.name === 'AbortError';

function toError(err) {
  if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || err?.name === 'AbortError') {
    return Object.assign(new Error('Richiesta annullata'), { name: 'AbortError' });
  }
  const status = err?.response?.status;
  if (status === 404) return new ApiError('Nessun risultato trovato.', 404);
  if (status) return new ApiError(`Open Library ha risposto con errore ${status}.`, status);
  return new ApiError('Impossibile contattare Open Library. Controlla la connessione.', 0);
}

export function createBookRepository(http, { pageSize = PAGE_SIZE } = {}) {
  const cache = new Map();
  let controller = null;

  async function request(path, params, { cancelPrevious = false } = {}) {
    const key = `${path}?${JSON.stringify(params ?? {})}`;
    if (cache.has(key)) return cache.get(key);

    let signal;
    if (cancelPrevious) {
      controller?.abort();
      controller = new AbortController();
      signal = controller.signal;
    }
    try {
      const res = await http.get(path, { params, signal });
      cache.set(key, res.data);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  }

  return {
    /** GET /subjects/{subject}.json — libri di una categoria (titolo e autori). */
    async getBooksBySubject(subject, page = 1) {
      const name = normalizeSubject(subject);
      if (!name) throw new ApiError('Inserisci una categoria.');
      const offset = (page - 1) * pageSize;
      const data = await request(`/subjects/${encodeURIComponent(name)}.json`, { limit: pageSize, offset }, { cancelPrevious: true });
      return normalizeSubjectResponse(data, { offset, pageSize });
    },

    /** GET /works/OL…W.json — descrizione completa del libro (seconda chiamata). */
    async getWorkDetails(workKey) {
      if (!WORK_KEY.test(workKey ?? '')) throw new ApiError('Identificativo del libro non valido.');
      return normalizeWorkDetails(await request(`${workKey}.json`));
    },
  };
}
