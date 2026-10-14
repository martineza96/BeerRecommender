import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { IonSearchbar } from '@ionic/react';
import { Beer, normalize } from '../data/beers';
import { searchBeers } from '../utils/searchBeers';
import './BeerSearch.css';

interface BeerSearchProps {
  onSelect: (beer: Beer) => void;
}

/** Bold the start of each name word that a query word matches. */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const queryWords = normalize(query).split(' ').filter(Boolean);
  return (
    <>
      {text.split(/(\s+)/).map((part, i) => {
        const word = normalize(part);
        const match = queryWords.find((q) => word.startsWith(q));
        if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;
        // Normalizing can drop characters (accents, apostrophes), so only highlight
        // by length when the original word's prefix lines up.
        const length = normalize(part.slice(0, match.length)) === match ? match.length : part.length;
        return (
          <React.Fragment key={i}>
            <mark>{part.slice(0, length)}</mark>
            {part.slice(length)}
          </React.Fragment>
        );
      })}
    </>
  );
};

const BeerSearch: React.FC<BeerSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep typing responsive; results catch up a frame later if filtering is slow.
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => searchBeers(deferredQuery), [deferredQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const select = (beer: Beer) => {
    onSelect(beer);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
    } else if (!open || !results.length) {
      return;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(results[activeIndex]);
    }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div className="beer-search" ref={containerRef} onKeyDown={handleKeyDown}>
      <IonSearchbar
        className="beer-search__input"
        value={query}
        placeholder="Search beers, breweries or styles…"
        onIonInput={(e) => {
          setQuery(e.detail.value ?? '');
          setActiveIndex(0);
          setOpen(true);
        }}
        onIonFocus={() => setOpen(true)}
      />
      {showDropdown && (
        <ul className="beer-search__results" role="listbox">
          {results.length === 0 && <li className="beer-search__empty">No beers found for “{query}”</li>}
          {results.map((beer, index) => (
            <li
              key={beer.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`beer-search__result${index === activeIndex ? ' is-active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => select(beer)}
            >
              <span className="beer-search__name">
                <Highlight text={beer.name} query={deferredQuery} />
              </span>
              <span className="beer-search__meta">
                {beer.brewery} · {beer.style} · {beer.abv}% ABV
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BeerSearch;
