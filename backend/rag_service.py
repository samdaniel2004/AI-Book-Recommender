from pathlib import Path

import faiss
import pandas as pd
from sentence_transformers import SentenceTransformer, CrossEncoder
from huggingface_hub import InferenceClient


BASE_DIR = Path(__file__).resolve().parent.parent

BOOKS_PATH = BASE_DIR / "data" / "books.csv"
INDEX_PATH = BASE_DIR / "vectorstore" / "books.index"


books = pd.read_csv(BOOKS_PATH)

embedding_model = SentenceTransformer(
    "BAAI/bge-m3"
)

index = faiss.read_index(
    str(INDEX_PATH)
)

reranker = CrossEncoder(
    "BAAI/bge-reranker-v2-m3"
)

client = InferenceClient()


def retrieve_books(query: str, k: int = 20):
    query_embedding = embedding_model.encode(
        [query],
        normalize_embeddings=True,
    )

    query_embedding = query_embedding.astype(
        "float32"
    )

    scores, indices = index.search(
        query_embedding,
        k,
    )

    results = []
    seen_book_ids = set()

    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue

        book = books.iloc[int(idx)].copy()

        book_id = str(
            book.get("book_id", "")
        )

        if book_id and book_id in seen_book_ids:
            continue

        if book_id:
            seen_book_ids.add(book_id)

        book["score"] = float(score)

        results.append(book)

    if not results:
        return pd.DataFrame()

    return pd.DataFrame(results)


def rerank_books(
    query: str,
    candidate_books: pd.DataFrame,
    top_k: int = 5,
):
    if candidate_books.empty:
        return candidate_books

    pairs = []

    for _, book in candidate_books.iterrows():
        text = (
            f"Title: {book.get('title', '')}\n"
            f"Author: {book.get('name', '')}\n"
            f"Genres: {book.get('genres', '')}\n"
            f"Description: {book.get('description', '')}\n"
            f"Rating: {book.get('book_rating', '')}"
        )

        pairs.append([query, text])

    rerank_scores = reranker.predict(pairs)

    result = candidate_books.copy()

    result["rerank_score"] = rerank_scores

    result = result.sort_values(
        by="rerank_score",
        ascending=False,
    )

    return result.head(top_k)


def create_context(
    recommended_books: pd.DataFrame,
):
    context_parts = []

    for i, (_, book) in enumerate(
        recommended_books.iterrows(),
        start=1,
    ):
        context_parts.append(
            f"""
Book {i}
Title: {book.get('title', '')}
Author: {book.get('name', '')}
Genres: {book.get('genres', '')}
Description: {book.get('description', '')}
Publication Year: {book.get('publication_year', '')}
Rating: {book.get('book_rating', '')}
Publisher: {book.get('publisher', '')}
Pages: {book.get('num_pages', '')}
"""
        )

    return "\n".join(context_parts)


def rewrite_query(
    query: str,
    history=None,
):
    if not history:
        return query

    conversation = []

    for message in history[-10:]:
        role = message.get("role")
        content = message.get("content")

        if role in ["user", "assistant"] and content:
            conversation.append(
                f"{role.upper()}: {content}"
            )

    conversation_text = "\n".join(conversation)

    prompt = f"""
Rewrite the user's latest message into a standalone
search query that can be used to search a book database.

Use the conversation history to resolve references such as:
- "that book"
- "which one"
- "the second one"
- "more like this"
- "that author"

Rules:
1. Preserve the user's original intent.
2. Include important book-related context from the conversation.
3. Do not answer the question.
4. Return ONLY the rewritten search query.
5. Keep it concise.

Conversation history:

{conversation_text}

Latest user message:

{query}

Standalone search query:
"""

    response = client.chat.completions.create(
        model="Qwen/Qwen3-4B-Instruct-2507",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        max_tokens=100,
        temperature=0.1,
    )

    return (
        response.choices[0]
        .message
        .content
        .strip()
    )


def generate_answer(
    query: str,
    context: str,
    history=None,
):
    if history is None:
        history = []

    messages = [
        {
            "role": "system",
            "content": f"""
You are an AI book recommendation assistant.

Use ONLY the retrieved book context to answer.

Rules:

1. Do not invent books.
2. Do not invent authors.
3. Do not invent ratings.
4. Do not invent genres.
5. Do not invent publication years.
6. Do not make unsupported claims.
7. Use conversation history to understand follow-up questions.
8. Give concise and useful recommendations.
9. Explain why a book matches when appropriate.
10. If the context is insufficient, say so clearly.

Retrieved book context:

{context}
""",
        }
    ]

    for message in history[-10:]:
        role = message.get("role")
        content = message.get("content")

        if role in ["user", "assistant"] and content:
            messages.append(
                {
                    "role": role,
                    "content": content,
                }
            )

    messages.append(
        {
            "role": "user",
            "content": query,
        }
    )

    response = client.chat.completions.create(
        model="Qwen/Qwen3-4B-Instruct-2507",
        messages=messages,
        max_tokens=500,
        temperature=0.3,
    )

    return (
        response.choices[0]
        .message
        .content
    )


def chat_with_books(
    query: str,
    history=None,
):
    if history is None:
        history = []

    standalone_query = rewrite_query(
        query,
        history,
    )

    retrieved_books = retrieve_books(
        standalone_query,
        k=20,
    )

    recommended_books = rerank_books(
        standalone_query,
        retrieved_books,
        top_k=5,
    )

    context = create_context(
        recommended_books
    )

    answer = generate_answer(
        query,
        context,
        history,
    )

    recommendations = []

    for _, book in recommended_books.iterrows():
        recommendations.append(
            {
                "title": str(
                    book.get("title", "")
                ),
                "author": str(
                    book.get("name", "")
                ),
                "genres": str(
                    book.get("genres", "")
                ),
                "description": str(
                    book.get("description", "")
                ),
                "rating": str(
                    book.get("book_rating", "")
                ),
                "score": float(
                    book.get("score", 0)
                ),
                "rerank_score": float(
                    book.get(
                        "rerank_score",
                        0,
                    )
                ),
            }
        )

    return {
        "answer": answer,
        "recommendations": recommendations,
    }