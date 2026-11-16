import { describe, it, expect, vi } from 'vitest';
import { createBookRepository, ApiError, isAbortError } from '../js/api/bookRepository.js';

const subjectData = { work_count: 50, works: [{ key: '/works/OL1W', title: 'Uno', authors: [{ name: 'Autore' }] }] };

/** Client HTTP finto: stessa interfaccia di axios.get(), nessuna rete. */
const fakeHttp = (impl) => ({ get: vi.fn(impl) });

describe('bookRepository.getBooksBySubject', () => {
  it('chiama /subjects/{categoria}.json con limit e offset', async () => {
    const http = fakeHttp(async () => ({ data: subjectData }));
    const repo = createBookRepository(http, { pageSize: 20 });
    await repo.getBooksBySubject('Science Fiction', 2);
    const [url, config] = http.get.mock.calls[0];
    expect(url).toBe('/subjects/science_fiction.json');
    expect(config.params).toEqual({ limit: 20, offset: 20 });
  });

  it('restituisce libri normalizzati e hasMore', async () => {
    const repo = createBookRepository(fakeHttp(async () => ({ data: subjectData })), { pageSize: 20 });
    const res = await repo.getBooksBySubject('fantasy');
    expect(res.books).toEqual([{ id: '/works/OL1W', title: 'Uno', authors: ['Autore'] }]);
    expect(res.hasMore).toBe(true);
  });

  it('rifiuta una categoria vuota senza fare richieste', async () => {
    const http = fakeHttp(async () => ({ data: subjectData }));
    const repo = createBookRepository(http);
    await expect(repo.getBooksBySubject('   ')).rejects.toBeInstanceOf(ApiError);
    expect(http.get).not.toHaveBeenCalled();
  });

  it('usa la cache per la stessa richiesta', async () => {
    const http = fakeHttp(async () => ({ data: subjectData }));
    const repo = createBookRepository(http);
    await repo.getBooksBySubject('fantasy');
    await repo.getBooksBySubject('fantasy');
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('trasforma un 404 in ApiError con messaggio leggibile', async () => {
    const repo = createBookRepository(fakeHttp(async () => { throw { response: { status: 404 } }; }));
    await expect(repo.getBooksBySubject('xyz')).rejects.toMatchObject({ name: 'ApiError', status: 404 });
  });

  it('trasforma un errore di rete in ApiError con status 0', async () => {
    const repo = createBookRepository(fakeHttp(async () => { throw new Error('Network Error'); }));
    await expect(repo.getBooksBySubject('fantasy')).rejects.toMatchObject({ name: 'ApiError', status: 0 });
  });

  it('segnala le richieste annullate come AbortError', async () => {
    const repo = createBookRepository(fakeHttp(async () => { throw { code: 'ERR_CANCELED', name: 'CanceledError' }; }));
    const err = await repo.getBooksBySubject('fantasy').catch((e) => e);
    expect(isAbortError(err)).toBe(true);
  });

  it('annulla la ricerca precedente quando ne parte una nuova', async () => {
    const signals = [];
    const http = fakeHttp(async (url, { signal }) => { signals.push(signal); return { data: subjectData }; });
    const repo = createBookRepository(http);
    await repo.getBooksBySubject('fantasy');
    await repo.getBooksBySubject('history');
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });
});

describe('bookRepository.getWorkDetails (seconda chiamata)', () => {
  it('chiama la key del libro e restituisce la descrizione', async () => {
    const http = fakeHttp(async () => ({ data: { description: 'Descrizione completa', subjects: ['Fantasy'] } }));
    const repo = createBookRepository(http);
    const res = await repo.getWorkDetails('/works/OL8193508W');
    expect(http.get.mock.calls[0][0]).toBe('/works/OL8193508W.json');
    expect(res).toEqual({ description: 'Descrizione completa', subjects: ['Fantasy'] });
  });

  it('rifiuta una key non valida senza fare richieste', async () => {
    const http = fakeHttp(async () => ({ data: {} }));
    const repo = createBookRepository(http);
    await expect(repo.getWorkDetails('../../evil')).rejects.toBeInstanceOf(ApiError);
    await expect(repo.getWorkDetails(undefined)).rejects.toBeInstanceOf(ApiError);
    expect(http.get).not.toHaveBeenCalled();
  });

  it('propaga gli errori HTTP come ApiError', async () => {
    const repo = createBookRepository(fakeHttp(async () => { throw { response: { status: 500 } }; }));
    await expect(repo.getWorkDetails('/works/OL1W')).rejects.toMatchObject({ status: 500 });
  });
});
