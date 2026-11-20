// Boot and wiring: loads the data, holds the current view state, and
// re-renders every view whenever progress or a control changes.

import { loadTrophyData } from './data.js';
import { createStore, exportProgressToFile, importProgressFromFile, seedDemoStateIfAsked } from './store.js';
import { filterTrophies, nextUpTrophies } from './filters.js';
import { renderChecklist, renderDetail, renderNextUp, renderProgress, renderRoadmap } from './views.js';

const store = createStore();
seedDemoStateIfAsked(store);

const view = {
  kind: 'all',
  grade: 'all',
  search: '',
  spoilersOn: true,
  hideEarned: false,
  selectedId: 28,
  panel: 'checklist',
};

let trophies = [];

function currentTrophy() {
  return trophies.find((trophy) => trophy.id === view.selectedId) ?? null;
}

function renderAll() {
  const visible = filterTrophies(trophies, view, store);
  const nextUp = nextUpTrophies(trophies, store);
  renderProgress(trophies, store, nextUp);
  renderChecklist(trophies, visible, view, store, (id) => {
    view.selectedId = id;
    renderAll();
  });
  renderDetail(currentTrophy(), store);
  renderRoadmap(trophies, store);
  renderNextUp(nextUp);
  document.getElementById('checklist-view').hidden = view.panel !== 'checklist';
  document.getElementById('controls').hidden = view.panel !== 'checklist';
  document.getElementById('roadmap-view').hidden = view.panel !== 'roadmap';
  document.getElementById('nextup-view').hidden = view.panel !== 'nextup';
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
  for (const chip of document.querySelectorAll('#kind-filters .chip')) {
    chip.addEventListener('click', () => {
      view.kind = chip.dataset.kind;
      for (const other of document.querySelectorAll('#kind-filters .chip')) {
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
trophies = await loadTrophyData();
wireControls();
renderAll();
