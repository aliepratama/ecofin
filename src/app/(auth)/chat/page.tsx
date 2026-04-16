"use client";

import { useState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import {
  saveTransactionOffline,
  getPendingTransactions,
  deleteTransactionOffline,
} from "@/libs/offline-db";
import { sendChatMessage } from "./actions";
import { getCurrentLocation } from "@/utils/Geolocation";

type ChatMessage = {
  id: number;
  text: string;
  sender: "user" | "bot";
  isError?: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();

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
    },
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
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

  let inputPlaceholder = "Offline mode...";
  if (isRecording) {
    inputPlaceholder = "Mendengarkan...";
  } else if (isOnline) {
    inputPlaceholder = "Ketik transaksi...";
  }

  let inputStateClassName = "border-amber-300 bg-amber-50";
  if (isRecording) {
    inputStateClassName = "border-destructive/40 ring-1 ring-destructive/40";
  } else if (isOnline) {
    inputStateClassName = "border-border";
  }

  let onlineStatusClassName = "font-semibold text-amber-600";
  if (isOnline) {
    onlineStatusClassName = "text-muted-foreground";
  }

  const getContainerAlignmentClassName = (msg: ChatMessage) => {
    if (msg.sender === "user") {
      return "justify-end";
    }

    return "justify-start";
  };

  useEffect(() => {
    if (!globalThis.window) {
      return;
    }

    setIsOnline(navigator.onLine);
    const handleOffline = () => {
      setIsOnline(false);
    };

    globalThis.addEventListener("online", syncOfflineQueue);
    globalThis.addEventListener("offline", handleOffline);

    return () => {
      globalThis.removeEventListener("online", syncOfflineQueue);
      globalThis.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncOfflineQueue = async () => {
    setIsOnline(true);
    const pendingData = await getPendingTransactions();

    if (pendingData.length > 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: `Memproses ${pendingData.length} draft transaksi offline...`,
          sender: "bot",
        },
      ]);

      for (const tx of pendingData) {
        try {
          const res = await sendChatMessage(tx.text);
          if (res.success) {
            await deleteTransactionOffline(tx.id);
          }
        } catch (error) {
          console.error("Gagal sync data:", error);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "✅ Semua draf offline berhasil disinkronkan ke Cloud!",
          sender: "bot",
        },
      ]);
    }
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
        const finalTranscript = event.results.at(-1)[0].transcript;
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

  const submitChat = async (formData: FormData) => {
    const rawData = formData.get("message") as string;
    if (!rawData.trim()) {
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    }

    const msgId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: msgId, text: rawData, sender: "user" },
    ]);
    setInput("");
    setIsRecording(false);

    if (!isOnline) {
      await saveTransactionOffline(rawData);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId + 1,
          text: "⚠️ Mode Offline. Disimpan sebagai Draf. Akan sinkron saat kembali online.",
          sender: "bot",
        },
      ]);
      return;
    }

    try {
      const loc = await getCurrentLocation();
      const locationArg = loc.latitude
        ? {
            latitude: loc.latitude.toString(),
            longitude: loc.longitude!.toString(),
          }
        : undefined;
      const response = await sendChatMessage(rawData, locationArg);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId + 1,
          text: response.message,
          sender: "bot",
          isError: !response.success,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: msgId + 1,
          text: "Gagal terhubung dengan server. Silakan coba lagi.",
          sender: "bot",
          isError: true,
        },
      ]);
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
              {isOnline ? "Online • AI aktif" : "Offline • Tersimpan di HP"}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${getContainerAlignmentClassName(msg)}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm sm:max-w-md ${getMessageBubbleClassName(msg)}`}
              >
                <p className="text-base shadow-black/5">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="shrink-0 border-t border-border bg-card p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <form action={submitChat} className="flex items-end space-x-2">
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              isRecording
                ? "animate-pulse bg-destructive/15 text-destructive"
                : "text-muted-foreground hover:bg-muted"
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
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>
          <div className="relative flex-1">
            <textarea
              name="message"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              placeholder={inputPlaceholder}
              className={`flex max-h-32 min-h-12 w-full resize-none items-center overflow-hidden rounded-2xl border bg-background py-3 pr-12 pl-4 text-base focus:border-primary focus:bg-background focus:ring-1 focus:ring-primary focus:outline-none ${inputStateClassName}`}
              rows={1}
            />
          </div>
          <SubmitButton />
        </form>
      </footer>
    </div>
  );
}
