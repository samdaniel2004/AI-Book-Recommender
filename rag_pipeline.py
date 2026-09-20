import faiss
import numpy as np
import pandas as pd

from sentence_transformers import SentenceTransformer
from huggingface_hub import InferenceClient

from reranker import rerank_books


# ============================================================
# 1. LOAD BOOK DATA
# ============================================================

print("Loading books...")

df = pd.read_csv("data/books.csv")

print(f"Loaded {len(df)} books")


# ============================================================
# 2. LOAD BGE-M3 EMBEDDING MODEL
# ============================================================

print("\nLoading BGE-M3...")

embedding_model = SentenceTransformer(
    "BAAI/bge-m3"
)

print("BGE-M3 loaded successfully!")


# ============================================================
# 3. LOAD FAISS VECTOR INDEX
# ============================================================

print("\nLoading FAISS index...")

index = faiss.read_index(
    "vectorstore/books.index"
)

print(f"FAISS loaded successfully!")
print(f"FAISS vectors: {index.ntotal}")


# ============================================================
# 4. CONNECT TO QWEN LLM
# ============================================================

print("\nConnecting to Qwen...")

client = InferenceClient()

print("Qwen connection ready!")


# ============================================================
# 5. RETRIEVE BOOKS USING FAISS
# ============================================================

def retrieve_books(query, k=20):

    # Convert user query into an embedding
    query_embedding = embedding_model.encode(
        [query],
        normalize_embeddings=True
    )

    # Convert to FAISS-compatible format
    query_embedding = np.asarray(
        query_embedding,
        dtype="float32"
    )

    # Search FAISS
    scores, indices = index.search(
        query_embedding,
        k
    )

    results = []

    for score, idx in zip(scores[0], indices[0]):

        # Safety check
        if idx < 0 or idx >= len(df):
            continue

        book = df.iloc[idx]

        results.append({
            "title": str(book["title"]),
            "author": str(book["name"]),
            "genres": str(book["genres"]),
            "description": str(book["description"]),
            "rating": str(book["book_rating"]),
            "score": float(score)
        })

    return results


# ============================================================
# 6. CREATE RAG CONTEXT
# ============================================================

def create_context(books):

    context = ""

    for i, book in enumerate(books, start=1):

        context += f"""
Book {i}
Title: {book["title"]}
Author: {book["author"]}
Genres: {book["genres"]}
Description: {book["description"]}
Rating: {book["rating"]}
Reranker Score: {book.get("rerank_score", "N/A")}

"""

    return context


# ============================================================
# 7. GENERATE ANSWER USING QWEN
# ============================================================

def generate_answer(query, context):

    system_prompt = """
You are an AI book recommendation assistant.

Your job is to recommend books based ONLY on the
book information provided in the retrieved context.

Rules:

1. Do not invent books.
2. Do not invent authors.
3. Do not invent ratings.
4. Do not invent genres.
5. Do not invent descriptions.
6. Use the retrieved information to answer the user.
7. Explain briefly why each recommendation matches.
8. If the retrieved information is insufficient, say so.
9. Keep the response conversational and useful.
"""

    user_prompt = f"""
User request:

{query}

Retrieved book information:

{context}

Based only on the retrieved information,
recommend the most relevant books for the user.

For each recommendation, mention:
- Book title
- Author
- Why it matches the request

Do not add information that is not present in the retrieved data.
"""

    response = client.chat.completions.create(
        model="Qwen/Qwen3-4B-Instruct-2507",

        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],

        max_tokens=500
    )

    return response.choices[0].message.content


# ============================================================
# 8. MAIN CHAT LOOP
# ============================================================

print("\n==============================================")
print("        AI BOOK RAG CHATBOT")
print("==============================================")
print("Type your book request.")
print("Type 'exit' to stop the chatbot.")
print("==============================================")


while True:

    query = input("\nYou: ")

    # Exit condition
    if query.lower().strip() == "exit":

        print("\nGoodbye!")
        break


    # --------------------------------------------------------
    # Retrieve 20 candidates from FAISS
    # --------------------------------------------------------

    print("\nSearching books...")

    candidates = retrieve_books(
        query,
        k=20
    )

    print(
        f"Retrieved {len(candidates)} candidate books."
    )


    # --------------------------------------------------------
    # Rerank candidates
    # --------------------------------------------------------

    print("Reranking books...")

    books = rerank_books(
        query,
        candidates,
        top_k=5
    )

    print(
        f"Selected top {len(books)} books."
    )


    # --------------------------------------------------------
    # Create RAG context
    # --------------------------------------------------------

    context = create_context(
        books
    )


    # --------------------------------------------------------
    # Generate LLM response
    # --------------------------------------------------------

    print("Generating AI response...")

    answer = generate_answer(
        query,
        context
    )


    # --------------------------------------------------------
    # Display answer
    # --------------------------------------------------------

    print("\n==============================================")
    print("AI BOOK ASSISTANT")
    print("==============================================")

    print(answer)

    print("==============================================")