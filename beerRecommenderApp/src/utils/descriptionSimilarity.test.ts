import { beers } from '../data/beers';
import { descriptionScores, hasDescriptionMatches } from './descriptionSimilarity';

const byId = (id: number) => beers.find((b) => b.id === id)!;

describe('descriptionScores', () => {
  it('scales scores so the best description match is 1', () => {
    const scores = [...descriptionScores(byId(925)).values()];
    expect(scores).toHaveLength(10);
    expect(Math.max(...scores)).toBe(1);
    scores.forEach((s) => {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThanOrEqual(1);
    });
  });

  it('keeps every relative score within (0, 1] for all beers', () => {
    beers.filter(hasDescriptionMatches).forEach((beer) => {
      const scores = [...descriptionScores(beer).values()];
      expect(Math.max(...scores)).toBe(1);
      scores.forEach((s) => expect(s > 0 && s <= 1).toBe(true));
    });
  });

  it('returns an empty map for beers without a description entry', () => {
    const stella = byId(1183);
    expect(hasDescriptionMatches(stella)).toBe(false);
    expect(descriptionScores(stella).size).toBe(0);
  });

  it('reports which beers have matches', () => {
    expect(hasDescriptionMatches(byId(925))).toBe(true);
    expect(descriptionScores(byId(1826)).size).toBe(1);
    expect(descriptionScores(byId(192)).size).toBe(5);
    expect(beers.filter(hasDescriptionMatches)).toHaveLength(1850);
  });
});
