// views.js — viste "La mia libreria" e "Obiettivi"
import { el } from './dom.js';
import { bookCard, renderChips, renderMessage } from './components.js';
import { STATUS, STATUS_LABEL } from '../store/constants.js';

export function renderLibrary(list, filtersBox, entries, filter, onFilter) {
  const filters = [{ value: 'all', label: 'Tutti' }, ...Object.values(STATUS).map((s) => ({ value: s, label: STATUS_LABEL[s] }))];
  renderChips(filtersBox, filters, filter, onFilter);
  const shown = entries.filter((e) => filter === 'all' || e.status === filter);
  if (!shown.length) return renderMessage(list, 'Nessun libro qui. Cerca una categoria e aggiungine qualcuno!');
  list.replaceChildren(...shown.map((e) => bookCard(e.book, e)));
}

export function renderGoals(panel, { stats, goal, progress, badges }, onGoal) {
  const input = el('input', { id: 'goal-input', type: 'number', min: '1', max: '365', value: String(goal), required: true });
  const form = el('form', { class: 'goal-form', onSubmit: (e) => { e.preventDefault(); onGoal(Number(input.value)); } },
    el('label', { class: 'field', for: 'goal-input' }, `Libri da leggere nel ${new Date().getFullYear()}`, input),
    el('button', { class: 'btn btn-primary', type: 'submit' }, 'Salva'));

  panel.replaceChildren(
    el('section', { class: 'panel' },
      el('h3', {}, 'Obiettivo annuale'), form,
      el('p', {}, `${stats.readThisYear} di ${goal} libri letti (${progress}%)`),
      el('progress', { max: '100', value: String(progress), 'aria-label': 'Avanzamento obiettivo' })),
    el('section', { class: 'panel' }, el('h3', {}, 'Statistiche'),
      el('div', { class: 'stats' },
        ...[['Letti', stats.read], ['In lettura', stats.reading], ['Da leggere', stats.want], ['Autori letti', stats.authors]]
          .map(([l, v]) => el('div', { class: 'stat' }, el('strong', {}, String(v)), l)))),
    el('section', { class: 'panel' }, el('h3', {}, 'Badge'),
      el('ul', { class: 'badges' }, ...badges.map((b) =>
        el('li', { class: `badge ${b.unlocked ? '' : 'locked'}` },
          el('span', { class: 'icon', 'aria-hidden': 'true' }, b.icon), el('strong', {}, b.name), el('small', {}, b.desc),
          el('small', {}, b.unlocked ? '✓ Sbloccato' : 'Bloccato'))))));
}
