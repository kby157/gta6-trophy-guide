// Boot and wiring: loads the data, builds the kind filter chips from the
// data's own categories (so their counts are always true), holds the
// current view state, and re-renders every view whenever progress or a
// control changes.

import { KIND_LABELS, KIND_ORDER, loadTrophyData } from './data.js';
import { createStore, exportProgressToFile, importProgressFromFile, seedDemoStateIfAsked } from './store.js';
import { filterTrophies, nextUpTrophies } from './filters.js';
import { renderAudit, renderChecklist, renderDetail, renderNextUp, renderProgress, renderRoadmap, renderSources, renderStageStrip } from './views.js';

const store = createStore();
seedDemoStateIfAsked(store);

const view = {
  kind: 'all',
  status: 'any',
  grade: 'all',
  search: '',
  spoilersOn: true,
  hideEarned: false,
  selectedId: 28,
  panel: 'checklist',
};

let doc = null;

function trophies() {
  return doc?.trophies ?? [];
}

function currentTrophy() {
  return trophies().find((trophy) => trophy.id === view.selectedId) ?? null;
}

function buildKindChips() {
  const wrap = document.getElementById('kind-filters');
  wrap.replaceChildren();
  const makeChip = (kind, label) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.kind = kind;
    chip.textContent = label;
    if (view.kind === kind) chip.classList.add('active');
    chip.addEventListener('click', () => {
      view.kind = kind;
      for (const other of wrap.querySelectorAll('.chip')) other.classList.toggle('active', other === chip);
      renderAll();
    });
    wrap.append(chip);
  };
  makeChip('all', `All ${trophies().length}`);
  for (const kind of KIND_ORDER) {
    const count = trophies().filter((trophy) => trophy.kind === kind).length;
    if (count > 0) makeChip(kind, `${KIND_LABELS[kind]} ${count}`);
  }
}

function renderAll() {
  const all = trophies();
  const visible = filterTrophies(all, view, store);
  const nextUp = nextUpTrophies(all, store);
  renderProgress(all, store, nextUp);
  renderStageStrip(all, store);
  renderChecklist(all, visible, view, store, (id) => {
    view.selectedId = id;
    renderAll();
  });
  renderDetail(doc, currentTrophy(), store);
  renderRoadmap(all, store);
  renderNextUp(nextUp);
  document.getElementById('checklist-view').hidden = view.panel !== 'checklist';
  document.getElementById('controls').hidden = view.panel !== 'checklist';
  document.getElementById('roadmap-view').hidden = view.panel !== 'roadmap';
  document.getElementById('nextup-view').hidden = view.panel !== 'nextup';
  document.getElementById('sources-view').hidden = view.panel !== 'sources';
  for (const tab of document.querySelectorAll('#view-tabs .tab')) {
    tab.classList.toggle('active', tab.dataset.view === view.panel);
  }
}

function wireControls() {
  document.getElementById('search').addEventListener('input', (event) => {
    view.search = event.target.value;
    renderAll();
  });
  document.getElementById('grade-filter').addEventListener('change', (event) => {
    view.grade = event.target.value;
    renderAll();
  });
  document.getElementById('spoiler-toggle').addEventListener('change', (event) => {
    view.spoilersOn = event.target.checked;
    renderAll();
  });
  document.getElementById('earned-toggle').addEventListener('change', (event) => {
    view.hideEarned = event.target.checked;
    renderAll();
  });
  for (const chip of document.querySelectorAll('#status-filters .chip')) {
    chip.addEventListener('click', () => {
      view.status = chip.dataset.status;
      for (const other of document.querySelectorAll('#status-filters .chip')) {
        other.classList.toggle('active', other === chip);
      }
      renderAll();
    });
  }
  for (const tab of document.querySelectorAll('#view-tabs .tab')) {
    tab.addEventListener('click', () => {
      view.panel = tab.dataset.view;
      renderAll();
    });
  }
  document.getElementById('export-progress').addEventListener('click', () => exportProgressToFile(store));
  document.getElementById('import-progress').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) await importProgressFromFile(store, file);
  });
}

store.subscribe(renderAll);
doc = await loadTrophyData();
renderAudit(doc);
renderSources(doc);
buildKindChips();
wireControls();
renderAll();
