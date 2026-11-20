// Loads the trophy data file and answers plain questions about a trophy.
// The data file is fetched from inside app/, so the guide works offline.

export async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('trophies.json did not load');
  const doc = await response.json();
  return doc.trophies;
}

export function isStoryTrophy(trophy) {
  return trophy.kind === 'story';
}

export function isHiddenStoryTrophy(trophy) {
  return trophy.hidden === true && trophy.kind === 'story';
}

export function hasCounter(trophy) {
  return typeof trophy.count_target === 'number' && trophy.count_target > 1;
}

export function gradeCounts(trophies) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) counts[trophy.grade] += 1;
  return counts;
}

export function searchTextFor(trophy) {
  return [trophy.name, trophy.description, trophy.guide, trophy.kind, ...(trophy.sources ?? [])]
    .join(' ')
    .toLowerCase();
}
