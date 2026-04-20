"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { getCurrentLocation } from "@/utils/Geolocation";
import { sendChatMessage, confirmAndSaveTransaction } from "./actions";

type ChatMessage = {
  id: number;
  text: string;
  sender: "user" | "bot";
  isError?: boolean;
  isStreaming?: boolean;
  isThinking?: boolean;
  isConfirmation?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactionData?: any;
};

// ... component starts here
function StreamingText({
  text,
  onComplete,
}: {
  text: string;
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.substring(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 15); // Kecepatan streaming

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <>{displayedText}</>;
}

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-full transition-colors focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:outline-none ${
        pending
          ? "cursor-not-allowed bg-muted text-muted-foreground"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l18-9-6 18-2.5-7.5L3 12z"
        />
      </svg>
      <span className="sr-only">Kirim transaksi</span>
    </button>
  );
}

export default function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Halo! Ketikkan pengeluaran/penjualan, atau gunakan tombol **Mic** untuk mencatat pakai suara.",
      sender: "bot",
      isStreaming: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  const getMessageBubbleClassName = (msg: ChatMessage) => {
    if (msg.sender === "user") {
      return "rounded-tr-sm bg-primary text-primary-foreground";
    }

    if (msg.isError) {
      return "rounded-tl-sm border border-destructive/30 bg-destructive/10 text-destructive";
    }

    return "rounded-tl-sm border border-border bg-card text-foreground";
  };

  let inputPlaceholder = "Ketik transaksi...";
  if (isRecording) {
    inputPlaceholder = "Mendengarkan...";
  }

  let inputStateClassName = "border-border";
  if (isRecording) {
    inputStateClassName = "border-destructive/40 ring-1 ring-destructive/40";
  }
  const onlineStatusClassName = "text-muted-foreground";

  const getContainerAlignmentClassName = (msg: ChatMessage) => {
    if (msg.sender === "user") {
      return "justify-end";
    }

    return "justify-start";
  };

  const handleConfirm = async (msgId: number, transactionData: any) => {
    setIsLoading(true);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, isConfirmation: false } : msg,
      ),
    );
    try {
      const loc = await getCurrentLocation();
      const locationArg = loc.latitude
        ? {
            latitude: loc.latitude.toString(),
            longitude: loc.longitude!.toString(),
          }
        : undefined;
      const res = await confirmAndSaveTransaction(transactionData, locationArg);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: res.message,
          sender: "bot",
          isError: !res.success,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Gagal mengonfirmasi transaksi.",
          sender: "bot",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = (msgId: number) => {
    setMessages((prev) =>
      prev
        .map((msg) =>
          msg.id === msgId ? { ...msg, isConfirmation: false } : msg,
        )
        .concat({
          id: Date.now(),
          text: "Pencatatan dibatalkan.",
          sender: "bot",
        }),
    );
  };

  const handleEdit = (msgId: number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, isConfirmation: false } : msg,
      ),
    );
    setInput("Tolong ubah ");
    // Give focus to input
    setTimeout(() => {
      const textarea = document.querySelector(
        'textarea[name="message"]',
      ) as HTMLTextAreaElement;
      if (textarea) textarea.focus();
    }, 50);
  };

  useEffect(() => {
    if (!globalThis.window) {
      return;
    }

    const speechRecognitionCtor =
      (globalThis as any).SpeechRecognition ??
      (globalThis as any).webkitSpeechRecognition;
    if (speechRecognitionCtor) {
      recognitionRef.current = new speechRecognitionCtor();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "id-ID";

      recognitionRef.current.onresult = (event: any) => {
        const finalTranscript =
          event.results[event.results.length - 1][0].transcript;
        setInput((prev) =>
          prev ? `${prev} ${finalTranscript}` : finalTranscript,
        );
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert(
        "Maaf, browser Anda tidak mendukung fitur ini. Gunakan Chrome terbaru.",
      );
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };

  const submitChat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawData = formData.get("message") as string;
    if (!rawData.trim()) {
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    }

    const msgId = Date.now();
    setInput("");
    setIsRecording(false);
    setIsLoading(true);

    // Langsung push setMessages agar tidak dirender di background (untuk React 19 action form)
    const newHistory = [
      ...messages,
      { id: msgId, text: rawData, sender: "user" as const },
    ];
    setMessages([
      ...newHistory,
      {
        id: msgId + 1,
        text: "Sedang memikir...",
        sender: "bot",
        isStreaming: false,
        isThinking: true,
      },
    ]);

    try {
      const historyData = newHistory.map(
        (m) =>
          ({ role: m.sender === "user" ? "user" : "model", text: m.text }) as {
            role: "user" | "model";
            text: string;
          },
      );
      const response = await sendChatMessage(historyData, rawData);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId + 1
            ? {
                ...msg,
                text: response.message,
                isError: !response.success,
                isStreaming: true,
                isThinking: false,
                isConfirmation: response.isConfirmation,
                transactionData: response.transactionToConfirm,
              }
            : msg,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId + 1
            ? {
                ...msg,
                text: "Gagal terhubung dengan server. Silakan coba lagi.",
                isError: true,
                isStreaming: true,
                isThinking: false,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen max-w-2xl flex-col bg-background md:mx-auto md:border-x md:border-border">
      <header className="sticky top-0 flex items-center justify-between border-b border-border bg-card p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <a
            href="/dashboard"
            className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </a>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Catat via voice
            </h1>
            <p className={`text-sm ${onlineStatusClassName}`}>
              Online • AI aktif
            </p>
          </div>
        </div>
        <Image
          src="/logo.png"
          alt="Ecofin Logo"
          width={32}
          height={32}
          className="object-contain"
        />
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${getContainerAlignmentClassName(msg)}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm sm:max-w-md ${getMessageBubbleClassName(msg)}`}
              >
                <div
                  className={`text-base whitespace-pre-wrap shadow-black/5 ${msg.isThinking ? "animate-pulse text-muted-foreground" : ""}`}
                >
                  {msg.isThinking ? (
                    <span className="flex items-center space-x-1">
                      <span>Sedang memikir</span>
                      <span className="flex space-x-0.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"></span>
                      </span>
                    </span>
                  ) : msg.isStreaming ? (
                    <StreamingText
                      text={msg.text}
                      onComplete={() => {
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === msg.id ? { ...m, isStreaming: false } : m,
                          ),
                        );
                      }}
                    />
                  ) : (
                    msg.text
                  )}
                </div>
                {msg.isConfirmation && !msg.isStreaming && (
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      disabled={isLoading}
                      onClick={() => handleSkip(msg.id)}
                      className="rounded-full border border-border bg-transparent px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      disabled={isLoading}
                      onClick={() => handleEdit(msg.id)}
                      className="rounded-full border border-primary bg-transparent px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      disabled={isLoading}
                      onClick={() => handleConfirm(msg.id, msg.transactionData)}
                      className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      Konfirmasi
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Removing old loading UI manually since we replaced it with bubble */}
          {false && isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[75%] items-center space-x-2 rounded-2xl rounded-tl-sm border border-border bg-card px-5 py-3 text-foreground shadow-sm sm:max-w-md">
                <svg
                  className="h-4 w-4 animate-spin text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="animate-pulse text-sm text-muted-foreground">
                  Menganalisis...
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-border bg-card p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <form onSubmit={submitChat} className="flex items-end space-x-2">
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none ${
              isRecording
                ? "animate-pulse bg-destructive/15 text-destructive"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {isRecording ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
          <div className="relative flex-1">
            <textarea
              name="message"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const form = e.currentTarget.form;
                  if (form) form.requestSubmit();
                }
              }}
              placeholder={inputPlaceholder}
              className={`flex max-h-32 min-h-12 w-full resize-none items-center overflow-hidden rounded-2xl border bg-background py-3 pr-12 pl-4 text-base focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary focus:outline-none ${inputStateClassName}`}
              rows={1}
            />
          </div>
          <SubmitButton pending={isLoading} />
        </form>
      </footer>
    </div>
  );
}
