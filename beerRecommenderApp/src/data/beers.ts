import rawData from './beersDF.json';

export interface FlavorProfile {
  astringency: number;
  body: number;
  alcohol: number;
  bitter: number;
  sweet: number;
  sour: number;
  salty: number;
  fruits: number;
  hoppy: number;
  spices: number;
  malty: number;
}

export interface Beer {
  id: number;
  name: string;
  brewery: string;
  style: string;
  fullName: string;
  description: string;
  abv: number;
  minIbu: number;
  maxIbu: number;
  flavor: FlavorProfile;
  rating: number;
  reviewCount: number;
  /** Lowercased, accent-free name + brewery + style, used for searching. */
  searchText: string;
  /** Lowercased, accent-free name only, used for ranking search results. */
  searchName: string;
}

/** pandas `to_json()` output: { column: { rowIndex: value } } */
type Column<T> = Record<string, T>;
const data = rawData as unknown as Record<string, Column<string | number>>;

/** Lowercase and strip accents so "Münster" matches "munster". */
export const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .trim();

/**
 * Some names in the source data have the brewery glued onto the end, e.g.
 * "Keystone LightCoors Brewing Company (Molson-Coors)". Cut that suffix off.
 */
const cleanName = (name: string, brewery: string): string => {
  const firstWord = brewery.split(' ')[0].toLowerCase();
  const lower = name.toLowerCase();
  let i = lower.indexOf(firstWord, 1);
  while (i > 0) {
    const suffix = name.slice(i);
    if (!' (['.includes(name[i - 1]) && (suffix.endsWith(')') || suffix.endsWith('Ltd'))) {
      return name.slice(0, i).trim();
    }
    i = lower.indexOf(firstWord, i + 1);
  }
  return name;
};

const cleanDescription = (description: string): string =>
  description.replace(/^Notes:/, '').replace(/\t|\\t/g, ' ').trim();

const num = (column: string, key: string): number => Number(data[column][key]);
const str = (column: string, key: string): string => String(data[column][key] ?? '');

export const beers: Beer[] = Object.keys(data.Name).map((key) => {
  const brewery = str('Brewery', key);
  const name = cleanName(str('Name', key), brewery);
  const style = str('Style', key);
  return {
    id: Number(key),
    name,
    brewery,
    style,
    fullName: str('Beer Name (Full)', key),
    description: cleanDescription(str('Description', key)),
    abv: num('ABV', key),
    minIbu: num('Min IBU', key),
    maxIbu: num('Max IBU', key),
    flavor: {
      astringency: num('Astringency', key),
      body: num('Body', key),
      alcohol: num('Alcohol', key),
      bitter: num('Bitter', key),
      sweet: num('Sweet', key),
      sour: num('Sour', key),
      salty: num('Salty', key),
      fruits: num('Fruits', key),
      hoppy: num('Hoppy', key),
      spices: num('Spices', key),
      malty: num('Malty', key),
    },
    rating: num('review_overall', key),
    reviewCount: num('number_of_reviews', key),
    searchText: normalize(`${name} ${brewery} ${style}`),
    searchName: normalize(name),
  };
});

/** The most-reviewed beers, handy as suggestions. */
export const popularBeers = (count: number): Beer[] =>
  [...beers].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, count);
