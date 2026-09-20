import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

print("Loading books...")
df = pd.read_csv("data/books.csv")

print("Loading BGE-M3...")
model = SentenceTransformer("BAAI/bge-m3")

print("Loading FAISS index...")
index = faiss.read_index("vectorstore/books.index")

print("Everything loaded successfully!")
print("Total books:", len(df))
print("FAISS vectors:", index.ntotal)

# User query
query = input("\nEnter your book request: ")

print("\nCreating query embedding...")

query_embedding = model.encode(
    [query],
    normalize_embeddings=True
)

query_embedding = np.asarray(
    query_embedding,
    dtype="float32"
)

# Search FAISS
k = 5

scores, indices = index.search(
    query_embedding,
    k
)

print("\n===== SEARCH RESULTS =====")

for rank, (score, idx) in enumerate(
    zip(scores[0], indices[0]),
    start=1
):
    book = df.iloc[idx]

    print(f"\n{rank}. {book['title']}")
    print(f"Author: {book['name']}")
    print(f"Genres: {book['genres']}")
    print(f"Rating: {book['book_rating']}")
    print(f"Similarity Score: {score:.4f}")