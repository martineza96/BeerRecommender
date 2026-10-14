# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Beer search app that recommends similar beers by flavor profile, ABV and IBU. Two parts: `BeerEDA.ipynb` (pandas/scikit-learn/nltk exploration and recommender experiments) and `beerRecommenderApp/` (Ionic 7 + React 18 + Vite 5 + TypeScript). The README has features, data files and the status checklist.

## Commands

Run from `beerRecommenderApp/` (Node 18+):

- `npm run dev`: dev server at http://localhost:5173
- `npx vitest run`: all unit tests (Vitest + jsdom)
- `npx vitest run src/utils/recommend.test.ts`: one file; add `-t "<test name>"` for one test
- `npx tsc --noEmit`: type-check
- `npm run build`: type-check and production build (the >500 kB chunk warning is expected; see below)

Broken, don't rely on them: `npm run lint` (the ESLint config has no TypeScript parser) and `npm run test.e2e` (`cypress/e2e/test.cy.ts` is still the Ionic starter test).

## Architecture

There's no backend; everything runs in the browser.

1. `src/data/beersDF.json` is the dataset exported from the notebook with pandas `to_json()`, shaped `{column: {rowIndex: value}}`.
2. `src/data/beers.ts` turns it into typed `Beer[]` at import time: cleans names and descriptions, and precomputes `searchText`/`searchName` with `normalize()` (lowercase, accents stripped).
3. `src/utils/searchBeers.ts`: every query word (plus `ALIASES`, e.g. "lite" → "light") must match the start of a word in name/brewery/style. Name matches score higher; ties go to the most-reviewed beer.
4. `src/utils/recommend.ts`: standardizes ABV, min/max IBU and the 11 flavor scores across all beers once at module load, then returns the top 5 by cosine similarity.
5. `src/pages/Home.tsx` uses `src/components/BeerSearch.tsx` for search and shows the selected beer with its recommendations. Single route `/home`.

## Rules and data quirks

- Recommendations must match the "Feature Recommendations" cell in `BeerEDA.ipynb` (same features, StandardScaler-style population std, cosine similarity). If you change `recommend.ts`, check the results against the notebook.
- Don't hand-edit `beersDF.json`; regenerate it from the notebook. It's about 2.3 MB and 80k lines, so search it with grep instead of reading it, and it's why the bundle is large.
- Some source names have the brewery glued on, e.g. "Keystone LightCoors Brewing Company (Molson-Coors)". `cleanName()` in `beers.ts` strips it.
- There's no Coors Light in the dataset, so don't use it as a test example.
- Ignore `dist/`, `node_modules/`, `.ipynb_checkpoints/` and the stray top-level `beer-recommender/` folder (it holds only an `ionic.config.json`).
