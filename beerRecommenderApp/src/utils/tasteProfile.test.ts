import { beers, popularBeers } from '../data/beers';
import { TASTE_FEATURES, TastePrefs, matchBeers, percentileOf } from './tasteProfile';

describe('percentileOf', () => {
  it('stays within 0–100 for every beer and feature', () => {
    for (const beer of beers) {
      for (const { key } of TASTE_FEATURES) {
        const p = percentileOf(beer, key);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(100);
      }
    }
  });

  it('puts the strongest beer at 100', () => {
    const strongest = beers.reduce((max, b) => (b.abv > max.abv ? b : max));
    expect(percentileOf(strongest, 'strength')).toBe(100);
  });

  it('gives equal values the same percentile', () => {
    const [a, b] = beers.filter((beer) => beer.abv === 5);
    expect(percentileOf(a, 'strength')).toBe(percentileOf(b, 'strength'));
  });
});

describe('matchBeers', () => {
  it("ranks a beer #1 with match 100 when prefs equal its own percentiles", () => {
    const beer = popularBeers(1)[0];
    const prefs: TastePrefs = {};
    for (const { key } of TASTE_FEATURES) prefs[key] = percentileOf(beer, key);
    const [first] = matchBeers(prefs);
    expect(first.beer).toBe(beer);
    expect(first.match).toBeCloseTo(100, 10);
  });

  it('returns at most `count` results sorted by match', () => {
    const results = matchBeers({ strength: 30, body: 70 }, { count: 15 });
    expect(results).toHaveLength(15);
    const scores = results.map((r) => r.match as number);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it('ignores keys left out of prefs', () => {
    const base = matchBeers({ strength: 40, sweetness: 80 });
    const same = matchBeers({ strength: 40, sweetness: 80, bitterness: undefined });
    expect(same).toEqual(base);
    // Changing the value of a disabled key can't matter, because it isn't there;
    // changing an enabled key does change the output.
    expect(matchBeers({ strength: 40, sweetness: 20 })).not.toEqual(base);
  });

  it('favors big, bitter styles for strong and bitter prefs', () => {
    const top = matchBeers({ strength: 95, bitterness: 95 }, { count: 10 });
    // IBU comes from style ranges, so imperial stouts (50–90 IBU) and wheatwines
    // rank alongside IPAs, barleywines and strong ales.
    const strongStyles = top.filter(({ beer }) =>
      /IPA|Barleywine|Strong|Imperial|Wheatwine/i.test(beer.style),
    );
    expect(strongStyles.length).toBeGreaterThan(5);
    for (const { beer } of top) {
      expect(beer.abv).toBeGreaterThanOrEqual(9);
      expect((beer.minIbu + beer.maxIbu) / 2).toBeGreaterThanOrEqual(60);
    }
  });

  it('never returns beers under minReviews', () => {
    const results = matchBeers({ sourness: 90 }, { count: 200, minReviews: 50 });
    expect(results).toHaveLength(200);
    expect(results.every(({ beer }) => beer.reviewCount >= 50)).toBe(true);
  });

  it('returns top-rated beers with match null when no feature is enabled', () => {
    const results = matchBeers({});
    expect(results).toHaveLength(20);
    expect(results.every((r) => r.match === null)).toBe(true);
    const ratings = results.map((r) => r.beer.rating);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
    expect(results.every(({ beer }) => beer.reviewCount >= 10)).toBe(true);
  });
});
