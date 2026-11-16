// main.js — "composition root": crea le dipendenze e le collega all'interfaccia
import { http } from './api/httpClient.js';
import { createBookRepository, isAbortError } from './api/bookRepository.js';
import { createLibraryStore, getBrowserStorage } from './store/libraryStore.js';
import { STATUS_LABEL } from './store/constants.js';
import { computeStats, evaluateBadges, goalProgress } from './domain/gamification.js';
import { $, toast } from './ui/dom.js';
import { appendBooks, renderBooks, renderChips, renderMessage, renderSkeleton } from './ui/components.js';
import { openDialog } from './ui/dialog.js';
import { renderGoals, renderLibrary } from './ui/views.js';

const repo = createBookRepository(http);
const store = createLibraryStore(getBrowserStorage());

const SUGGESTIONS = ['fantasy', 'science fiction', 'adventure', 'mystery', 'history', 'animals', 'children', 'art']
  .map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));

const search = { subject: '', page: 1, books: [], token: 0 };
const known = new Map(); // id -> libro, per aprire i dettagli dal clic
let libraryFilter = 'all';

/* ---------- Tab ---------- */
function showView(name) {
  document.querySelectorAll('.tab').forEach((t) => {
    const active = t.dataset.view === name;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.view').forEach((v) => (v.hidden = v.id !== `view-${name}`));
  if (name === 'library') refreshLibrary();
  if (name === 'goals') refreshGoals();
}

/* ---------- Ricerca per categoria: GET /subjects/{categoria}.json ---------- */
async function runSearch(subject, { append = false } = {}) {
  subject = subject.trim();
  if (subject.length < 2) return toast('Inserisci una categoria (almeno 2 caratteri)');

  const results = $('#results');
  const more = $('#load-more');
  const token = ++search.token; // scarta le risposte di ricerche superate
  const page = append ? search.page + 1 : 1;

  if (!append) {
    search.subject = subject;
    search.books = [];
    $('#results-title').textContent = `Libri: ${subject}`;
    renderSkeleton(results);
    more.hidden = true;
    renderChips($('#subject-chips'), SUGGESTIONS, subject.toLowerCase(), pickSuggestion);
  }
  results.setAttribute('aria-busy', 'true');
  more.disabled = true;

  try {
    const { books, hasMore } = await repo.getBooksBySubject(search.subject, page);
    if (token !== search.token) return;
    search.page = page;
    books.forEach((b) => known.set(b.id, b));
    search.books.push(...books);

    if (!search.books.length) renderMessage(results, `Nessun libro trovato per "${search.subject}". Prova con un termine in inglese.`);
    else if (append) appendBooks(results, books);
    else renderBooks(results, books);
    more.hidden = !hasMore;
  } catch (err) {
    if (isAbortError(err) || token !== search.token) return;
    if (append) toast(err.message);
    else renderMessage(results, err.message || 'Qualcosa è andato storto. Riprova.', 'error');
  } finally {
    if (token === search.token) {
      results.setAttribute('aria-busy', 'false');
      more.disabled = false;
    }
  }
}

function pickSuggestion(value) {
  $('#search-input').value = value;
  syncClear();
  runSearch(value);
}

const syncClear = () => ($('#search-clear').hidden = !$('#search-input').value);

/* ---------- Dettaglio: seconda chiamata GET /works/OL…W.json ---------- */
async function showBook(id) {
  const book = known.get(id) ?? store.getEntry(id)?.book;
  if (!book) return;

  const view = openDialog(book, store.getEntry(id), {
    onStatus(status) {
      if (!status) {
        store.removeBook(id);
        toast('Rimosso dalla libreria');
        return null;
      }
      const entry = store.setStatus(book, status);
      toast(`"${book.title}" → ${STATUS_LABEL[status]}`);
      return entry;
    },
    onRating: (n) => store.setRating(id, n),
  });

  try {
    view.showDetails(await repo.getWorkDetails(id));
  } catch (err) {
    view.showError(err.message || 'Impossibile caricare la descrizione.');
  }
}

/* ---------- Libreria e obiettivi ---------- */
function refreshLibrary() {
  renderLibrary($('#library-list'), $('#library-filters'), store.getLibrary(), libraryFilter, (f) => {
    libraryFilter = f;
    refreshLibrary();
  });
}

function refreshGoals() {
  const goal = store.getGoal().yearly;
  const stats = computeStats(store.getLibrary());
  renderGoals($('#goals-panel'), { stats, goal, progress: goalProgress(stats, goal), badges: evaluateBadges(stats, goal) }, (n) => {
    try {
      store.setYearlyGoal(n);
      toast('Obiettivo aggiornato');
    } catch (err) {
      toast(err.message);
    }
  });
}

/* ---------- Avvio ---------- */
function init() {
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showView(t.dataset.view)));

  const input = $('#search-input');
  input.addEventListener('input', syncClear);
  $('#search-clear').addEventListener('click', () => {
    input.value = '';
    syncClear();
    input.focus();
  });
  $('#search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch(input.value);
  });
  $('#load-more').addEventListener('click', () => runSearch(search.subject, { append: true }));

  renderChips($('#subject-chips'), SUGGESTIONS, '', pickSuggestion);

  // Un solo listener per tutte le card (event delegation)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-title-btn');
    if (btn) showBook(btn.dataset.id);
  });
  const dialog = $('#book-dialog');
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  // Observer: ogni modifica alla libreria aggiorna contatore e viste aperte
  const updateCount = () => ($('#library-count').textContent = String(store.getLibrary().length));
  store.subscribe(() => {
    updateCount();
    if (!$('#view-library').hidden) refreshLibrary();
    if (!$('#view-goals').hidden) refreshGoals();
  });
  updateCount();
}

init();
