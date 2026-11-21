// A working gta6-trophy-guide-01 entry (Node 22, standard library only): the guide is this directory's app/ folder,
// plain static files a browser opens at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json. The program hands it in: it copies app/
// and screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Only the plumbing, not a winner: a plain checklist of the 55 trophies with a one-line hint each. Write a real guide
// for every trophy in your own words, a roadmap to the platinum, filters and a spoiler setting in app/, put 3 or 4 PNG
// or JPEG screenshots of it in screenshots/ (the first by name is the cover; shots.json says which views this
// starter's were taken of), and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Leonida Platinum Tracker self-check, added for this entry: refuse to hand
// in a guide whose trophy data is incomplete, so a truncated data file can
// never reach the gate dressed as a finished entry. It reads only the file
// beside this program and changes nothing that is copied to the output.
// The fact-level half mirrors the app's own audit definitions in
// app/js/data.js (claims = atomic facts; backed = facts whose refs hold at
// least two distinct registry numbers), so the numbers this check logs are
// the numbers the app prints on its cover tiles. Citations are read the
// app's way as well — structured refs (steps, facts, disagreement sides)
// plus the [n] markers in guide prose — and the registry must earn its page count: every
// cited number has to resolve, and every registered page has to be cited
// by at least one trophy, or the hand-in fails here.
function checkTrophyDataComplete() {
  const raw = readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8');
  const doc = JSON.parse(raw);
  const trophies = Array.isArray(doc) ? doc : doc.trophies;
  if (!Array.isArray(trophies) || trophies.length !== 55) {
    throw new Error(`trophy data must hold exactly 55 trophies, found ${trophies?.length}`);
  }
  const knownSources = new Set((doc.sources ?? []).map((source) => source.n));
  if (knownSources.size === 0) throw new Error('the source registry is empty');
  let claims = 0;
  let backed = 0;
  let steps = 0;
  const citedAnywhere = new Set();
  for (const trophy of trophies) {
    if (typeof trophy.name !== 'string' || trophy.name.trim() === '') throw new Error('a trophy has no name');
    if (typeof trophy.guide !== 'string' || trophy.guide.trim().length < 40) throw new Error(`guide summary too short for ${trophy.name}`);
    if (!Array.isArray(trophy.steps) || trophy.steps.length < 2) throw new Error(`guide steps missing for ${trophy.name}`);
    for (const step of trophy.steps) {
      steps += 1;
      if (typeof step.t !== 'string' || step.t.trim() === '') throw new Error(`a blank step in ${trophy.name}`);
      if (!Array.isArray(step.refs) || step.refs.length === 0) throw new Error(`an uncited step in ${trophy.name}`);
      for (const ref of step.refs) {
        if (!knownSources.has(ref)) throw new Error(`step in ${trophy.name} cites unknown source ${ref}`);
        citedAnywhere.add(ref);
      }
    }
    if (!Array.isArray(trophy.facts) || trophy.facts.length < 8) throw new Error(`fewer than 8 facts for ${trophy.name}`);
    for (const fact of trophy.facts) {
      claims += 1;
      if (typeof fact.t !== 'string' || fact.t.trim() === '') throw new Error(`a blank fact in ${trophy.name}`);
      if (!Array.isArray(fact.refs) || fact.refs.length === 0) throw new Error(`an uncited fact in ${trophy.name}`);
      for (const ref of fact.refs) {
        if (!knownSources.has(ref)) throw new Error(`fact in ${trophy.name} cites unknown source ${ref}`);
        citedAnywhere.add(ref);
      }
      if (new Set(fact.refs).size >= 2) backed += 1;
    }
    for (const marker of (trophy.guide ?? '').matchAll(/\[(\d+)\]/g)) {
      const ref = Number(marker[1]);
      if (!knownSources.has(ref)) throw new Error(`prose in ${trophy.name} cites unknown source ${ref}`);
      citedAnywhere.add(ref);
    }
    // A disagreement is structured: two or three sides, each carrying its
    // own refs, plus the verdict line. Every side ref must resolve, exactly
    // as a step or fact ref must.
    const dispute = trophy.disagreement;
    if (dispute !== undefined && dispute !== null) {
      if (typeof dispute !== 'object' || !Array.isArray(dispute.sides) || dispute.sides.length < 2 || dispute.sides.length > 3) {
        throw new Error(`disagreement for ${trophy.name} must hold 2 or 3 sides`);
      }
      if (typeof dispute.call !== 'string' || !dispute.call.startsWith('Our call: ')) {
        throw new Error(`disagreement for ${trophy.name} has no verdict line`);
      }
      for (const side of dispute.sides) {
        if (typeof side.t !== 'string' || side.t.trim() === '') throw new Error(`a blank dispute side in ${trophy.name}`);
        if (!Array.isArray(side.refs) || side.refs.length === 0) throw new Error(`an uncited dispute side in ${trophy.name}`);
        for (const ref of side.refs) {
          if (!knownSources.has(ref)) throw new Error(`dispute side in ${trophy.name} cites unknown source ${ref}`);
          citedAnywhere.add(ref);
        }
      }
    }
  }
  for (const n of knownSources) {
    if (!citedAnywhere.has(n)) throw new Error(`registered source ${n} is cited by no trophy`);
  }
  const sites = new Set(
    (doc.sources ?? []).filter((source) => citedAnywhere.has(source.n) && source.site !== 'official-list').map((source) => source.site),
  );
  return {
    trophies: trophies.length,
    claims,
    backed,
    steps,
    disputes: trophies.filter((trophy) => trophy.disagreement).length,
    sourcePages: citedAnywhere.size,
    siteCount: sites.size,
  };
}
const audit = checkTrophyDataComplete();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// Second half of this entry's self-check: the screenshots folder must hold
// the 3 or 4 shots the gate expects, each inside its 256 KiB cap, and the
// run log states what was actually handed in.
function checkScreenshotsHandedIn() {
  const dir = join(out, 'screenshots');
  const shots = readdirSync(dir).filter((name) => /\.(png|jpe?g)$/i.test(name));
  if (shots.length < 3 || shots.length > 4) throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
  for (const name of shots) {
    if (statSync(join(dir, name)).size > 262144) throw new Error(`screenshot over 256 KiB: ${name}`);
  }
  return shots.length;
}
const handedInShotCount = checkScreenshotsHandedIn();
console.log(`Leonida Platinum Tracker handed in: ${audit.trophies} trophies, ${handedInShotCount} screenshots.`);
console.log(`Audit (same definitions as the app): ${audit.claims} claims, ${audit.backed} backed by 2+ sources, ${audit.sourcePages} source pages across ${audit.siteCount} sites, ${audit.disputes} disputes, ${audit.steps} steps.`);
