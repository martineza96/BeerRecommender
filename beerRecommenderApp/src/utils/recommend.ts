import { Beer, beers as allBeers } from '../data/beers';

export interface Recommendation {
  beer: Beer;
  /** Cosine similarity, -1 to 1. */
  similarity: number;
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

/** The `count` beers most similar to `beer` by flavor profile, ABV and IBU. */
export const recommend = (beer: Beer, count = 5): Recommendation[] => {
  const index = allBeers.indexOf(beer);
  if (index === -1) return [];
  const target = vectors[index];

  return vectors
    .map((v, i) => ({
      beer: allBeers[i],
      similarity: v.reduce((sum, x, j) => sum + x * target[j], 0) / (norms[i] * norms[index]),
    }))
    .filter((r) => r.beer !== beer)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count);
};
