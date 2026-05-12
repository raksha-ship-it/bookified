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
  const [vapi, setVapi] = useState<any>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Book Data from your API
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${params.id}`);
        const data = await res.json();
        setBook(data);
      } catch (err) {
        console.error("Book fetch error:", err);
      }
    };
    if (params.id) fetchBook();
  }, [params.id]);

  // 2. Initialize Vapi
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) return;

    const v = new Vapi(publicKey);
    setVapi(v);

    v.on("call-start", () => {
      setIsTalking(true);
      setMessages([]);
    });
    v.on("call-end", () => setIsTalking(false));

    v.on("message", (msg: any) => {
      const text = msg?.transcript || msg?.message || msg?.text;
      if (!text || typeof text !== "string") return;

      const role = msg?.role === "assistant" ? "assistant" : "user";
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.text === text.trim() && last.role === role) return prev;
        if (last && last.role === role) {
          return [...prev.slice(0, -1), { role, text: text.trim() }];
        }
        return [...prev, { role, text: text.trim() }];
      });
    });

    return () => { v.stop(); };
  }, []);

  // 3. Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // 4. THE FIX: Start Voice with Metadata correctly placed
  const startVoice = async () => {
    if (!vapi || !book) return;
    try {
      await vapi.start("6b6cda5d-86e6-416e-ac45-34be5d401d4d", {
        // Metadata goes here so it's included in the 'call' object
        metadata: {
          bookId: params.id, 
        },
      });
    } catch (e) {
      console.error("Vapi Start Error:", e);
    }
  };

  if (!book) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f5efe6] text-black px-6 py-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#e6d9a8] rounded-3xl px-6 py-5 flex items-center gap-5 shadow-sm border border-[#d6c7a1]">
          <img src={book?.cover_url || "/default-book.png"} className="w-[70px] h-[100px] object-cover rounded shadow-sm" alt="cover" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">{book?.name}</h1>
            <p className="text-gray-700 text-sm italic">by {book?.author || "Unknown"}</p>
            <div className="flex gap-2 mt-2">
               <span className="bg-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs">
                {isTalking ? "🟢 Talking" : "⚪ Ready"}
              </span>
            </div>
          </div>

          <button 
            onClick={isTalking ? () => vapi?.stop() : startVoice} 
            className={`p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition text-2xl ${isTalking ? 'bg-red-500 text-white' : 'bg-white text-black'}`}
          >
            {isTalking ? "⏹" : "🎤"}
          </button>
        </div>

        <div ref={chatRef} className="mt-8 bg-gray-50 rounded-3xl h-[400px] p-6 overflow-y-auto flex flex-col gap-4 shadow-inner border border-gray-200">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-24 italic">Tap the mic to ask Riley about the book...</div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm shadow-sm ${msg.role === "assistant" ? "bg-white text-gray-800" : "bg-[#d6c7a1] text-black"}`}>
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