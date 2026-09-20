"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Recommendation {
  title: string;
  author: string;
  genres: string;
  description: string;
  rating: string;
  score: number;
  rerank_score: number;
}

interface ChatResponse {
  answer: string;
  recommendations: Recommendation[];
}

const suggestions = [
  "A dark fantasy with ancient kingdoms",
  "A science fiction story about artificial intelligence",
  "A mystery with a haunting atmosphere",
  "A book about wisdom and self-discovery",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    [],
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (customMessage?: string) => {
    const text = (customMessage ?? message).trim();

    if (!text || loading) return;

    const previousMessages = [...messages];

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setError("");
    setLoading(true);
    setRecommendations([]);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: text,
    history: previousMessages,
  }),
});

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const data: ChatResponse = await response.json();

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);

      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error(err);

      setError(
        "The Librarian could not reach the recommendation engine. Please make sure the FastAPI backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const startNewChapter = () => {
    setMessages([]);
    setRecommendations([]);
    setMessage("");
    setError("");
  };

  return (
    <main className="library-page">
      {/* =====================================================
          LIBRARY BACKGROUND
      ====================================================== */}

      <div className="library-background" />

      <div className="library-vignette" />

      <div className="library-light" />

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="library-content">

        {/* HEADER */}

        <header className="library-header">

          <div className="brand">

            <div className="brand-symbol">
              ✦
            </div>

            <div>
              <div className="brand-title">
                THE LIBRARY
              </div>

              <div className="brand-subtitle">
                INTELLIGENT BOOK DISCOVERY
              </div>
            </div>

          </div>

          <div className="header-actions">

            <div className="librarian-label">
              THE LIBRARIAN
            </div>

            <button
              onClick={startNewChapter}
              className="new-chapter-button"
            >
              New Chapter
            </button>

          </div>

        </header>

        {/* =====================================================
            MAIN
        ====================================================== */}

        <section className="library-main">

          {/* EMPTY / HERO STATE */}

          {messages.length === 0 && !loading && (
            <div className="hero">

              <div className="ornament">
                <span />
                <span>✦</span>
                <span />
              </div>

              <div className="eyebrow">
                A CONVERSATION WITH THE LIBRARIAN
              </div>

              <h1 className="hero-title">
                What story
                <span>calls to you?</span>
              </h1>

              <p className="hero-description">
                Tell me the world you wish to enter, the feeling you seek,
                or the story you have been longing to discover.
              </p>

              {/* =================================================
                  MANUSCRIPT INPUT
              ================================================== */}

              <div className="manuscript">

                <div className="manuscript-top">
                  <span>
                    A NOTE TO THE LIBRARIAN
                  </span>

                  <span>
                    ✦
                  </span>
                </div>

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows={4}
                  placeholder="Write what you wish to read..."
                />

                <div className="manuscript-footer">

                  <span className="manuscript-hint">
                    Press Enter to begin your search
                  </span>

                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !message.trim()}
                    className="consult-button"
                  >
                    Consult the Librarian
                    <span>→</span>
                  </button>

                </div>

              </div>

              {/* =================================================
                  SUGGESTIONS
              ================================================== */}

              <div className="suggestions">

                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="suggestion"
                  >
                    {suggestion}
                  </button>
                ))}

              </div>

            </div>
          )}

          {/* =====================================================
              CONVERSATION
          ====================================================== */}

          {messages.length > 0 && (
            <div className="conversation">

              <div className="conversation-heading">

                <div className="ornament">
                  <span />
                  <span>✦</span>
                  <span />
                </div>

                <div className="eyebrow">
                  THE READING TABLE
                </div>

              </div>

              <div className="messages">

                {messages.map((item, index) => (

                  <div
                    key={`${item.role}-${index}`}
                    className={
                      item.role === "user"
                        ? "message-row user-row"
                        : "message-row librarian-row"
                    }
                  >

                    {item.role === "user" ? (

                      <div className="user-message">

                        <div className="message-label">
                          YOU
                        </div>

                        <div>
                          {item.content}
                        </div>

                      </div>

                    ) : (

                      <div className="librarian-message">

                        <div className="librarian-message-header">

                          <span className="small-symbol">
                            ✦
                          </span>

                          <span>
                            THE LIBRARIAN
                          </span>

                        </div>

                        <div className="librarian-message-body">
                          {item.content}
                        </div>

                      </div>

                    )}

                  </div>

                ))}

                {/* LOADING */}

                {loading && (

                  <div className="message-row librarian-row">

                    <div className="librarian-message loading-message">

                      <div className="librarian-message-header">

                        <span className="small-symbol">
                          ✦
                        </span>

                        <span>
                          THE LIBRARIAN
                        </span>

                      </div>

                      <div className="searching">

                        <span>
                          Searching the ancient shelves
                        </span>

                        <div className="loading-dots">
                          <span />
                          <span />
                          <span />
                        </div>

                      </div>

                    </div>

                  </div>

                )}

              </div>

            </div>
          )}

          {/* =====================================================
              ERROR
          ====================================================== */}

          {error && (

            <div className="error-message">
              {error}
            </div>

          )}

          {/* =====================================================
              RECOMMENDATIONS
          ====================================================== */}

          {recommendations.length > 0 && !loading && (

            <section className="recommendations">

              <div className="section-heading">

                <div className="ornament">
                  <span />
                  <span>✦</span>
                  <span />
                </div>

                <div className="eyebrow">
                  FROM THE SHELVES
                </div>

                <h2>
                  Selected for you
                </h2>

                <p>
                  Volumes discovered through the library&apos;s
                  collection.
                </p>

              </div>

              <div className="book-grid">

                {recommendations.map((book, index) => {

                  const genres = book.genres
                    ? book.genres
                        .split(",")
                        .map((genre) => genre.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                    : [];

                  return (

                    <article
                      key={`${book.title}-${index}`}
                      className="book-card"
                    >

                      <div className="book-spine" />

                      <div className="book-card-content">

                        <div className="book-number">
                          VOLUME {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="book-rating">
                          ★ {book.rating || "—"}
                        </div>

                        <h3>
                          {book.title}
                        </h3>

                        <p className="book-author">
                          {book.author}
                        </p>

                        {genres.length > 0 && (

                          <div className="book-genres">

                            {genres.map((genre) => (
                              <span key={genre}>
                                {genre}
                              </span>
                            ))}

                          </div>

                        )}

                        <div className="book-rule" />

                        <p className="book-description">
                          {book.description ||
                            "No description available."}
                        </p>

                        <div className="book-footer">

                          <span>
                            DISCOVERED BY THE LIBRARIAN
                          </span>

                          <span>
                            ✦
                          </span>

                        </div>

                      </div>

                    </article>

                  );
                })}

              </div>

            </section>

          )}

        </section>

        {/* =====================================================
            CHAT INPUT AFTER CONVERSATION
        ====================================================== */}

        {messages.length > 0 && (

          <div className="floating-input-area">

            <div className="floating-input">

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                rows={2}
                placeholder="Continue your conversation with the Librarian..."
              />

              <button
                onClick={() => sendMessage()}
                disabled={loading || !message.trim()}
              >
                →
              </button>

            </div>

          </div>

        )}

        {/* FOOTER */}

        <footer className="library-footer">
          <span>THE LIBRARIAN</span>
          <span>✦</span>
          <span>RETRIEVAL AUGMENTED GENERATION</span>
        </footer>

      </div>
    </main>
  );
}