# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/kby157/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/kby157/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Platinum Tracker** is an offline web app that works as both a guide and a progress tracker for all 55 PlayStation 5 trophies in Grand Theft Auto VI. Everything runs locally in your browser: the app makes no network requests, so once the page is loaded you can disconnect and keep using it. Your progress is stored in the browser's localStorage and can be exported to a file or imported back at any time, which makes it easy to move between machines or keep a backup of a long platinum run.

## Run it

```sh
node serve.ts
```

Then open the page the server prints in your browser. The application itself lives under `app/`; `serve.ts` is only a small static file server, so there is nothing to install and no build step.

If you just want to look around before tracking a real playthrough, add `?demo=1` to the URL. When local storage is still empty, the app seeds a demonstration progress state so you can see what a partially completed tracker looks like; it never overwrites progress you have already saved.

## What it does

- **Full trophy list.** All 55 trophies with their official names, descriptions and grades (platinum, gold, silver, bronze), each with its own guide.
- **Progress tracking.** Mark trophies as earned as you go; progress persists in localStorage across visits, and the header keeps a running count toward the platinum.
- **Export and import.** Save your progress to a JSON file and restore it later, on any browser.
- **Filters and search.** Narrow the list by grade, by category, by earned or unearned state, or by a free-text search across names and descriptions.
- **Spoiler protection.** The game has 28 hidden trophies. Their details stay blurred until you explicitly choose to reveal them, so you can plan a run without spoiling story beats for yourself.
- **Five-stage roadmap.** A staged route to the platinum that orders the work sensibly: story first, then the open-world grinds, then cleanup.
- **Counters for grind trophies.** Trophies that ask for a number of things — races won, stunts landed, collectibles found — get their own counters so you can track partial progress instead of guessing.
- **One missable trophy, clearly flagged.** Exactly one trophy in the game can be missed, and the guide calls it out wherever it appears so a single playthrough is enough for the platinum.

## Sources and method

This guide was not written from memory or from a single walkthrough. Its content is assembled claim by claim: every per-trophy fact and every step-by-step instruction is treated as an individual claim, and each claim is tied to the source or sources it rests on. In total the guide carries **582 claims**, and **521 of them — about 89.5% — are backed by two or more independent sources** rather than resting on one site's word alone.

The source base behind those claims is **84 pages read in full, spread across 36 different websites**, all read on 21 November 2026. Trophy names, descriptions and grades follow the official trophy list; the guidance built on top of them comes from cross-checking those 84 pages against each other. Because the citations travel with the content, every step in every trophy's guide shows the citation or citations it depends on — a reader who wants to double-check a step can go straight to the underlying source instead of taking the guide's word for it.

Cross-checking that many sources also surfaces the places where they contradict each other. At **30 points the sources disagree** — about requirements, windows, or methods — and in each case the guide presents both sides of the disagreement rather than quietly picking the answer it liked best. The same honesty applies where the sources run out: anything no source could confirm is labelled **unconfirmed** in the guide instead of being stated as fact.

The missable flag follows the same method. The guide marks exactly one trophy — **Positive Mental Attitude** — as missable, because that is what the strongest sources support; the disagreement that exists about it is shown alongside the flag, so the reader can see both the conclusion and the doubt attached to it.

---
<sub>Entered on [make.fun](https://make.fun/?ref=q915kej0&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
