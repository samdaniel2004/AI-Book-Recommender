from sentence_transformers import SentenceTransformer
import pandas as pd
import numpy as np
import os

# Load processed dataset
print("Loading books.csv...")

df = pd.read_csv("data/books.csv")

print(f"Total books: {len(df)}")


# Load embedding model
print("\nLoading BGE-M3...")

model = SentenceTransformer("BAAI/bge-m3")

print("BGE-M3 loaded successfully!")


# Create embeddings
print("\nCreating embeddings...")

embeddings = model.encode(
    df["text"].tolist(),
    batch_size=16,
    show_progress_bar=True,
    normalize_embeddings=True
)


# Convert to float32
embeddings = np.asarray(
    embeddings,
    dtype="float32"
)


# Display shape
print("\nEmbedding creation completed!")

print("Embedding shape:", embeddings.shape)


# Create embeddings folder
os.makedirs("embeddings", exist_ok=True)


# Save embeddings
np.save(
    "embeddings/book_embeddings.npy",
    embeddings
)

print("\nEmbeddings saved successfully!")
print("Location: embeddings/book_embeddings.npy")