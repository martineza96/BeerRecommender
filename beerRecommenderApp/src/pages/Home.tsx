import React, { useRef, useState } from 'react';
import { IonChip, IonContent, IonIcon, IonPage } from '@ionic/react';
import { beerOutline, star, starHalf, starOutline } from 'ionicons/icons';
import BeerSearch from '../components/BeerSearch';
import { Beer, popularBeers } from '../data/beers';
import { recommend } from '../utils/recommend';
import './Home.css';

const suggestions = popularBeers(6);

const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="stars" aria-label={`${rating.toFixed(1)} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <IonIcon key={n} icon={rating >= n ? star : rating >= n - 0.5 ? starHalf : starOutline} />
    ))}
  </span>
);

interface BeerDetailsProps {
  beer: Beer;
  onSelect: (beer: Beer) => void;
}

const BeerDetails: React.FC<BeerDetailsProps> = ({ beer, onSelect }) => (
  <article className="beer-card">
    <header>
      <p className="beer-card__brewery">{beer.brewery}</p>
      <h2 className="beer-card__name">{beer.name}</h2>
    </header>
    <div className="beer-card__stats">
      <IonChip color="primary" outline>{beer.style}</IonChip>
      <span className="beer-card__stat"><strong>{beer.abv}%</strong> ABV</span>
      <span className="beer-card__stat"><strong>{beer.minIbu}–{beer.maxIbu}</strong> IBU</span>
    </div>
    <div className="beer-card__rating">
      <Stars rating={beer.rating} />
      <span>
        {beer.rating.toFixed(2)} · {beer.reviewCount.toLocaleString()} reviews
      </span>
    </div>
    {beer.description && <p className="beer-card__description">{beer.description}</p>}

    <section className="beer-card__similar">
      <h3>Similar beers</h3>
      <p className="similar__hint">Based on flavor profile, ABV and bitterness.</p>
      <ul className="similar__list">
        {recommend(beer).map(({ beer: match, similarity }) => (
          <li key={match.id}>
            <button className="similar__item" onClick={() => onSelect(match)}>
              <span className="similar__score">{Math.round(similarity * 100)}%</span>
              <span className="similar__text">
                <strong>{match.name}</strong>
                <span>
                  {match.brewery} · {match.style} · {match.abv}% ABV
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  </article>
);

const Home: React.FC = () => {
  const [selected, setSelected] = useState<Beer | null>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);

  const selectBeer = (beer: Beer) => {
    setSelected(beer);
    contentRef.current?.scrollToTop(300);
  };

  return (
    <IonPage>
      <IonContent fullscreen ref={contentRef}>
        <div className="home">
          <section className="hero">
            <IonIcon icon={beerOutline} className="hero__icon" />
            <h1>Find your next beer</h1>
            <p>Search a beer you love and we&apos;ll help you discover others like it.</p>
            <BeerSearch onSelect={selectBeer} />
            {!selected && (
              <div className="suggestions">
                <span>Popular:</span>
                {suggestions.map((beer) => (
                  <IonChip key={beer.id} onClick={() => selectBeer(beer)}>
                    {beer.name}
                  </IonChip>
                ))}
              </div>
            )}
          </section>

          {selected && <BeerDetails beer={selected} onSelect={selectBeer} />}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
