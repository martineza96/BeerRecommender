import { Beer } from '../data/beers';
import rawNeighbors from '../data/descriptionNeighbors.json';

/**
 * Top-10 TF-IDF description neighbors per beer, `{beerId: [[neighborId, score], ...]}`,
 * exported by `scripts/export_description_similarity.py`. Beers with an empty or
 * boilerplate description (e.g. "Notes:") have no entry.
 */
const neighbors = rawNeighbors as unknown as Record<string, [number, number][]>;

/**
 * Scores relative to each beer's best description match (best = 1), built once.
 * Raw TF-IDF cosines are low (often 0.1–0.4), so this rescaling is what lets them
 * blend meaningfully with feature similarities that sit around 0.97.
 */
const relativeScores = new Map<number, Map<number, number>>(
  Object.entries(neighbors).map(([id, list]) => {
    const top = Math.max(...list.map(([, score]) => score));
    const scores = new Map<number, number>(
      top > 0 ? list.map(([neighborId, score]) => [neighborId, score / top]) : [],
    );
    return [Number(id), scores];
  }),
);

const empty: ReadonlyMap<number, number> = new Map();

/** Whether `beer` has any description neighbors to compare against. */
export const hasDescriptionMatches = (beer: Beer): boolean =>
  (relativeScores.get(beer.id)?.size ?? 0) > 0;

/**
 * Description similarity of `beer` to its neighbors, keyed by neighbor id, as a
 * fraction of its best match (0–1, best = 1). Empty when the beer has no entry.
 */
export const descriptionScores = (beer: Beer): Map<number, number> =>
  new Map(relativeScores.get(beer.id) ?? empty);
