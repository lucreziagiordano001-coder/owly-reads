// gamification.js — statistiche, obiettivo e badge (funzioni pure, facili da testare)
import { STATUS } from '../store/constants.js';

export const BADGES = [
  { id: 'first', icon: '🌱', name: 'Primo passo', desc: 'Aggiungi il primo libro', test: (s) => s.total >= 1 },
  { id: 'read1', icon: '📖', name: 'Prima lettura', desc: 'Termina un libro', test: (s) => s.read >= 1 },
  { id: 'read5', icon: '🦉', name: 'Gufo curioso', desc: 'Termina 5 libri', test: (s) => s.read >= 5 },
  { id: 'read10', icon: '🏆', name: 'Divoratore di libri', desc: 'Termina 10 libri', test: (s) => s.read >= 10 },
  { id: 'rater', icon: '⭐', name: 'Critico', desc: 'Dai un voto a 3 libri', test: (s) => s.rated >= 3 },
  { id: 'explorer', icon: '🧭', name: 'Esploratore', desc: 'Leggi libri di 3 autori diversi', test: (s) => s.authors >= 3 },
  { id: 'goal', icon: '🎯', name: 'Obiettivo raggiunto', desc: "Completa l'obiettivo annuale", test: (s, goal) => goal > 0 && s.readThisYear >= goal },
];

export function computeStats(library, now = new Date()) {
  const year = now.getFullYear();
  const read = library.filter((e) => e.status === STATUS.READ);
  return {
    total: library.length,
    read: read.length,
    reading: library.filter((e) => e.status === STATUS.READING).length,
    want: library.filter((e) => e.status === STATUS.WANT).length,
    rated: library.filter((e) => e.rating > 0).length,
    readThisYear: read.filter((e) => new Date(e.finishedAt).getFullYear() === year).length,
    authors: new Set(read.flatMap((e) => e.book.authors)).size,
  };
}

export const evaluateBadges = (stats, goal) => BADGES.map((b) => ({ ...b, unlocked: b.test(stats, goal) }));

export const goalProgress = (stats, goal) =>
  goal > 0 ? Math.min(100, Math.round((stats.readThisYear / goal) * 100)) : 0;
