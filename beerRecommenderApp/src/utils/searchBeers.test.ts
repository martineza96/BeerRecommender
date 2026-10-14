import { searchBeers } from './searchBeers';
import { beers } from '../data/beers';

const names = (query: string, limit?: number) => searchBeers(query, limit).map((b) => b.name);

describe('searchBeers', () => {
  it('finds beers by brewery name', () => {
    const results = searchBeers('coors', 50);
    expect(results.length).toBeGreaterThan(5);
    expect(results.every((b) => /coors/i.test(b.brewery))).toBe(true);
    expect(results.map((b) => b.name)).toContain('Keystone Light');
  });

  it('narrows results with more words', () => {
    expect(names('coors light')[0]).toBe('Keystone Light');
  });

  it('matches common alternate spellings', () => {
    expect(names('bud lite')[0]).toBe('Bud Light');
  });

  it('ignores accents', () => {
    expect(names('munster')).toContain('Organic Münster Alt');
  });

  it('matches partial words', () => {
    expect(names('blue mo')).toContain('Blue Moon Belgian White');
    expect(names('stella')[0]).toBe('Stella Artois');
  });

  it('returns nothing for an empty query', () => {
    expect(searchBeers('   ')).toEqual([]);
  });
});

describe('beer names', () => {
  it('strips brewery text glued onto names', () => {
    expect(beers.some((b) => b.name === 'Keystone Light')).toBe(true);
    expect(beers.some((b) => b.name.includes('Brewing Company (Molson-Coors)'))).toBe(false);
  });
});
