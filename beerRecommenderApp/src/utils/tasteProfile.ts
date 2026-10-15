import { Beer, beers as allBeers } from '../data/beers';

export type TasteKey = 'strength' | 'bitterness' | 'body' | 'sweetness' | 'sourness';

export interface TasteFeature {
  key: TasteKey;
  label: string;
  /** Word for the low end of the slider (percentile 0). */
  low: string;
  /** Word for the high end of the slider (percentile 100). */
  high: string;
  value: (beer: Beer) => number;
}

export const TASTE_FEATURES: TasteFeature[] = [
  { key: 'strength', label: 'Strength', low: 'Light', high: 'Strong', value: (b) => b.abv },
  {
    key: 'bitterness',
    label: 'Bitterness',
    low: 'Smooth',
    high: 'Bitter',
    value: (b) => (b.minIbu + b.maxIbu) / 2,
  },
  { key: 'body', label: 'Body', low: 'Thin', high: 'Full', value: (b) => b.flavor.body },
  { key: 'sweetness', label: 'Sweetness', low: 'Dry', high: 'Sweet', value: (b) => b.flavor.sweet },
  { key: 'sourness', label: 'Sourness', low: 'Clean', high: 'Sour', value: (b) => b.flavor.sour },
];

export type TastePrefs = Partial<Record<TasteKey, number>>;

/**
 * Percentile rank 0–100 of every value (0 = lowest, 100 = highest).
 * Tied values get the average of their ranks, so equal values share a percentile.
 */
const percentileRanks = (values: number[]): number[] => {
  const n = values.length;
  const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
  const result = new Array<number>(n);
  let start = 0;
  while (start < n) {
    let end = start;
    while (end + 1 < n && values[order[end + 1]] === values[order[start]]) end++;
    const averageRank = (start + end) / 2;
    const percentile = n > 1 ? (averageRank / (n - 1)) * 100 : 50;
    for (let k = start; k <= end; k++) result[order[k]] = percentile;
    start = end + 1;
  }
  return result;
};

/** percentiles[featureIndex][beerIndex], computed once at module load. */
const percentiles: number[][] = TASTE_FEATURES.map((f) => percentileRanks(allBeers.map(f.value)));
const beerIndex = new Map<Beer, number>(allBeers.map((b, i) => [b, i]));
const featureIndex = new Map<TasteKey, number>(TASTE_FEATURES.map((f, i) => [f.key, i]));

/** A beer's percentile (0–100) for one taste feature, compared with all beers. */
export const percentileOf = (beer: Beer, key: TasteKey): number => {
  const i = beerIndex.get(beer);
  const j = featureIndex.get(key);
  if (i === undefined || j === undefined) return NaN;
  return percentiles[j][i];
};

export interface TasteMatch {
  beer: Beer;
  /** 0–100, how close the beer is to the preferences; null when no feature is enabled. */
  match: number | null;
}

export interface MatchOptions {
  count?: number;
  minReviews?: number;
}

const byRatingThenReviews = (a: Beer, b: Beer) =>
  b.rating - a.rating || b.reviewCount - a.reviewCount;

/**
 * The `count` beers closest to the given preferences (percentiles 0–100).
 * Only keys present in `prefs` count; a missing key means "doesn't matter".
 */
export const matchBeers = (
  prefs: TastePrefs,
  { count = 20, minReviews = 10 }: MatchOptions = {},
): TasteMatch[] => {
  const enabled = TASTE_FEATURES.map((f, j) => ({ j, pref: prefs[f.key] }))
    .filter(
      (e): e is { j: number; pref: number } => typeof e.pref === 'number' && !Number.isNaN(e.pref),
    )
    .map(({ j, pref }) => ({ j, pref: Math.min(100, Math.max(0, pref)) }));

  const candidates = allBeers
    .map((beer, i) => ({ beer, i }))
    .filter(({ beer }) => beer.reviewCount >= minReviews);

  if (enabled.length === 0) {
    return candidates
      .map(({ beer }) => beer)
      .sort(byRatingThenReviews)
      .slice(0, count)
      .map((beer) => ({ beer, match: null }));
  }

  return candidates
    .map(({ beer, i }) => {
      const distance =
        enabled.reduce((sum, { j, pref }) => sum + Math.abs(pref - percentiles[j][i]), 0) /
        enabled.length;
      return { beer, match: 100 - distance };
    })
    .sort((a, b) => b.match - a.match || byRatingThenReviews(a.beer, b.beer))
    .slice(0, count);
};
