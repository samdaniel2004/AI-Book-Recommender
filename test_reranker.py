from reranker import reranker

print("\nReranker test started!")

query = "A science fiction book about artificial intelligence"

book = """
Title: Example Science Fiction Book
Author: Example Author
Genres: Science Fiction, Technology
Description: A story exploring artificial intelligence and the future of technology.
Rating: 4.2
"""

score = reranker.predict([
    [query, book]
])

print("\nQuery:")
print(query)

print("\nReranker score:")
print(score[0])

print("\nReranker test completed successfully!")