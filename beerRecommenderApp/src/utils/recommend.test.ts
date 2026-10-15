import { beers } from '../data/beers';
import { recommend } from './recommend';

const byName = (name: string) => beers.find((b) => b.name === name)!;

describe('recommend', () => {
  it('returns 5 beers, never the beer itself', () => {
    const beer = byName('Keystone Light');
    const results = recommend(beer);
    expect(results).toHaveLength(5);
    expect(results.map((r) => r.beer)).not.toContain(beer);
  });

  it('is sorted from most to least similar', () => {
    const scores = recommend(byName('Keystone Light')).map((r) => r.similarity);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  // Reference results from the same calculation in Python (BeerEDA.ipynb features).
  it('matches the notebook for Keystone Light', () => {
    const results = recommend(byName('Keystone Light'));
    expect(results.map((r) => r.beer.name)).toEqual([
      'Miller Lite',
      'Miller High Life Light',
      'Michelob Golden Draft Light',
      'Medalla Light',
      'Pabst Blue Ribbon (PBR)',
    ]);
    expect(results[0].similarity).toBeCloseTo(0.9919, 3);
  });

  // Saved output of the "Feature Recommendations" cell in BeerEDA.ipynb (beer_index=1183).
  it('matches the notebook output for Stella Artois', () => {
    const stella = beers.find((b) => b.id === 1183)!;
    expect(stella.name).toBe('Stella Artois');
    const results = recommend(stella);
    expect(results.map((r) => r.beer.id)).toEqual([192, 1756, 1755, 1144, 1138]);
    [0.990524, 0.97739, 0.975854, 0.975276, 0.973361].forEach((score, i) =>
      expect(results[i].similarity).toBeCloseTo(score, 5),
    );
  });

  it('recommends hoppy beers for a double IPA', () => {
    const names = recommend(byName('Pliny The Elder')).map((r) => r.beer.name);
    expect(names).toEqual(['Arctic Panzer Wolf', 'Hop Stoopid', '2XIPA', 'Abrasive Ale', 'Maximus']);
  });
});

describe('recommend with description weight', () => {
  const byId = (id: number) => beers.find((b) => b.id === id)!;

  it('gives exactly the feature results at weight 0', () => {
    [byName('Keystone Light'), byId(1183), byId(925), byId(1826)].forEach((beer) => {
      const base = recommend(beer);
      const weighted = recommend(beer, 5, 0);
      expect(weighted.map((r) => r.beer.id)).toEqual(base.map((r) => r.beer.id));
      expect(weighted.map((r) => r.similarity)).toEqual(base.map((r) => r.similarity));
      weighted.forEach((r) => expect(r.similarity).toBe(r.featureSimilarity));
    });
  });

  it('ranks Pliny The Elder by description neighbors at weight 1', () => {
    const results = recommend(byId(925), 5, 1);
    expect(results.map((r) => r.beer.id)).toEqual([944, 803, 2258, 1867, 1387]);
    expect(results[0].similarity).toBe(1);
  });

  it('falls back to flavor matches for Stella Artois, which has no description', () => {
    const results = recommend(byId(1183), 5, 1);
    expect(results.map((r) => r.beer.id)).toEqual([192, 1756, 1755, 1144, 1138]);
    results.forEach((r) => expect(r.descriptionScore).toBe(0));
  });

  it('fills slots after the only description neighbor with flavor matches', () => {
    const beer = byId(1826);
    const results = recommend(beer, 5, 1);
    const flavor = recommend(beer, 10)
      .map((r) => r.beer.id)
      .filter((id) => id !== results[0].beer.id);
    expect(results).toHaveLength(5);
    expect(results[0].descriptionScore).toBe(1);
    expect(results.slice(1).map((r) => r.beer.id)).toEqual(flavor.slice(0, 4));
  });

  it('is sorted by blended score at an intermediate weight', () => {
    const scores = recommend(byId(925), 5, 0.5).map((r) => r.similarity);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});
