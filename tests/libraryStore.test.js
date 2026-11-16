import { describe, it, expect, vi } from 'vitest';
import { createLibraryStore, createMemoryStorage } from '../js/store/libraryStore.js';
import { STATUS } from '../js/store/constants.js';

const book = { id: '/works/OL1W', title: 'Il Hobbit', authors: ['J.R.R. Tolkien'] };

describe('libraryStore', () => {
  it('parte vuoto con obiettivo di default', () => {
    const store = createLibraryStore(createMemoryStorage());
    expect(store.getLibrary()).toEqual([]);
    expect(store.getGoal().yearly).toBe(12);
  });

  it('aggiunge un libro con stato e data di inserimento', () => {
    const store = createLibraryStore(createMemoryStorage());
    const entry = store.setStatus(book, STATUS.WANT, 1000);
    expect(entry).toMatchObject({ status: STATUS.WANT, addedAt: 1000, finishedAt: null, rating: 0 });
    expect(store.getEntry(book.id).book.title).toBe('Il Hobbit');
  });

  it('imposta finishedAt solo quando il libro è letto e lo conserva', () => {
    const store = createLibraryStore(createMemoryStorage());
    store.setStatus(book, STATUS.READING, 1000);
    expect(store.getEntry(book.id).finishedAt).toBeNull();
    store.setStatus(book, STATUS.READ, 2000);
    expect(store.getEntry(book.id).finishedAt).toBe(2000);
    store.setStatus(book, STATUS.READ, 9000);
    expect(store.getEntry(book.id).finishedAt).toBe(2000);
    store.setStatus(book, STATUS.READING, 9500);
    expect(store.getEntry(book.id).finishedAt).toBeNull();
  });

  it('rifiuta stati non validi', () => {
    const store = createLibraryStore(createMemoryStorage());
    expect(() => store.setStatus(book, 'boh')).toThrow();
  });

  it('gestisce il voto da 0 a 5 e ignora libri assenti', () => {
    const store = createLibraryStore(createMemoryStorage());
    store.setStatus(book, STATUS.READ);
    store.setRating(book.id, 4);
    expect(store.getEntry(book.id).rating).toBe(4);
    expect(() => store.setRating(book.id, 6)).toThrow();
    expect(() => store.setRating(book.id, 2.5)).toThrow();
    store.setRating('/works/NONE', 3);
    expect(store.getEntry('/works/NONE')).toBeNull();
  });

  it('rimuove un libro', () => {
    const store = createLibraryStore(createMemoryStorage());
    store.setStatus(book, STATUS.WANT);
    store.removeBook(book.id);
    expect(store.getLibrary()).toHaveLength(0);
  });

  it('valida l\'obiettivo annuale', () => {
    const store = createLibraryStore(createMemoryStorage());
    store.setYearlyGoal(20);
    expect(store.getGoal().yearly).toBe(20);
    expect(() => store.setYearlyGoal(0)).toThrow();
    expect(() => store.setYearlyGoal(1.5)).toThrow();
  });

  it('notifica gli osservatori e permette di annullare la sottoscrizione', () => {
    const store = createLibraryStore(createMemoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setStatus(book, STATUS.WANT);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.removeBook(book.id);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('salva nello storage e ricarica i dati in una nuova istanza', () => {
    const storage = createMemoryStorage();
    createLibraryStore(storage).setStatus(book, STATUS.READ, 5);
    const reloaded = createLibraryStore(storage);
    expect(reloaded.getEntry(book.id)).toMatchObject({ status: STATUS.READ, finishedAt: 5 });
  });

  it('riparte da zero se i dati salvati sono corrotti', () => {
    const storage = createMemoryStorage();
    storage.setItem('owly-reads:v1', '{non è json');
    expect(createLibraryStore(storage).getLibrary()).toEqual([]);
  });

  it('continua a funzionare se lo storage è pieno', () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); } };
    const store = createLibraryStore(storage);
    expect(() => store.setStatus(book, STATUS.WANT)).not.toThrow();
    expect(store.getLibrary()).toHaveLength(1);
  });
});
