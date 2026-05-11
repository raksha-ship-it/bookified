"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Vapi from "@vapi-ai/web";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function BookPage() {
  const params = useParams();

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vapi, setVapi] = useState<any>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const chatRef = useRef<HTMLDivElement>(null);

  // ✅ FETCH BOOK
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${params.id}`);
        const data = await res.json();
        setBook(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [params.id]);

  // ✅ INIT VAPI (FIXED)
  useEffect(() => {
    const v = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
    setVapi(v);

    v.on("call-start", () => {
      setIsTalking(true);
      setMessages([]);
    });

    v.on("call-end", () => {
      setIsTalking(false);
    });

    v.on("message", (msg: any) => {
      const text =
        msg?.transcript ||
        msg?.message ||
        msg?.text;

      if (!text) return;

      const role =
        msg?.role === "assistant" ? "assistant" : "user";

      const clean = text.trim();
      if (!clean) return;

      setMessages((prev) => {
        const last = prev[prev.length - 1];

        // avoid duplicates
        if (last && last.text === clean && last.role === role) {
          return prev;
        }

        // merge streaming updates
        if (last && last.role === role) {
          return [...prev.slice(0, -1), { role, text: clean }];
        }

        return [...prev, { role, text: clean }];
      });
    });

    v.on("error", (e: any) => {
      console.error("Vapi error:", e);
    });

    return () => {
      v.stop();
    };
  }, []);

  // ✅ AUTO SCROLL
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // ✅ START VOICE (FINAL)
  const startVoice = async () => {
    try {
      if (!vapi || !book) return;

      await vapi.start(
        "6b6cda5d-86e6-416e-ac45-34be5d401d4d", // ✅ your assistant ID
        {
          metadata: {
            bookId: book.id, // 🔥 passed to backend
          },
        }
      );
    } catch (err) {
      console.error("Start error:", err);
    }
  };

  // ✅ STOP VOICE
  const stopVoice = () => {
    vapi?.stop();
  };

  if (loading) return <div className="p-10">Loading...</div>;
  if (!book) return <div className="p-10">Book not found</div>;

  return (
    <div className="min-h-screen bg-[#f5efe6] text-black px-6 py-10">

      {/* BACK */}
      <button
        onClick={() => window.history.back()}
        className="mb-6 bg-white p-3 rounded-full shadow"
      >
        ←
      </button>

      <div className="max-w-4xl mx-auto">

        {/* TOP CARD */}
        <div className="bg-[#e6d9a8] rounded-3xl px-6 py-5 flex items-center gap-5 shadow-sm">

          <img
            src={book.cover_url || "/default-book.png"}
            className="w-[70px] h-[100px] object-cover rounded"
          />

          <div className="flex-1">
            <h1 className="text-xl font-semibold">{book.name}</h1>

            <p className="text-gray-600 text-sm">
              by {book.author || "Unknown"}
            </p>

            <div className="flex gap-2 mt-2 text-xs">
              <span className="bg-white px-3 py-1 rounded-full">
                ● {isTalking ? "Talking..." : "Ready"}
              </span>

              <span className="bg-white px-3 py-1 rounded-full">
                Voice: {book.voice || "Rachel"}
              </span>

              <span className="bg-white px-3 py-1 rounded-full">
                Live
              </span>
            </div>
          </div>

          {/* MIC BUTTON */}
          {!isTalking ? (
            <button
              onClick={startVoice}
              className="bg-white p-3 rounded-full shadow hover:scale-105 transition"
            >
              🎤
            </button>
          ) : (
            <button
              onClick={stopVoice}
              className="bg-red-500 text-white p-3 rounded-full shadow"
            >
              ⏹
            </button>
          )}
        </div>

        {/* CHAT BOX */}
        <div
          ref={chatRef}
          className="mt-8 bg-gray-100 rounded-3xl h-[320px] p-6 overflow-y-auto flex flex-col gap-3"
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <div className="text-2xl mb-2">🎤</div>
              <p className="font-medium">
                {isTalking ? "Listening..." : "No conversation yet"}
              </p>
              <p className="text-sm">
                Click the mic button above to start talking
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "assistant"
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                    msg.role === "assistant"
                      ? "bg-white"
                      : "bg-[#d6c7a1]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}