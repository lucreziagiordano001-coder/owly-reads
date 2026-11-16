// dialog.js — finestra con i dettagli di un libro
import { $, el } from './dom.js';
import { authorsText } from './components.js';
import { STATUS, STATUS_LABEL } from '../store/constants.js';

/**
 * Apre la finestra e restituisce un controller per riempirla quando arriva
 * la descrizione. handlers.onStatus(status) e onRating(n) aggiornano lo store;
 * onStatus restituisce la nuova voce di libreria (o null se il libro è stato rimosso).
 */
export function openDialog(book, entry, handlers) {
  const dialog = $('#book-dialog');
  const body = el('p', { class: 'dialog-desc', 'aria-busy': 'true' }, 'Caricamento descrizione…');
  const tags = el('ul', { class: 'tags' });

  const ratingSelect = el('select', { id: 'dlg-rating', disabled: !entry, onChange: (e) => handlers.onRating(Number(e.target.value)) },
    el('option', { value: '0' }, 'Nessun voto'),
    ...[1, 2, 3, 4, 5].map((n) => el('option', { value: String(n), selected: entry?.rating === n }, '★'.repeat(n))));

  const statusSelect = el('select', {
    id: 'dlg-status',
    onChange: (e) => {
      const updated = handlers.onStatus(e.target.value);
      ratingSelect.disabled = !updated;
      if (!updated) ratingSelect.value = '0';
    },
  },
  el('option', { value: '' }, entry ? 'Rimuovi dalla libreria' : 'Aggiungi alla libreria…'),
  ...Object.values(STATUS).map((s) => el('option', { value: s, selected: entry?.status === s }, STATUS_LABEL[s])));

  const close = el('button', { class: 'dialog-close', type: 'button', 'aria-label': 'Chiudi', onClick: () => dialog.close() }, '✕');

  $('#dialog-content').replaceChildren(
    el('div', { class: 'dialog-inner' }, close,
      el('div', {},
        el('h2', { id: 'dialog-title' }, book.title),
        el('p', { class: 'card-meta' }, authorsText(book.authors)),
        tags,
        el('h3', {}, 'Descrizione'),
        body,
        el('div', { class: 'dialog-actions' },
          el('label', { class: 'field', for: 'dlg-status' }, 'La tua libreria', statusSelect),
          el('label', { class: 'field', for: 'dlg-rating' }, 'Il tuo voto', ratingSelect)))));

  if (!dialog.open) dialog.showModal();

  return {
    showDetails({ description, subjects }) {
      body.textContent = description || 'Nessuna descrizione disponibile per questo libro.';
      body.removeAttribute('aria-busy');
      tags.replaceChildren(...subjects.map((s) => el('li', {}, s)));
    },
    showError(message) {
      body.textContent = message;
      body.setAttribute('role', 'alert');
      body.removeAttribute('aria-busy');
    },
  };
}
