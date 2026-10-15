import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonButton, IonContent, IonIcon, IonPage, IonRange, IonToggle } from '@ionic/react';
import { optionsOutline, refreshOutline } from 'ionicons/icons';
import { Beer } from '../data/beers';
import { TASTE_FEATURES, TasteKey, TastePrefs, matchBeers } from '../utils/tasteProfile';
import './Home.css';
import './TasteProfile.css';

interface SliderState {
  value: number;
  enabled: boolean;
}

type Sliders = Record<TasteKey, SliderState>;

const DEFAULT_VALUE = 50;

const defaultSliders = (): Sliders =>
  Object.fromEntries(
    TASTE_FEATURES.map((f) => [f.key, { value: DEFAULT_VALUE, enabled: true }]),
  ) as Sliders;

const toPrefs = (sliders: Sliders): TastePrefs => {
  const prefs: TastePrefs = {};
  for (const { key } of TASTE_FEATURES) {
    if (sliders[key].enabled) prefs[key] = sliders[key].value;
  }
  return prefs;
};

const TasteProfile: React.FC = () => {
  const history = useHistory();
  const [sliders, setSliders] = useState<Sliders>(defaultSliders);

  const prefs = useMemo(() => toPrefs(sliders), [sliders]);
  const results = useMemo(() => matchBeers(prefs), [prefs]);
  const noneEnabled = Object.keys(prefs).length === 0;
  const isDefault = TASTE_FEATURES.every(
    ({ key }) => sliders[key].enabled && sliders[key].value === DEFAULT_VALUE,
  );

  const update = (key: TasteKey, change: Partial<SliderState>) =>
    setSliders((current) => ({ ...current, [key]: { ...current[key], ...change } }));

  const openBeer = (beer: Beer) => history.push(`/home?beer=${beer.id}`);

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="home">
          <section className="hero">
            <IonIcon icon={optionsOutline} className="hero__icon" />
            <h1>Your taste profile</h1>
            <p>Slide toward what you like. The middle is a typical beer.</p>
          </section>

          <article className="beer-card taste-card">
            <header className="taste-card__header">
              <h2>What do you feel like?</h2>
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setSliders(defaultSliders())}
                disabled={isDefault}
              >
                <IonIcon slot="start" icon={refreshOutline} />
                Reset
              </IonButton>
            </header>

            <ul className="taste-sliders">
              {TASTE_FEATURES.map(({ key, label, low, high }) => {
                const { value, enabled } = sliders[key];
                return (
                  <li key={key} className={`taste-slider${enabled ? '' : ' is-off'}`}>
                    <div className="taste-slider__top">
                      <span className="taste-slider__label">{label}</span>
                      <IonToggle
                        className="taste-slider__toggle"
                        checked={!enabled}
                        labelPlacement="start"
                        onIonChange={(e) => update(key, { enabled: !e.detail.checked })}
                      >
                        Doesn&apos;t matter
                      </IonToggle>
                    </div>
                    <IonRange
                      aria-label={label}
                      min={0}
                      max={100}
                      step={1}
                      value={value}
                      disabled={!enabled}
                      onIonInput={(e) => update(key, { value: e.detail.value as number })}
                    >
                      <span slot="start" className="taste-slider__end">{low}</span>
                      <span slot="end" className="taste-slider__end">{high}</span>
                    </IonRange>
                  </li>
                );
              })}
            </ul>
          </article>

          <section className="beer-card taste-results">
            <h3>Best matches</h3>
            {noneEnabled ? (
              <p className="similar__hint">
                Pick at least one feature to see how well beers match. For now, here are the
                top-rated beers.
              </p>
            ) : (
              <p className="similar__hint">Beers with at least 10 reviews, closest to your profile.</p>
            )}
            <ul className="similar__list">
              {results.map(({ beer, match }) => (
                <li key={beer.id}>
                  <button className="similar__item" onClick={() => openBeer(beer)}>
                    <span className="similar__score">
                      {match === null ? `★ ${beer.rating.toFixed(1)}` : `${Math.round(match)}%`}
                    </span>
                    <span className="similar__text">
                      <strong>{beer.name}</strong>
                      <span>
                        {beer.brewery} · {beer.style} · {beer.abv}% ABV
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TasteProfile;
