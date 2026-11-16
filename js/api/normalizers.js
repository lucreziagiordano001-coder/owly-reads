// normalizers.js — funzioni pure che trasformano le risposte di Open Library
// nel formato interno dell'app. _.get protegge da campi mancanti o null.
import { get } from 'lodash-es';

/** "Science Fiction " -> "science_fiction" (formato richiesto da /subjects/{subject}.json). */
export const normalizeSubject = (text) => String(text ?? '').trim().toLowerCase().replace(/\s+/g, '_');

/** Un elemento di `works` della risposta /subjects/{subject}.json. */
export function normalizeWork(work) {
  return {
    id: get(work, 'key', ''),
    title: get(work, 'title') || 'Senza titolo',
    authors: (get(work, 'authors') ?? []).map((a) => get(a, 'name')).filter(Boolean),
  };
}

export function normalizeSubjectResponse(data, { offset, pageSize }) {
  const total = get(data, 'work_count', 0);
  return {
    books: (get(data, 'works') ?? []).map(normalizeWork),
    total,
    hasMore: offset + pageSize < total,
  };
}

/** Risposta di /works/{id}.json: la descrizione può essere una stringa o { type, value }. */
export function normalizeWorkDetails(data) {
  const raw = get(data, 'description');
  const text = (typeof raw === 'string' ? raw : get(raw, 'value')) ?? '';
  return {
    description: text.split('\n\n----------')[0].trim(), // toglie le sezioni "fonti" aggiunte da Open Library
    subjects: (get(data, 'subjects') ?? []).slice(0, 8),
  };
}
