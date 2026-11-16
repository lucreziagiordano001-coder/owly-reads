// components.js — pezzi di interfaccia riutilizzabili
import { el } from './dom.js';
import { STATUS_LABEL } from '../store/constants.js';

export const authorsText = (authors) => (authors?.length ? authors.join(', ') : 'Autore sconosciuto');

/** Card di un libro: titolo (cliccabile) e autori. L'etichetta di stato compare solo se si passa `entry` (vista Libreria). */
export function bookCard(book, entry = null) {
  return el('article', { class: 'card' },
    el('div', { class: 'card-body' },
      el('h3', { class: 'card-title' },
        el('button', { class: 'card-title-btn', type: 'button', dataset: { id: book.id }, 'aria-haspopup': 'dialog' }, book.title)),
      el('p', { class: 'card-meta' }, authorsText(book.authors)),
      entry && el('span', { class: `status-pill ${entry.status}` }, STATUS_LABEL[entry.status])));
}

export const renderBooks = (container, books) => container.replaceChildren(...books.map((b) => bookCard(b)));
export const appendBooks = (container, books) => container.append(...books.map((b) => bookCard(b)));

export function renderSkeleton(container, n = 6) {
  container.replaceChildren(...Array.from({ length: n }, () => el('div', { class: 'skeleton', 'aria-hidden': 'true' })));
}

export const renderMessage = (container, text, kind = 'empty') =>
  container.replaceChildren(el('p', { class: kind, role: kind === 'error' ? 'alert' : null }, text));

export function renderChips(container, items, activeValue, onPick) {
  container.replaceChildren(...items.map(({ value, label }) =>
    el('button', { class: 'chip', type: 'button', 'aria-pressed': String(value === activeValue), onClick: () => onPick(value) }, label)));
}
