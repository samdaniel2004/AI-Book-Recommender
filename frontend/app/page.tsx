"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
};

type Recommendation = {
  title: string;
  author?: string;
  name?: string;
  genres?: string | string[];
  book_rating?: number | string;
  rating?: number | string;
  publication_year?: number | string;
  description?: string;
  reason?: string;
};

type ChatResponse = {
  answer?: string;
  response?: string;
  message?: string;
  recommendations?: Recommendation[];
  books?: Recommendation[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const suggestions = [
  "Recommend a dark mystery with an intelligent protagonist",
  "I want a science-fiction book about space exploration",
  "Suggest a romantic novel with emotional depth",
  "Recommend a short book that will change how I think",
];

const initialMessage: Message = {
  id: "welcome-message",
  role: "assistant",
  content:
    "Welcome to the library. Tell me what kind of story, subject, atmosphere, or reading experience you seek, and I shall search the collection for you.",
};

function normalizeRecommendations(
  data: ChatResponse
): Recommendation[] {
  const items = data.recommendations ?? data.books ?? [];

  return Array.isArray(items) ? items : [];
}

function getRecommendationAuthor(book: Recommendation) {
  return book.author || book.name || "Unknown author";
}

function getRecommendationRating(book: Recommendation) {
  return book.book_rating ?? book.rating ?? "N/A";
}

function getRecommendationGenres(book: Recommendation) {
  if (!book.genres) {
    return "";
  }

  if (Array.isArray(book.genres)) {
    return book.genres.join(" • ");
  }

  return book.genres;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    initialMessage,
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [recommendations, setRecommendations] = useState<
    Recommendation[]
  >([]);

  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isProduction = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    );
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function sendMessage(messageText?: string) {
    const text = (messageText ?? input).trim();

    if (!text || isLoading) {
      return;
    }

    setError("");
    setInput("");

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: text,
    };

    const conversationHistory = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: conversationHistory,
        }),
      });

      if (!response.ok) {
        let serverMessage = "";

        try {
          const errorData = await response.json();

          serverMessage =
            errorData?.detail ||
            errorData?.message ||
            "";
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(
          serverMessage ||
            `Request failed with status ${response.status}`
        );
      }

      const data: ChatResponse = await response.json();

      const answer =
        data.answer ||
        data.response ||
        data.message ||
        "I could not generate a response from the library.";

      const newRecommendations =
        normalizeRecommendations(data);

      setRecommendations(newRecommendations);

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: answer,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (err) {
      console.error("Chat request failed:", err);

      const errorText =
        err instanceof Error
          ? err.message
          : isProduction
            ? "The library service is currently unavailable."
            : "Unable to connect to the FastAPI backend.";

      setError(errorText);

      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: "assistant",
        content:
          "The connection to the library has been interrupted. Please try again.",
      };

      setMessages((previous) => [
        ...previous,
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    await sendMessage();
  }

  function handleTextareaKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (input.trim() && !isLoading) {
        void sendMessage();
      }
    }
  }

  function clearConversation() {
    setMessages([initialMessage]);
    setRecommendations([]);
    setInput("");
    setError("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090706] text-[#efe6d3]">
      {/* Background */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/library-bg.png')",
        }}
      />

      {/* Dark cinematic overlay */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(44,31,20,0.12),rgba(3,2,2,0.88)_78%)]" />

      {/* Additional vignette */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black/35" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 pb-24 pt-5 sm:px-6 lg:px-10">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#c9ad79]/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9ad79]/40 bg-black/30 text-[#d9bc83] shadow-[0_0_25px_rgba(201,173,121,0.12)]">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                <path d="M8 6h8" />
                <path d="M8 10h8" />
              </svg>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.34em] text-[#d4b57a]/65">
                AI Book Recommendation
              </p>

              <h1 className="font-serif text-lg tracking-[0.08em] text-[#f3e9d6] sm:text-xl">
                The Librarian
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={clearConversation}
            className="rounded-full border border-[#d7bb86]/20 bg-black/25 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[#dec695]/70 transition hover:border-[#d7bb86]/45 hover:bg-black/40 hover:text-[#f3e9d6]"
          >
            New Search
          </button>
        </header>

        {/* Hero */}
        <section className="mx-auto w-full max-w-5xl pb-5 pt-10 text-center sm:pt-14">
          <div className="mb-3 text-[10px] uppercase tracking-[0.5em] text-[#d9bc83]/60">
            Enter the collection
          </div>

          <h2 className="font-serif text-4xl leading-tight tracking-[0.04em] text-[#f1e7d5] drop-shadow-[0_3px_16px_rgba(0,0,0,0.5)] sm:text-6xl">
            What story are you
            <br />
            seeking?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl font-serif text-sm leading-7 text-[#d9ceba]/75 sm:text-base">
            Describe a mood, genre, theme, character, setting, or
            reading experience. The library will search its collection
            and return books suited to your request.
          </p>
        </section>

        {/* Suggestion buttons */}
        <section className="mx-auto mb-6 flex w-full max-w-5xl flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendMessage(suggestion)}
              disabled={isLoading}
              className="rounded-full border border-[#d5b77f]/20 bg-black/30 px-4 py-2 text-xs text-[#ddcfb8]/80 backdrop-blur-md transition hover:border-[#d5b77f]/40 hover:bg-[#2b2016]/70 hover:text-[#f4ead8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </section>

        {/* Main content */}
        <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
          {/* Conversation */}
          <section className="flex min-h-[480px] flex-col overflow-hidden rounded-[26px] border border-[#d5b77f]/15 bg-[#0b0908]/55 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[#d5b77f]/10 px-5 py-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.34em] text-[#d4b57a]/55">
                  Conversation
                </p>

                <p className="mt-1 font-serif text-sm text-[#eee2cc]/80">
                  Speak with the librarian
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLoading
                      ? "animate-pulse bg-[#d3a85f]"
                      : "bg-[#829067]"
                  }`}
                />

                <span className="text-[9px] uppercase tracking-[0.24em] text-[#d5c9b3]/45">
                  {isLoading ? "Searching" : "Ready"}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] ${
                      message.role === "user"
                        ? "rounded-2xl rounded-br-md border border-[#d7b97f]/20 bg-[#3a291a]/75"
                        : "rounded-2xl rounded-bl-md border border-[#d7b97f]/10 bg-[#0c0a09]/75"
                    } px-5 py-4 shadow-[0_8px_25px_rgba(0,0,0,0.2)]`}
                  >
                    <div className="mb-2 text-[8px] uppercase tracking-[0.3em] text-[#d4b57a]/45">
                      {message.role === "user"
                        ? "You"
                        : "The Librarian"}
                    </div>

                    <p className="whitespace-pre-wrap font-serif text-sm leading-7 text-[#eadfcd]/90">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-[#d7b97f]/10 bg-[#0c0a09]/75 px-5 py-4">
                    <div className="mb-2 text-[8px] uppercase tracking-[0.3em] text-[#d4b57a]/45">
                      The Librarian
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8a56d]" />

                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8a56d]"
                        style={{
                          animationDelay: "120ms",
                        }}
                      />

                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#c8a56d]"
                        style={{
                          animationDelay: "240ms",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="mx-5 mb-4 rounded-xl border border-red-300/15 bg-red-950/25 px-4 py-3 text-xs leading-5 text-red-200/80">
                {error}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-[#d5b77f]/10 p-4 sm:p-5"
            >
              <div className="rounded-2xl border border-[#d3b477]/20 bg-[#eadab8]/95 p-2 shadow-[0_10px_45px_rgba(0,0,0,0.4)]">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(event) =>
                      setInput(event.target.value)
                    }
                    onKeyDown={handleTextareaKeyDown}
                    rows={2}
                    placeholder="Describe the book you are looking for..."
                    disabled={isLoading}
                    className="min-h-[62px] flex-1 resize-none bg-transparent px-3 py-3 font-serif text-sm leading-6 text-[#2a2017] outline-none placeholder:text-[#6e5b45]/65 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#241a12] text-[#e4ca96] transition hover:bg-[#3a2819] disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Send message"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M22 2 11 13" />
                      <path d="m22 2-7 20-4-9-9-4Z" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between px-3 pb-2 text-[8px] uppercase tracking-[0.24em] text-[#66533e]/65">
                  <span>Press Enter to search</span>
                  <span>Shift + Enter for a new line</span>
                </div>
              </div>
            </form>
          </section>

          {/* Recommendations */}
          <aside className="flex min-h-[480px] flex-col overflow-hidden rounded-[26px] border border-[#d5b77f]/15 bg-[#0b0908]/55 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <div className="border-b border-[#d5b77f]/10 px-5 py-4">
              <p className="text-[9px] uppercase tracking-[0.34em] text-[#d4b57a]/55">
                Curated from the collection
              </p>

              <h3 className="mt-1 font-serif text-lg text-[#eee2cc]/90">
                Recommendations
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {recommendations.length === 0 ? (
                <div className="flex min-h-[330px] items-center justify-center text-center">
                  <div className="max-w-xs">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#d5b77f]/15 bg-black/20 text-[#d4b57a]/55">
                      <svg
                        width="25"
                        height="25"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                      </svg>
                    </div>

                    <p className="font-serif text-base text-[#dfd1bb]/75">
                      Your recommendations will appear here.
                    </p>

                    <p className="mt-2 text-xs leading-6 text-[#c8bba5]/45">
                      Begin a conversation with the librarian to
                      discover books from the collection.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((book, index) => (
                    <article
                      key={`${book.title}-${index}`}
                      className="group rounded-2xl border border-[#d5b77f]/12 bg-[#15100c]/70 p-4 transition hover:border-[#d5b77f]/25 hover:bg-[#1a130e]/85"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md border border-[#b99760]/20 bg-[#2b1d13] text-[#d7b978]/55">
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          >
                            <path d="M5 3h14v18H5z" />
                            <path d="M8 7h8" />
                            <path d="M8 11h8" />
                            <path d="M8 15h5" />
                          </svg>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif text-base leading-6 text-[#f0e5d1]">
                            {book.title || "Untitled Book"}
                          </h4>

                          <p className="mt-1 text-xs text-[#ccbda6]/55">
                            {getRecommendationAuthor(book)}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#d0af74]/15 bg-[#261a10]/70 px-2.5 py-1 text-[9px] text-[#d6c19c]/70">
                              Rating:{" "}
                              {getRecommendationRating(book)}
                            </span>

                            {book.publication_year && (
                              <span className="rounded-full border border-[#d0af74]/15 bg-[#261a10]/70 px-2.5 py-1 text-[9px] text-[#d6c19c]/70">
                                {book.publication_year}
                              </span>
                            )}
                          </div>

                          {getRecommendationGenres(book) && (
                            <p className="mt-3 text-[10px] leading-5 text-[#c7b89e]/50">
                              {getRecommendationGenres(book)}
                            </p>
                          )}

                          {(book.reason || book.description) && (
                            <p className="mt-3 line-clamp-4 font-serif text-xs leading-6 text-[#d7ccb9]/70">
                              {book.reason || book.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="pt-6 text-center">
          <p className="text-[8px] uppercase tracking-[0.36em] text-[#d2b57f]/35">
            Powered by RAG • FAISS • BGE-M3 • BGE Reranker • Qwen
          </p>
        </footer>
      </div>
    </main>
  );
}