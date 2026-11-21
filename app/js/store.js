// Progress storage: earned trophies and counters in localStorage, with export/import.

const STORAGE_KEY = 'leonida-platinum-tracker-v1';

export function createStore() {
  let state = readStoredState();
  const listeners = new Set();

  function readStoredState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { earned: [], counters: {} };
      const parsed = JSON.parse(raw);
      return {
        earned: Array.isArray(parsed.earned) ? parsed.earned : [],
        counters: parsed.counters && typeof parsed.counters === 'object' ? parsed.counters : {},
      };
    } catch {
      return { earned: [], counters: {} };
    }
  }

  function persistAndNotify() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    for (const listener of listeners) listener(state);
  }

  return {
    getState() {
      return state;
    },
    isEarned(id) {
      return state.earned.includes(id);
    },
    toggleEarned(id) {
      state = {
        ...state,
        earned: state.earned.includes(id)
          ? state.earned.filter((earnedId) => earnedId !== id)
          : [...state.earned, id],
      };
      persistAndNotify();
    },
    counterFor(trophy) {
      return state.counters[trophy.id] ?? 0;
    },
    setCounter(id, value) {
      const clean = Math.max(0, Math.floor(Number(value) || 0));
      state = { ...state, counters: { ...state.counters, [id]: clean } };
      persistAndNotify();
    },
    replaceState(next) {
      state = {
        earned: Array.isArray(next.earned) ? next.earned.filter((id) => Number.isInteger(id)) : [],
        counters: next.counters && typeof next.counters === 'object' ? next.counters : {},
      };
      persistAndNotify();
    },
    subscribe(listener) {
      listeners.add(listener);
    },
  };
}

export function exportProgressToFile(store) {
  const blob = new Blob([JSON.stringify(store.getState(), null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'leonida-trophy-progress.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export async function importProgressFromFile(store, file) {
  const parsed = JSON.parse(await file.text());
  const state = Array.isArray(parsed) ? { earned: parsed, counters: {} } : parsed;
  store.replaceState(state);
}

// Demo seeding: ?demo=1 marks a mid-run state (13 earned), empty store only.
export function seedDemoStateIfAsked(store) {
  const params = new URLSearchParams(location.search);
  if (params.get('demo') !== '1') return;
  if (store.getState().earned.length > 0) return;
  store.replaceState({
    earned: [2, 3, 8, 16, 20, 21, 28, 30, 33, 35, 39, 44, 55],
    counters: { 15: 87, 16: 9, 17: 19, 25: 3, 28: 6, 30: 3, 31: 41, 35: 100, 42: 23, 48: 132 },
  });
}
