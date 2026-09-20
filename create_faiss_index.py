import faiss
import numpy as np
import os

print("Loading embeddings...")

# Load BGE-M3 embeddings
embeddings = np.load("embeddings/book_embeddings.npy")

print("Embedding shape:", embeddings.shape)

# Create FAISS index
dimension = embeddings.shape[1]

index = faiss.IndexFlatIP(dimension)

# Add embeddings to FAISS
index.add(embeddings)

print("FAISS index created successfully!")
print("Number of vectors:", index.ntotal)

# Create vectorstore folder
os.makedirs("vectorstore", exist_ok=True)

# Save FAISS index
faiss.write_index(
    index,
    "vectorstore/books.index"
)

print("FAISS index saved successfully!")
print("Location: vectorstore/books.index")