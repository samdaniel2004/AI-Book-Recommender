[README (1).md](https://github.com/user-attachments/files/32432014/README.1.md)
# AI-Book-Recommender# AI Book Recommender

A conversational, RAG-based AI book recommendation system that combines semantic retrieval, reranking, and an instruction-tuned LLM to recommend books from a curated Goodreads-derived dataset.

## Overview

The application lets users describe what they want to read in natural language and continue the conversation with follow-up questions. The system rewrites follow-up questions into standalone retrieval queries, searches the book collection with dense embeddings, reranks the most relevant results, and generates a grounded response using only the retrieved book context.

## Architecture

```text
User
  ↓
Next.js / React Frontend
  ↓
FastAPI Backend
  ↓
Conversational Query Rewriting
  ↓
BGE-M3 Embeddings
  ↓
FAISS Vector Search
  ↓
BGE Reranker v2 M3
  ↓
Top Relevant Book Context
  ↓
Qwen3-4B-Instruct-2507
  ↓
Grounded Answer + Recommendations
```

## RAG Workflow

1. **Load dataset**
   - Dataset: `recmeapp/goodreads`
   - Configuration: `app_meta`
   - Selected metadata includes title, author, description, genres, publication year, rating, ratings count, publisher, language, page count, format, and similar book names.

2. **Prepare documents**
   - Book metadata is cleaned and combined into a searchable text representation.
   - The prepared dataset is saved as `data/books.csv`.

3. **Create embeddings**
   - Model: `BAAI/bge-m3`
   - Book text is converted into dense vector embeddings.
   - Embeddings are normalized and stored in `embeddings/book_embeddings.npy`.

4. **Build FAISS index**
   - FAISS `IndexFlatIP` is used for vector similarity search.
   - The index is saved as `vectorstore/books.index`.

5. **Handle conversational queries**
   - Conversation history is passed from the frontend to the backend.
   - A query-rewriting step converts follow-up messages into standalone search queries before retrieval.

6. **Retrieve and rerank**
   - FAISS retrieves semantically similar books.
   - `BAAI/bge-reranker-v2-m3` reranks the retrieved candidates to improve relevance.

7. **Generate grounded response**
   - Model: `Qwen/Qwen3-4B-Instruct-2507`
   - The LLM receives the user's request and the selected book context.
   - The prompt instructs the model to stay grounded in the retrieved information and produce recommendations from that context.

## Technology Stack

### Backend

- Python
- FastAPI
- Hugging Face Hub / `InferenceClient`
- FAISS
- BGE-M3 embeddings
- BGE reranker
- Qwen3-4B-Instruct-2507

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Custom gothic / medieval library interface

### Data / Retrieval

- Goodreads-derived dataset from Hugging Face
- Pandas
- Dense vector retrieval
- FAISS similarity search
- Cross-encoder-style reranking

## Project Structure

```text
AI-Book-Recommender/
├── backend/
│   ├── __init__.py
│   ├── main.py
│   └── rag_service.py
├── data/
│   └── books.csv
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── public/
│   │   └── library-bg.png
│   ├── package.json
│   └── ...
├── create_embeddings.py
├── create_faiss_index.py
├── download_dataset.py
├── prepare_dataset.py
├── rag_pipeline.py
├── reranker.py
├── test_faiss_search.py
├── test_huggingface.py
├── test_llm.py
├── test_reranker.py
├── requirements.txt
├── .gitignore
└── README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/samdaniel2004/AI-Book-Recommender.git
cd AI-Book-Recommender
```

### 2. Create and activate a Python environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Hugging Face access

Create a local `.env` file and add the Hugging Face access token using the environment variable expected by the backend configuration. Do not commit the `.env` file.

### 5. Prepare the dataset

If `data/books.csv` is not available, run the dataset download and preparation scripts:

```bash
python download_dataset.py
python prepare_dataset.py
```

### 6. Create embeddings and FAISS index

Generated retrieval artifacts are intentionally excluded from GitHub.

```bash
python create_embeddings.py
python create_faiss_index.py
```

This creates:

```text
embeddings/book_embeddings.npy
vectorstore/books.index
```

### 7. Start the FastAPI backend

From the project root:

```bash
python -m uvicorn backend.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

### 8. Start the Next.js frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

## API

### `GET /`

Health check for the backend.

### `POST /chat`

Accepts a user message and optional conversation history.

Example request:

```json
{
  "message": "Recommend a science-fiction book about space exploration",
  "history": []
}
```

The backend returns a generated response together with the recommendation information produced by the RAG pipeline.

## Key Features

- Conversational book recommendations
- Follow-up question understanding through query rewriting
- Semantic search using dense embeddings
- FAISS vector retrieval
- Reranking for improved relevance
- Grounded LLM responses
- FastAPI backend with CORS support
- Next.js / React web interface
- Custom gothic, medieval library-inspired UI
- Clear separation between source data, retrieval artifacts, backend, and frontend

## Generated Files and Git

The following are intentionally excluded from version control:

```text
.venv/
.venv_broken/
.venv_old/
frontend/node_modules/
frontend/.next/
embeddings/
vectorstore/
.env
```

Embeddings and the FAISS index can be regenerated locally using the provided scripts.

## Models

| Component | Model / Technology | Purpose |
|---|---|---|
| Embeddings | `BAAI/bge-m3` | Convert book text and queries into vectors |
| Reranker | `BAAI/bge-reranker-v2-m3` | Reorder retrieved books by relevance |
| LLM | `Qwen/Qwen3-4B-Instruct-2507` | Generate grounded conversational responses |
| Vector Store | FAISS `IndexFlatIP` | Similarity search over book embeddings |

## Future Improvements

- Persistent chat sessions
- Streaming token responses
- Better recommendation explanations
- User preference profiles
- Hybrid lexical + vector retrieval
- Evaluation with retrieval and answer-quality metrics
- Containerized deployment
- Production monitoring and observability

## Author

**Sam Daniel**

AI/ML Engineer | Generative AI | RAG | Computer Vision

GitHub: https://github.com/samdaniel2004
