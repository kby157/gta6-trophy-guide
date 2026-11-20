// Filtering and the spoiler rule. Spoiler protection hides the name and
// description of a hidden story trophy until that trophy is earned.
// Two filter axes: the trophy's kind (from the data's own categories) and
// its status (missable/watch, unconfirmed, sources disagree, online).

import { isHiddenStoryTrophy, searchTextFor } from './data.js';

export function shouldMaskForSpoilers(trophy, { spoilersOn, isEarned }) {
  return spoilersOn && !isEarned && isHiddenStoryTrophy(trophy);
}

export function matchesKindFilter(trophy, kind) {
  if (kind === 'all') return true;
  return trophy.kind === kind;
}

export function matchesStatusFilter(trophy, status) {
  if (status === 'any') return true;
  if (status === 'watch') return trophy.missable === true || trophy.story_window === true;
  if (status === 'unconfirmed') return trophy.unconfirmed === true;
  if (status === 'disagree') return typeof trophy.disagreement === 'string';
  if (status === 'online') return trophy.kind === 'online';
  return true;
}

export function filterTrophies(trophies, view, store) {
  const query = view.search.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (!matchesKindFilter(trophy, view.kind)) return false;
    if (!matchesStatusFilter(trophy, view.status)) return false;
    if (view.grade !== 'all' && trophy.grade !== view.grade) return false;
    if (view.hideEarned && store.isEarned(trophy.id)) return false;
    if (query && !searchTextFor(trophy).includes(query)) return false;
    return true;
  });
}

export function nextUpTrophies(trophies, store, limit = 5) {
  const urgency = (trophy) => {
    if (trophy.missable) return 0;
    if (trophy.story_window) return 1;
    return 2;
  };
  return trophies
    .filter((trophy) => !store.isEarned(trophy.id))
    .sort((a, b) => urgency(a) - urgency(b) || a.stage - b.stage || a.id - b.id)
    .slice(0, limit);
}
