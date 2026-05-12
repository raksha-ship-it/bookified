"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Vapi from "@vapi-ai/web";

type Message = {
  role: "user" | "assistant";
  text: string;
};

// HARDCODED KEYS
const ASSISTANT_ID = "6b6cda5d-86e6-416e-ac45-34be5d401d4d";
const PUBLIC_KEY = "d588ad57-40c0-47e1-a703-3626cdda6ff6";

export default function BookPage() {
  const params = useParams();
  const [book, setBook] = useState<any>(null);
  const [vapi, setVapi] = useState<any>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${params.id}`);
        const data = await res.json();
        setBook(data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    if (params.id) fetchBook();
  }, [params.id]);

  useEffect(() => {
    const v = new Vapi(PUBLIC_KEY);
    setVapi(v);

    v.on("call-start", () => setIsTalking(true));
    v.on("call-end", () => setIsTalking(false));
    v.on("message", (msg: any) => {
      if (msg.type === "transcript" && msg.transcriptType === "final") {
        setMessages((prev) => [...prev, { role: msg.role, text: msg.transcript }]);
      }
    });
    v.on("error", (e) => {
      console.error("VAPI ERROR:", e);
      setIsTalking(false);
    });

    return () => { v.stop(); };
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // THE REPAIRED START VOICE - FLATTENED VERSION
  const startVoice = async () => {
    if (!vapi || !params.id) return;
    
    try {
      // Trying the 2-argument approach which is often the most stable
      // Argument 1: The ID
      // Argument 2: The Overrides (Simplified)
      await vapi.start(ASSISTANT_ID, {
        variableValues: {
          bookId: params.id
        }
      } as any);
    } catch (e) {
      console.error("Vapi Start Exception:", e);
    }
  };

  if (!book) return <div className="p-10 font-sans font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f5efe6] text-black px-6 py-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#e6d9a8] rounded-3xl px-6 py-5 flex items-center gap-5 shadow-sm border-4 border-black">
          <img 
            src={book?.cover_url || "/default-book.png"} 
            className="w-[70px] h-[100px] object-cover rounded border-2 border-white" 
            alt="cover" 
          />
          <div className="flex-1">
            <h1 className="text-xl font-black uppercase tracking-tight">{book?.name}</h1>
            <p className="text-gray-700 text-sm font-bold italic">by {book?.author || "Unknown"}</p>
          </div>

          <button 
            onClick={isTalking ? () => vapi?.stop() : startVoice} 
            className={`p-5 rounded-full shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-2xl border-4 border-black transition-all active:shadow-none active:translate-y-1 ${
              isTalking ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black'
            }`}
          >
            {isTalking ? "⏹" : "🎤"}
          </button>
        </div>

        <div ref={chatRef} className="mt-8 bg-white/60 rounded-[40px] h-[450px] p-8 overflow-y-auto flex flex-col gap-4 border-4 border-black shadow-inner">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-32 italic font-bold">
              Tap to talk about {book?.name}
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div className="max-w-[80%] px-6 py-3 rounded-2xl text-sm font-bold border-2 border-black bg-white">
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