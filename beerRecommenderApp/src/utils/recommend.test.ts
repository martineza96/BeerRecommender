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

  it('recommends hoppy beers for a double IPA', () => {
    const names = recommend(byName('Pliny The Elder')).map((r) => r.beer.name);
    expect(names).toEqual(['Arctic Panzer Wolf', 'Hop Stoopid', '2XIPA', 'Abrasive Ale', 'Maximus']);
  });
});
