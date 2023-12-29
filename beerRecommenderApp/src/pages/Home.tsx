import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel } from '@ionic/react';
import './Home.css';
import rawData from '../data/beersDF.json';

const transformData = (data) => {
  const transformed = Object.keys(data.Name).map(key => {
    return {
      Name: data.Name[key],
      Style: data.Style[key],
      // Add other attributes as per your JSON structure
      Brewery: data.Brewery[key],
      BeerNameFull: data["Beer Name (Full)"][key],
      Description: data["Description"][key],
      ABV: data.ABV[key]
    };
  });
  return transformed;
};

const beerData = transformData(rawData);

console.log(beerData);

const Home: React.FC = () => {
  // Get only the first 5 beers
  const firstFiveBeers = beerData.slice(0, 5);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Beer Recommendations</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          {firstFiveBeers.map((beer, index) => (
            <IonItem key={index}>
              <IonLabel>
                <h2>{beer.Name}</h2>
                <p>{beer.Style}</p>
                <p>{beer.Brewery}</p>
                <p>{beer.Description}</p>
                <p>{beer.ABV}</p>
                {/* Display other beer attributes here */}
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Home;