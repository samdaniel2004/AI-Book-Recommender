from datasets import load_dataset
import pandas as pd
import os


print("Loading Goodreads dataset...")

dataset = load_dataset(
    "recmeapp/goodreads",
    "app_meta"
)

books = dataset["train"]

print(f"Total records: {len(books)}")


# Convert to pandas
df = books.to_pandas()


# Columns we want
columns_to_keep = [
    "book_id",
    "title",
    "name",
    "description",
    "genres",
    "publication_year",
    "book_rating",
    "ratings_count",
    "publisher",
    "language_code",
    "num_pages",
    "format",
    "similar_book_names"
]

df = df[columns_to_keep]


# Replace missing values
for column in columns_to_keep:
    df[column] = df[column].fillna("")


# Convert everything to string where necessary
df["title"] = df["title"].astype(str)
df["name"] = df["name"].astype(str)
df["description"] = df["description"].astype(str)
df["genres"] = df["genres"].astype(str)


# Create text for the embedding model
df["text"] = (
    "Title: " + df["title"] +
    "\nAuthor: " + df["name"] +
    "\nGenres: " + df["genres"] +
    "\nDescription: " + df["description"] +
    "\nPublication Year: " + df["publication_year"].astype(str) +
    "\nRating: " + df["book_rating"].astype(str)
)


# Remove records without a title
df = df[df["title"].str.strip() != ""]


# Remove duplicate books
df = df.drop_duplicates(subset=["book_id"])


# Create data folder if it doesn't exist
os.makedirs("data", exist_ok=True)


# Save cleaned dataset
output_path = "data/books.csv"

df.to_csv(
    output_path,
    index=False,
    encoding="utf-8"
)


print("\n================================")
print("Dataset preparation completed!")
print("================================")

print(f"Books saved: {len(df)}")
print(f"File created: {output_path}")

print("\nColumns:")
print(df.columns.tolist())

print("\nFirst book:")
print(df.iloc[0])