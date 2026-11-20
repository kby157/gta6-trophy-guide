// Loading the trophy data and the small facts every view derives from it:
// the numbered source registry, per-source coverage, and the audit numbers
// the header strip prints. Everything here is computed from the data file
// itself, so the printed numbers can never drift from the guides.

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

// The audit strip's numbers, all counted from the data at load time.
export function auditStats(doc) {
  const trophies = doc.trophies;
  let steps = 0;
  let citedSteps = 0;
  for (const trophy of trophies) {
    for (const step of trophy.steps ?? []) {
      steps += 1;
      if ((step.refs ?? []).length > 0) citedSteps += 1;
    }
  }
  return {
    total: trophies.length,
    grades: gradeCounts(trophies),
    hidden: trophies.filter((trophy) => trophy.hidden).length,
    guidesCited: trophies.filter((trophy) => citedRefsFor(trophy).length > 0).length,
    steps,
    citedSteps,
    sourceCount: (doc.sources ?? []).length,
    readDate: doc.read_date ?? '',
    missable: trophies.filter((trophy) => trophy.missable).length,
    watch: trophies.filter((trophy) => trophy.story_window).length,
    unconfirmed: trophies.filter((trophy) => trophy.unconfirmed).length,
    disagree: trophies.filter((trophy) => trophy.disagreement).length,
  };
}

export function searchTextFor(trophy) {
  const stepText = (trophy.steps ?? []).map((step) => step.t).join(' ');
  return `${trophy.name} ${trophy.description} ${trophy.guide} ${stepText}`.toLowerCase();
}
