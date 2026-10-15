import { Beer, beers as allBeers } from '../data/beers';
import { descriptionScores } from './descriptionSimilarity';

export interface Recommendation {
  beer: Beer;
  /** Blended score used for ranking; equals `featureSimilarity` when the description weight is 0. */
  similarity: number;
  /** Cosine similarity of ABV, IBU and flavor features, -1 to 1. */
  featureSimilarity: number;
  /** Description match relative to the beer's best description match, 0–1 (0 if none). */
  descriptionScore: number;
}

/** Same features as the "Feature Recommendations" cell in BeerEDA.ipynb. */
const featuresOf = (beer: Beer): number[] => [
  beer.abv,
  beer.minIbu,
  beer.maxIbu,
  ...Object.values(beer.flavor),
];

/** Standardize each feature to mean 0 / std 1, like sklearn's StandardScaler. */
const standardize = (rows: number[][]): number[][] => {
  const n = rows.length;
  const width = rows[0].length;
  const means = Array.from({ length: width }, (_, j) => rows.reduce((sum, r) => sum + r[j], 0) / n);
  const stds = means.map((mean, j) =>
    Math.sqrt(rows.reduce((sum, r) => sum + (r[j] - mean) ** 2, 0) / n) || 1,
  );
  return rows.map((r) => r.map((v, j) => (v - means[j]) / stds[j]));
};

const vectors = standardize(allBeers.map(featuresOf));
const norms = vectors.map((v) => Math.hypot(...v) || 1);

/**
 * The `count` beers most similar to `beer`.
 *
 * Each candidate scores `(1 − w) · featureSimilarity + w · descriptionScore`, where
 * `w = descriptionWeight` (0–1), featureSimilarity is the cosine similarity of the
 * standardized ABV/IBU/flavor features, and descriptionScore is the relative TF-IDF
 * description score from `descriptionScores()` (0 when not a description neighbor).
 * Ties go to the higher featureSimilarity, so at w = 1 beers with few or no
 * description neighbors fill the remaining slots with their best flavor matches.
 *
 * With the default w = 0 the result is the notebook's "Feature Recommendations".
 */
export const recommend = (beer: Beer, count = 5, descriptionWeight = 0): Recommendation[] => {
  const index = allBeers.indexOf(beer);
  if (index === -1) return [];
  const target = vectors[index];
  const w = Math.min(1, Math.max(0, descriptionWeight));
  const described = w > 0 ? descriptionScores(beer) : new Map<number, number>();

  return vectors
    .map((v, i) => {
      const featureSimilarity =
        v.reduce((sum, x, j) => sum + x * target[j], 0) / (norms[i] * norms[index]);
      const descriptionScore = described.get(allBeers[i].id) ?? 0;
      return {
        beer: allBeers[i],
        // At w = 0 keep the exact feature value (no floating-point blend round-off).
        similarity: w === 0 ? featureSimilarity : (1 - w) * featureSimilarity + w * descriptionScore,
        featureSimilarity,
        descriptionScore,
      };
    })
    .filter((r) => r.beer !== beer)
    .sort((a, b) => b.similarity - a.similarity || b.featureSimilarity - a.featureSimilarity)
    .slice(0, count);
};
