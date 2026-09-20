from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.rag_service import chat_with_books


app = FastAPI(
    title="AI Book Recommendation API",
    description="Conversational RAG-based AI book recommendation chatbot",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = Field(default_factory=list)


@app.get("/")
def home():
    return {
        "message": "AI Book Recommendation API is running"
    }


@app.post("/chat")
def chat(request: ChatRequest):
    history = [
        {
            "role": message.role,
            "content": message.content,
        }
        for message in request.history
    ]

    return chat_with_books(
        request.message,
        history,
    )