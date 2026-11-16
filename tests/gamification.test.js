import { describe, it, expect } from 'vitest';
import { computeStats, evaluateBadges, goalProgress, BADGES } from '../js/domain/gamification.js';
import { STATUS } from '../js/store/constants.js';

const NOW = new Date('2026-06-15T12:00:00Z');
const entry = (status, { authors = ['A'], rating = 0, finishedAt = null } = {}) => ({ status, rating, finishedAt, book: { id: Math.random().toString(), title: 't', authors } });
const ts = (iso) => new Date(iso).getTime();

describe('computeStats', () => {
  it('conta correttamente per stato', () => {
    const lib = [entry(STATUS.WANT), entry(STATUS.READING), entry(STATUS.READ, { finishedAt: ts('2026-03-01') })];
    expect(computeStats(lib, NOW)).toMatchObject({ total: 3, want: 1, reading: 1, read: 1 });
  });

  it("conta come 'letti quest'anno' solo i libri finiti nell'anno corrente", () => {
    const lib = [
      entry(STATUS.READ, { finishedAt: ts('2026-01-10') }),
      entry(STATUS.READ, { finishedAt: ts('2025-12-31') }),
    ];
    const stats = computeStats(lib, NOW);
    expect(stats.read).toBe(2);
    expect(stats.readThisYear).toBe(1);
  });

  it('conta gli autori distinti dei soli libri letti e i libri votati', () => {
    const lib = [
      entry(STATUS.READ, { authors: ['A', 'B'], rating: 5, finishedAt: ts('2026-02-01') }),
      entry(STATUS.READ, { authors: ['B', 'C'], rating: 3, finishedAt: ts('2026-02-02') }),
      entry(STATUS.WANT, { authors: ['Z'] }),
    ];
    const stats = computeStats(lib, NOW);
    expect(stats.authors).toBe(3);
    expect(stats.rated).toBe(2);
  });

  it('funziona con libreria vuota', () => {
    expect(computeStats([], NOW)).toEqual({ total: 0, read: 0, reading: 0, want: 0, rated: 0, readThisYear: 0, authors: 0 });
  });
});

describe('goalProgress', () => {
  it('calcola la percentuale arrotondata', () => {
    expect(goalProgress({ readThisYear: 1 }, 3)).toBe(33);
    expect(goalProgress({ readThisYear: 6 }, 12)).toBe(50);
  });
  it('non supera il 100%', () => {
    expect(goalProgress({ readThisYear: 20 }, 12)).toBe(100);
  });
  it('restituisce 0 se l\'obiettivo non è valido', () => {
    expect(goalProgress({ readThisYear: 5 }, 0)).toBe(0);
  });
});

describe('evaluateBadges', () => {
  const unlocked = (stats, goal = 12) => evaluateBadges(stats, goal).filter((b) => b.unlocked).map((b) => b.id);
  const base = { total: 0, read: 0, reading: 0, want: 0, rated: 0, readThisYear: 0, authors: 0 };

  it('non sblocca nulla con statistiche a zero', () => {
    expect(unlocked(base)).toEqual([]);
  });
  it('sblocca i badge sulle soglie esatte', () => {
    expect(unlocked({ ...base, total: 1 })).toEqual(['first']);
    expect(unlocked({ ...base, total: 5, read: 5 })).toEqual(expect.arrayContaining(['first', 'read1', 'read5']));
    expect(unlocked({ ...base, rated: 3 })).toContain('rater');
    expect(unlocked({ ...base, authors: 3 })).toContain('explorer');
  });
  it("sblocca 'obiettivo raggiunto' solo se il traguardo è completato", () => {
    expect(unlocked({ ...base, readThisYear: 11 }, 12)).not.toContain('goal');
    expect(unlocked({ ...base, readThisYear: 12 }, 12)).toContain('goal');
  });
  it('restituisce tutti i badge con id unici', () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(evaluateBadges(base, 12)).toHaveLength(BADGES.length);
  });
});
