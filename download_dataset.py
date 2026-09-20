from datasets import load_dataset

dataset = load_dataset(
    "recmeapp/goodreads",
    "app_meta"
)

books = dataset["train"]

print("\n========== ALL COLUMNS ==========")

for i, column in enumerate(books.column_names, 1):
    print(f"{i}. {column}")

