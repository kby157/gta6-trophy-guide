// The platinum roadmap and the missable / story-window lists.

export const ROADMAP_STAGES = [
  {
    stage: 1,
    short: 'Story & strands',
    title: 'Stage 1 — Story, strands as they appear, and the one missable',
    text: 'Play the five chapters and the named missions. Take stranger strands when offered (sources disagree on story windows — both versions are on those trophies), start meditation in Chapter 1, and scan vehicles and WAiNK as you travel. Save manually at each chapter: no mission replay.',
  },
  {
    stage: 2,
    short: 'The 100% spine',
    title: 'Stage 2 — The 100% spine',
    text: 'After the credits the game opens its own 100% checklist in Progress. Work it as the spine: stunts, ranges, races, cards, challenges, vaults and gang operations all feed A Long Road, the hardest trophy on the list.',
  },
  {
    stage: 3,
    short: 'Feats & one-offs',
    title: 'Stage 3 — Feats, partners and hidden one-offs',
    text: 'The specific feats and the hidden one-offs: partner wanted-level runs, the Combat Focus five, the showroom smash, the Ocean Beach cocktail, the tank steal, the jet steal and the UFO night.',
  },
  {
    stage: 4,
    short: 'Money & property',
    title: 'Stage 4 — Money and property',
    text: 'Launder the marked bills, spend across the shops, buy every garage and register your vehicles. These totals accumulate quietly if you start them during the story instead of farming them at the end.',
  },
  {
    stage: 5,
    short: 'Platinum clean-up',
    title: 'Stage 5 — Platinum clean-up',
    text: 'Whatever the Next Up planner still shows, then Vice Got a Price! unlocks on its own when the other 54 are earned. Published roadmaps budget roughly 200 hours for the whole run.',
  },
];

export function trophiesForStage(trophies, stage) {
  return trophies.filter((trophy) => trophy.stage === stage);
}

export function missableAndWindowTrophies(trophies) {
  return trophies.filter((trophy) => trophy.missable === true || trophy.story_window === true);
}

export function missableLabel(trophy) {
  if (trophy.missable) return 'Possibly missable — do it in Chapter 1 and as spots open';
  return 'Watch — sources disagree on whether this strand has a closing window; start it when offered';
}
