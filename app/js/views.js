// Rendering: the checklist rows, the guide pane with its sources, the
// roadmap stages, the missable list and the Next Up planner.

import { hasCounter } from './data.js';
import { shouldMaskForSpoilers } from './filters.js';
import { ROADMAP_STAGES, missableAndWindowTrophies, missableLabel, trophiesForStage } from './roadmap.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
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

export function renderChecklist(trophies, visible, view, store, onSelect) {
  const list = document.getElementById('trophy-list');
  list.replaceChildren();
  document.getElementById('list-summary').textContent =
    `Showing ${visible.length} of ${trophies.length} trophies. Click a row for its full guide and sources; tick the box to mark it earned. Progress saves in this browser.`;
  document.getElementById('online-note').hidden = view.kind !== 'online';
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
    const desc = element('span', 'row-desc', masked ? 'Name and description hidden by spoiler protection.' : trophy.description);
    desc.style.display = 'block';
    const meta = element('span', 'row-meta');
    const grade = element('span');
    const dot = element('span', `grade-dot grade-${trophy.grade}`);
    grade.append(dot, document.createTextNode(`${trophy.grade}${trophy.hidden ? ' · hidden' : ''}`));
    meta.append(grade);
    if (trophy.missable) meta.append(element('span', 'flag', '⚠ POSSIBLY MISSABLE'));
    if (trophy.story_window) meta.append(element('span', 'flag', 'STORY WINDOW'));
    meta.append(element('span', '', `Stage ${trophy.stage} · ${trophy.kind}`));
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

export function renderDetail(trophy, store) {
  const panel = document.getElementById('detail-panel');
  panel.replaceChildren();
  if (!trophy) {
    panel.append(element('p', 'detail-empty', 'Select a trophy to read its guide and its sources.'));
    return;
  }
  const isEarned = store.isEarned(trophy.id);
  // The checklist masks hidden story trophies under spoiler protection;
  // opening one here is the reader's own choice, so the pane shows it whole.
  panel.append(element('p', 'kicker', `Trophy ${trophy.id} of 55 · ${trophy.grade}${trophy.hidden ? ' · hidden on PlayStation' : ''} · Stage ${trophy.stage}`));
  panel.append(element('h2', '', trophy.name));
  panel.append(element('p', 'official', `Official description: “${trophy.description}”`));
  if (trophy.missable) panel.append(element('p', 'flag', '⚠ Possibly missable — the only one the published guides flag. See its guide for the Chapter 1 step.'));
  if (trophy.story_window) panel.append(element('p', 'flag', 'Story window — finish this strand before the endgame.'));
  panel.append(element('p', 'guide-text', trophy.guide));
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
  const sources = element('div', 'sources');
  sources.append(element('p', '', 'Sources for this guide'));
  const sourceList = element('ul');
  for (const source of trophy.sources ?? []) sourceList.append(element('li', '', source));
  sources.append(sourceList);
  panel.append(sources);
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
