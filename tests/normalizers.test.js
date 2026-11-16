import { describe, it, expect } from 'vitest';
import { normalizeSubject, normalizeWork, normalizeSubjectResponse, normalizeWorkDetails } from '../js/api/normalizers.js';

describe('normalizeSubject', () => {
  it('mette in minuscolo e sostituisce gli spazi con underscore', () => {
    expect(normalizeSubject('Science Fiction')).toBe('science_fiction');
  });
  it('rimuove gli spazi esterni e collassa quelli multipli', () => {
    expect(normalizeSubject('  love   stories ')).toBe('love_stories');
  });
  it('gestisce valori vuoti o non stringa', () => {
    expect(normalizeSubject('')).toBe('');
    expect(normalizeSubject(undefined)).toBe('');
    expect(normalizeSubject(null)).toBe('');
  });
});

describe('normalizeWork', () => {
  it('estrae id, titolo e nomi degli autori', () => {
    const work = { key: '/works/OL8193508W', title: "Alice's Adventures in Wonderland", authors: [{ name: 'Lewis Carroll', key: '/authors/OL22098A' }] };
    expect(normalizeWork(work)).toEqual({ id: '/works/OL8193508W', title: "Alice's Adventures in Wonderland", authors: ['Lewis Carroll'] });
  });
  it('non si rompe se mancano autori o titolo', () => {
    expect(normalizeWork({ key: '/works/OL1W' })).toEqual({ id: '/works/OL1W', title: 'Senza titolo', authors: [] });
  });
  it('scarta gli autori senza nome', () => {
    expect(normalizeWork({ key: '/works/OL1W', title: 'X', authors: [{ name: 'A' }, {}, { name: '' }] }).authors).toEqual(['A']);
  });
});

describe('normalizeSubjectResponse', () => {
  const data = { work_count: 45, works: [{ key: '/works/OL1W', title: 'Uno', authors: [] }, { key: '/works/OL2W', title: 'Due' }] };
  it('calcola hasMore dalla paginazione', () => {
    expect(normalizeSubjectResponse(data, { offset: 0, pageSize: 20 }).hasMore).toBe(true);
    expect(normalizeSubjectResponse(data, { offset: 40, pageSize: 20 }).hasMore).toBe(false);
  });
  it('restituisce libri e totale', () => {
    const res = normalizeSubjectResponse(data, { offset: 0, pageSize: 20 });
    expect(res.total).toBe(45);
    expect(res.books).toHaveLength(2);
  });
  it('gestisce una risposta vuota', () => {
    expect(normalizeSubjectResponse({}, { offset: 0, pageSize: 20 })).toEqual({ books: [], total: 0, hasMore: false });
  });
});

describe('normalizeWorkDetails', () => {
  it('legge la descrizione se è una stringa', () => {
    expect(normalizeWorkDetails({ description: 'Una storia.' }).description).toBe('Una storia.');
  });
  it('legge la descrizione se è un oggetto { type, value }', () => {
    expect(normalizeWorkDetails({ description: { type: '/type/text', value: 'Valore' } }).description).toBe('Valore');
  });
  it('toglie la sezione "fonti" aggiunta da Open Library', () => {
    expect(normalizeWorkDetails({ description: 'Testo.\n\n----------\nContains: altro' }).description).toBe('Testo.');
  });
  it('restituisce stringa vuota senza descrizione e limita i soggetti a 8', () => {
    const res = normalizeWorkDetails({ subjects: Array.from({ length: 12 }, (_, i) => `s${i}`) });
    expect(res.description).toBe('');
    expect(res.subjects).toHaveLength(8);
  });
});
