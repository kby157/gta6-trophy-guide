// Rendering: audit tiles, checklist, guide pane, sources rail, roadmap, Next Up, stage strip.

import { auditStats, citedRefsFor, guideBackingFor, hasCounter, sourceByNumber, sourceCoverage } from './data.js';
import { shouldMaskForSpoilers } from './filters.js';
import { ROADMAP_STAGES, missableAndWindowTrophies, missableLabel, trophiesForStage } from './roadmap.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderAudit(doc) {
  const audit = auditStats(doc);
  const grades = audit.grades;
  const tiles = document.getElementById('audit-tiles');
  tiles.replaceChildren();
  const tileData = [
    [`${audit.claims}`, 'atomic claims, each cited'],
    [`${audit.backed}`, 'claims backed by 2+ sources'],
    [`${audit.sourcePages} · ${audit.siteCount}`, 'source pages · sites read'],
    [`${audit.disputes}`, 'disputes shown both ways'],
  ];
  for (const [big, small] of tileData) {
    const tile = element('div', 'audit-tile');
    tile.append(element('span', 'audit-big', big), element('span', 'audit-small', small));
    tiles.append(tile);
  }
  document.getElementById('audit-bar').textContent =
    `AUDIT · ${audit.total} official · ${grades.platinum}P ${grades.gold}G ${grades.silver}S ${grades.bronze}B · ${audit.hidden} hidden · ` +
    `guides citing ${audit.guidesCited}/${audit.total} · steps cited ${audit.citedSteps}/${audit.steps} · ` +
    `${audit.sourceCount} sources read ${audit.readDate} · missable ${audit.missable} · watch ${audit.watch} · ` +
    `unconfirmed ${audit.unconfirmed} · disagree ${audit.disagree}`;
}

export function renderProgress(trophies, store, nextUp) {
  const earned = trophies.filter((trophy) => store.isEarned(trophy.id)).length;
  document.getElementById('progress-big').textContent = `${earned} of ${trophies.length} earned`;
  document.getElementById('progress-fill').style.width = `${Math.round((earned / trophies.length) * 100)}%`;
  const hint = document.getElementById('next-hint');
  hint.textContent = nextUp.length
    ? `Next up: ${nextUp[0].name} (Stage ${nextUp[0].stage})`
    : 'All 55 earned — the platinum is yours.';
}

export function renderStageStrip(trophies, store) {
  const strip = document.getElementById('stage-strip');
  strip.replaceChildren();
  for (const stageInfo of ROADMAP_STAGES) {
    const inStage = trophiesForStage(trophies, stageInfo.stage);
    const earned = inStage.filter((trophy) => store.isEarned(trophy.id)).length;
    const cell = element('div', 'stage-cell');
    cell.append(
      element('span', 'stage-cell-title', `S${stageInfo.stage} ${stageInfo.short}`),
      element('span', 'stage-cell-count', `${earned}/${inStage.length} earned`),
    );
    strip.append(cell);
  }
}

export function renderChecklist(trophies, visible, view, store, onSelect) {
  const list = document.getElementById('trophy-list');
  list.replaceChildren();
  document.getElementById('list-summary').textContent =
    `Showing ${visible.length} of ${trophies.length} trophies. Click a row for its guide; tick the box to mark earned.`;
  document.getElementById('online-note').hidden = view.status !== 'online';
  for (const trophy of visible) {
    const isEarned = store.isEarned(trophy.id);
    const masked = shouldMaskForSpoilers(trophy, { spoilersOn: view.spoilersOn, isEarned });
    const row = element('button', 'trophy-row');
    row.type = 'button';
    if (trophy.id === view.selectedId) row.classList.add('selected');
    const box = element('input', 'earned-box');
    box.type = 'checkbox';
    box.checked = isEarned;
    box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => store.toggleEarned(trophy.id));
    const main = element('span', 'row-main');
    const name = element('span', 'row-name', masked ? 'Hidden story trophy — earn it to reveal' : trophy.name);
    const desc = element('span', 'row-desc', masked ? 'Hidden by spoiler protection.' : trophy.description);
    desc.style.display = 'block';
    const meta = element('span', 'row-meta');
    const grade = element('span');
    const dot = element('span', `grade-dot grade-${trophy.grade}`);
    grade.append(dot, document.createTextNode(`${trophy.grade}${trophy.hidden ? ' · hidden' : ''}`));
    meta.append(grade);
    if (trophy.missable) meta.append(element('span', 'flag', '⚠ POSSIBLY MISSABLE'));
    if (trophy.story_window) meta.append(element('span', 'flag', 'WATCH'));
    if (trophy.unconfirmed) meta.append(element('span', 'flag flag-quiet', 'UNCONFIRMED'));
    if (trophy.disagreement) meta.append(element('span', 'flag flag-quiet', 'SOURCES DISAGREE'));
    meta.append(element('span', '', `Stage ${trophy.stage} · ${trophy.kind}`));
    const refs = citedRefsFor(trophy);
    meta.append(element('span', 'cite-marker', `${(trophy.steps ?? []).length} steps [${refs.join('] [')}]`));
    if (hasCounter(trophy)) {
      meta.append(element('span', 'counter-pill', `${store.counterFor(trophy)} / ${trophy.count_target} ${trophy.count_label}`));
    }
    main.append(name, desc, meta);
    row.append(box, main);
    row.addEventListener('click', () => onSelect(trophy.id));
    const item = element('li');
    item.append(row);
    list.append(item);
  }
}

export function renderDetail(doc, trophy, store) {
  const panel = document.getElementById('detail-panel');
  panel.replaceChildren();
  if (!trophy) {
    panel.append(element('p', 'detail-empty', 'Select a trophy to read its guide and sources.'));
    return;
  }
  const isEarned = store.isEarned(trophy.id);
  // Opening a masked trophy is the reader's choice; show it whole.
  panel.append(element('p', 'kicker', `Trophy ${trophy.id} of 55 · ${trophy.grade}${trophy.hidden ? ' · hidden on PlayStation' : ''} · Stage ${trophy.stage}`));
  panel.append(element('h2', '', trophy.name));
  panel.append(element('p', 'official', `Official description: “${trophy.description}”`));
  if (trophy.missable) panel.append(element('p', 'flag', '⚠ Possibly missable — the only one the published guides flag. See step 1 and the box below.'));
  if (trophy.story_window) panel.append(element('p', 'flag', 'WATCH — sources disagree on whether this strand has a closing window; both versions below.'));
  if (trophy.unconfirmed) panel.append(element('p', 'flag flag-quiet', 'UNCONFIRMED — no source read pins this trigger down; the steps say so.'));
  panel.append(element('p', 'guide-text', trophy.guide));
  if (trophy.disagreement) {
    const box = element('div', 'disagree-box');
    box.append(element('p', 'disagree-title', 'Sources disagree'));
    box.append(element('p', '', trophy.disagreement));
    panel.append(box);
  }
  panel.append(element('h3', 'facts-title', `Steps (${(trophy.steps ?? []).length})`));
  const steps = element('ol', 'steps');
  for (const step of trophy.steps ?? []) {
    const item = element('li');
    item.append(document.createTextNode(step.t));
    const refs = element('span', 'step-refs', ` [${(step.refs ?? []).join('] [')}]`);
    item.append(refs);
    steps.append(item);
  }
  panel.append(steps);
  const facts = trophy.facts ?? [];
  if (facts.length) {
    panel.append(element('h3', 'facts-title', `Facts (${facts.length})`));
    const factList = element('ul', 'facts');
    for (const fact of facts) {
      const item = element('li');
      item.append(document.createTextNode(fact.t));
      item.append(element('span', 'step-refs', ` [${(fact.refs ?? []).join('] [')}]`));
      factList.append(item);
    }
    panel.append(factList);
  }
  if (hasCounter(trophy)) {
    const box = element('div', 'counter-box');
    const minus = element('button', '', '−');
    minus.type = 'button';
    minus.addEventListener('click', () => store.setCounter(trophy.id, store.counterFor(trophy) - 1));
    const input = element('input');
    input.type = 'number';
    input.min = '0';
    input.value = String(store.counterFor(trophy));
    input.setAttribute('aria-label', `Progress counter for ${trophy.name}`);
    input.addEventListener('change', () => store.setCounter(trophy.id, input.value));
    const plus = element('button', '', '+');
    plus.type = 'button';
    plus.addEventListener('click', () => store.setCounter(trophy.id, store.counterFor(trophy) + 1));
    box.append(element('span', '', 'Your progress:'), minus, input, plus, element('span', '', `/ ${trophy.count_target} ${trophy.count_label}`));
    panel.append(box);
  }
  const done = element('button', 'tab', isEarned ? 'Earned ✓ (click to undo)' : 'Mark as earned');
  done.type = 'button';
  done.addEventListener('click', () => store.toggleEarned(trophy.id));
  panel.append(done);
}

// The rail: sources the selected guide cites, with facts/steps backed per source.
export function renderRail(doc, trophy) {
  const rail = document.getElementById('sources-rail');
  rail.replaceChildren();
  rail.append(element('h3', 'rail-title', 'Sources behind this guide'));
  if (!trophy) {
    rail.append(element('p', 'rail-empty', 'Select a trophy to see the sources its guide rests on.'));
    return;
  }
  const { rows, factTotal, stepTotal } = guideBackingFor(doc, trophy);
  rail.append(element('p', 'rail-summary', `${rows.length} sources back this guide's ${factTotal} facts and ${stepTotal} steps.`));
  const list = element('ul', 'rail-list');
  for (const row of rows) {
    const item = element('li', 'rail-entry');
    item.append(element('span', 'rail-name', `[${row.n}] ${row.source.name}`));
    item.append(element('span', 'rail-counts', `backs ${row.facts} facts · ${row.steps} steps`));
    list.append(item);
  }
  rail.append(list);
}

export function renderRoadmap(trophies, store) {
  const wrap = document.getElementById('roadmap-stages');
  wrap.replaceChildren();
  for (const stageInfo of ROADMAP_STAGES) {
    const section = element('section', 'stage');
    section.append(element('h3', '', stageInfo.title));
    section.append(element('p', '', stageInfo.text));
    const chips = element('div', 'chips');
    for (const trophy of trophiesForStage(trophies, stageInfo.stage)) {
      const chip = element('span', 'tchip', trophy.name);
      if (store.isEarned(trophy.id)) chip.classList.add('done');
      chips.append(chip);
    }
    section.append(chips);
    wrap.append(section);
  }
  const list = document.getElementById('missable-list');
  list.replaceChildren();
  for (const trophy of missableAndWindowTrophies(trophies)) {
    const item = element('li');
    item.append(
      element('strong', '', `${trophy.name} — `),
      document.createTextNode(`${missableLabel(trophy)}. ${trophy.guide}`),
    );
    list.append(item);
  }
}

export function renderNextUp(nextUp) {
  const list = document.getElementById('nextup-list');
  list.replaceChildren();
  if (!nextUp.length) {
    list.append(element('li', '', 'Nothing left: all 55 trophies are earned.'));
    return;
  }
  for (const trophy of nextUp) {
    const item = element('li');
    item.append(
      element('strong', '', `${trophy.name} `),
      element('span', 'counter-pill', `${trophy.grade} · Stage ${trophy.stage}`),
      document.createTextNode(` ${trophy.guide}`),
    );
    list.append(item);
  }
}

export function renderSources(doc) {
  const coverage = sourceCoverage(doc);
  const list = document.getElementById('sources-list');
  list.replaceChildren();
  for (const source of doc.sources ?? []) {
    const item = element('li', 'source-entry');
    item.append(
      element('strong', '', `[${source.n}] ${source.name}`),
      document.createTextNode(` — ${source.detail} Cited by ${coverage.get(source.n) ?? 0} of 55 guides.`),
    );
    list.append(item);
  }
  const audit = auditStats(doc);
  document.getElementById('audit-explainer').textContent =
    `Audit, counted from the data: ${audit.claims} atomic claims in 55 guides, ` +
    `${audit.backed} backed by 2+ distinct sources; ${audit.guidesCited} of ${audit.total} guides cite a source; ` +
    `${audit.citedSteps} of ${audit.steps} steps carry a citation; ${audit.disagree} trophies show disagreements; ` +
    `${audit.unconfirmed} marked unconfirmed — no source read pins their trigger down.`;
}
