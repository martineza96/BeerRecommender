"""Export top-10 description-similarity neighbors for the app.

Mirrors BeerEDA.ipynb cells 11-14 (preprocess_text, the 'note' substring
removal, dropping empty descriptions, default TfidfVectorizer) followed by
cosine similarity, then writes a compact neighbor list to
beerRecommenderApp/src/data/descriptionNeighbors.json shaped
{"<beerId>": [[neighborId, score], ...]}. Beer ids are the CSV row index,
which is the same index the app uses as Beer.id (beersDF.json keys).

Run from the repo root:
    .venv/bin/python scripts/export_description_similarity.py
"""
import json
import string
from pathlib import Path

import numpy as np
import pandas as pd
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "beer_profile_and_ratings.csv"
OUT_PATH = ROOT / "beerRecommenderApp" / "src" / "data" / "descriptionNeighbors.json"
TOP_N = 10
DECIMALS = 4


# Cell 11, unchanged.
def preprocess_text(text):
    tokens = word_tokenize(text.lower())
    tokens = [token for token in tokens if token not in string.punctuation]
    stop_words = set(stopwords.words("english"))
    tokens = [token for token in tokens if token not in stop_words]
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(token) for token in tokens]
    return " ".join(tokens)


def main():
    beer = pd.read_csv(CSV_PATH)

    n_nan = int(beer["Description"].isna().sum())
    if n_nan:
        print(f"Note: {n_nan} NaN descriptions treated as ''")
    raw = beer["Description"].fillna("")

    # Cell 12.
    descriptions = raw.apply(preprocess_text)
    descriptions = descriptions.map(lambda x: x.replace("note", ""))
    # Cell 13.
    descriptions = descriptions[descriptions != ""]
    ids = descriptions.index.to_numpy()  # matrix position -> beer id

    # Cell 14 + cell 16 (cosine similarity).
    vectorizer = TfidfVectorizer()
    description_vectors = vectorizer.fit_transform(descriptions)
    sim = cosine_similarity(description_vectors)

    neighbors = {}
    for pos, beer_id in enumerate(ids):
        row = sim[pos]
        cand = np.flatnonzero(row > 0)
        cand = cand[cand != pos]
        # Sort by score desc, then beer id asc for determinism.
        order = np.lexsort((ids[cand], -row[cand]))[:TOP_N]
        neighbors[int(beer_id)] = [
            [int(ids[c]), round(float(row[c]), DECIMALS)] for c in cand[order]
        ]

    out = {str(k): neighbors[k] for k in sorted(neighbors)}
    OUT_PATH.write_text(json.dumps(out, separators=(",", ":")) + "\n")

    size = OUT_PATH.stat().st_size
    print(f"Beers in CSV: {len(beer)}")
    print(f"Beers with descriptions (after preprocessing): {len(ids)}")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}: {size} bytes ({size / 1024:.1f} KB)")
    if size > 300 * 1024:
        print("WARNING: file exceeds 300 KB target")

    def show(beer_id):
        print(f"\n{beer_id} {beer.at[beer_id, 'Name']} ({beer.at[beer_id, 'Brewery']})")
        for nid, score in neighbors.get(beer_id, []):
            print(f"  {nid:>5}  {score:.4f}  {beer.at[nid, 'Name']} ({beer.at[nid, 'Brewery']})")

    show(1183)  # Stella Artois
    pliny = beer.index[beer["Name"] == "Pliny The Elder"]
    if len(pliny):
        show(int(pliny[0]))


if __name__ == "__main__":
    main()
