import { Beer, beers as allBeers, normalize } from '../data/beers';

/** Common alternate spellings, mapped to the words used in the data. */
const ALIASES: Record<string, string[]> = {
  lite: ['light'],
  ipa: ['india pale ale', 'ipa'],
  sam: ['samuel'],
  hefe: ['hefeweizen'],
  pils: ['pilsner', 'pilsener', 'pils'],
};

/** Each query word, plus its aliases, as a list of options any one of which may match. */
const expandWords = (query: string): string[][] =>
  normalize(query)
    .split(' ')
    .filter(Boolean)
    .map((word) => [word, ...(ALIASES[word] ?? [])]);

/** True when `phrase` (one or more words) starts at a word boundary in `text`. */
const hasWordPrefix = (text: string, phrase: string): boolean =>
  text.startsWith(phrase) || text.includes(` ${phrase}`);

const score = (beer: Beer, query: string, words: string[][]): number => {
  const name = beer.searchName;
  if (name === query) return 1000;
  let points = 0;
  if (name.startsWith(query)) points += 500;
  // Reward each query word that hits the beer name rather than brewery/style.
  points += words.filter((options) => options.some((w) => hasWordPrefix(name, w))).length * 100;
  return points;
};

/**
 * Find beers whose name, brewery or style contain every query word as the
 * start of a word, e.g. "coors" or "blue mo". Best matches first, with ties
 * broken by popularity.
 */
export const searchBeers = (query: string, limit = 10, beers: Beer[] = allBeers): Beer[] => {
  const normalized = normalize(query);
  const words = expandWords(query);
  if (!words.length) return [];

  return beers
    .filter((beer) => words.every((options) => options.some((w) => hasWordPrefix(beer.searchText, w))))
    .map((beer) => ({ beer, points: score(beer, normalized, words) }))
    .sort((a, b) => b.points - a.points || b.beer.reviewCount - a.beer.reviewCount)
    .slice(0, limit)
    .map(({ beer }) => beer);
};
