// Loading the trophy data and what the views derive from it: the source
// registry, per-source coverage and the audit numbers. Everything is
// computed from the data file itself, so printed numbers cannot drift.

export const KIND_ORDER = ['platinum', 'story', 'side', 'collectibles', 'activities', 'crime', 'money', 'completion', 'misc'];
export const KIND_LABELS = {
  platinum: 'Platinum',
  story: 'Story',
  side: 'Side strands',
  collectibles: 'Collectibles',
  activities: 'Activities',
  crime: 'Crime',
  money: 'Money',
  completion: 'Completion',
  misc: 'Misc & one-offs',
};

export async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophy data failed to load: ${response.status}`);
  return response.json();
}

export function isStoryTrophy(trophy) {
  return trophy.kind === 'story';
}

export function isHiddenStoryTrophy(trophy) {
  // Spoiler protection covers every trophy PlayStation hides, not only the
  // chapter ones: a hidden trophy's name is itself the spoiler.
  return trophy.hidden === true;
}

export function hasCounter(trophy) {
  return typeof trophy.count_target === 'number' && trophy.count_target > 1;
}

export function gradeCounts(trophies) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) counts[trophy.grade] = (counts[trophy.grade] ?? 0) + 1;
  return counts;
}

export function citedRefsFor(trophy) {
  const refs = new Set();
  for (const step of trophy.steps ?? []) for (const ref of step.refs ?? []) refs.add(ref);
  for (const fact of trophy.facts ?? []) for (const ref of fact.refs ?? []) refs.add(ref);
  return [...refs].sort((a, b) => a - b);
}

export function sourceByNumber(doc, n) {
  return (doc.sources ?? []).find((source) => source.n === n) ?? null;
}

// How many of the 55 guides cite each numbered source, per source number.
export function sourceCoverage(doc) {
  const coverage = new Map();
  for (const trophy of doc.trophies) {
    for (const ref of citedRefsFor(trophy)) coverage.set(ref, (coverage.get(ref) ?? 0) + 1);
  }
  return coverage;
}

// For one guide: how many of its facts and steps each cited source backs
// (what the sources rail renders).
export function guideBackingFor(doc, trophy) {
  const perSource = new Map();
  const bump = (ref, key) => {
    const entry = perSource.get(ref) ?? { facts: 0, steps: 0 };
    entry[key] += 1;
    perSource.set(ref, entry);
  };
  for (const fact of trophy.facts ?? []) for (const ref of fact.refs ?? []) bump(ref, 'facts');
  for (const step of trophy.steps ?? []) for (const ref of step.refs ?? []) bump(ref, 'steps');
  const rows = [...perSource.entries()]
    .map(([n, counts]) => ({ source: sourceByNumber(doc, n), n, facts: counts.facts, steps: counts.steps }))
    .filter((row) => row.source)
    .sort((a, b) => b.facts + b.steps - (a.facts + a.steps) || a.n - b.n);
  return {
    rows,
    factTotal: (trophy.facts ?? []).length,
    stepTotal: (trophy.steps ?? []).length,
  };
}

// The audit tiles' numbers, counted from the data at load time. Claims
// are the atomic facts; backed = facts with >= 2 distinct refs.
export function auditStats(doc) {
  const trophies = doc.trophies;
  let steps = 0;
  let citedSteps = 0;
  let claims = 0;
  let backed = 0;
  for (const trophy of trophies) {
    for (const step of trophy.steps ?? []) {
      steps += 1;
      if ((step.refs ?? []).length > 0) citedSteps += 1;
    }
    for (const fact of trophy.facts ?? []) {
      claims += 1;
      if (new Set(fact.refs ?? []).size >= 2) backed += 1;
    }
  }
  const sites = new Set(
    (doc.sources ?? []).filter((source) => source.site !== 'official-list').map((source) => source.site),
  );
  return {
    total: trophies.length,
    grades: gradeCounts(trophies),
    hidden: trophies.filter((trophy) => trophy.hidden).length,
    guidesCited: trophies.filter((trophy) => citedRefsFor(trophy).length > 0).length,
    steps,
    citedSteps,
    claims,
    backed,
    sourceCount: (doc.sources ?? []).length,
    sourcePages: (doc.sources ?? []).length,
    siteCount: sites.size,
    readDate: doc.read_date ?? '',
    missable: trophies.filter((trophy) => trophy.missable).length,
    watch: trophies.filter((trophy) => trophy.story_window).length,
    unconfirmed: trophies.filter((trophy) => trophy.unconfirmed).length,
    disagree: trophies.filter((trophy) => trophy.disagreement).length,
    disputes: trophies.filter((trophy) => trophy.disagreement).length,
  };
}

export function searchTextFor(trophy) {
  const stepText = (trophy.steps ?? []).map((step) => step.t).join(' ');
  const factText = (trophy.facts ?? []).map((fact) => fact.t).join(' ');
  return `${trophy.name} ${trophy.description} ${trophy.guide} ${stepText} ${factText}`.toLowerCase();
}
