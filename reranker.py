from sentence_transformers import CrossEncoder

print("Loading BGE reranker...")

reranker = CrossEncoder(
    "BAAI/bge-reranker-v2-m3"
)

print("BGE reranker loaded successfully!")


def rerank_books(query, books, top_k=5):

    pairs = []

    for book in books:

        book_text = f"""
Title: {book["title"]}
Author: {book["author"]}
Genres: {book["genres"]}
Description: {book["description"]}
Rating: {book["rating"]}
"""

        pairs.append([
            query,
            book_text
        ])

    scores = reranker.predict(pairs)

    ranked_books = []

    for book, score in zip(books, scores):

        book_copy = book.copy()
        book_copy["rerank_score"] = float(score)

        ranked_books.append(book_copy)

    ranked_books.sort(
        key=lambda x: x["rerank_score"],
        reverse=True
    )

    return ranked_books[:top_k]