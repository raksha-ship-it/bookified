"use client";

import { useEffect, useState } from "react";
import Vapi from "@vapi-ai/web";

const MY_BOOK_ID = "a93f87b3-10ba-4d9b-b300-dd0ad5719cc8"; 

export default function Page() {
  const [vapi, setVapi] = useState<any>(null);
  const [isTalking, setIsTalking] = useState(false);

  // ✅ FIX: useEffect is NOT async
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!key) return;

    const v = new Vapi(key);
    setVapi(v);

    v.on("call-start", () => setIsTalking(true));
    v.on("call-end", () => setIsTalking(false));

    return () => {
      v.stop();
    };
  }, []);

  const startVoice = async () => {
    if (!vapi) return;
    try {
      await vapi.start("6b6cda5d-86e6-416e-ac45-34be5d401d4d", {
        metadata: { bookId: MY_BOOK_ID },
        assistantOverride: { metadata: { bookId: MY_BOOK_ID } }
      });
    } catch (e) {
      console.error("Vapi Error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5 font-sans">
      <div className="bg-white p-10 rounded-[50px] text-center shadow-2xl w-full max-w-sm">
        <h1 className="text-2xl font-black mb-2 tracking-tighter">VOICE LIBRARIAN</h1>
        <p className="text-gray-500 mb-8 font-bold text-xs uppercase tracking-widest">
          Rich Dad Poor Dad Session
        </p>
        
        <button 
          onClick={isTalking ? () => vapi.stop() : startVoice}
          className={`w-32 h-32 rounded-full border-8 border-black text-4xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center mx-auto ${
            isTalking ? 'bg-red-500' : 'bg-white'
          }`}
        >
          {isTalking ? "⏹" : "🎤"}
        </button>
        
        <p className={`mt-8 font-black uppercase tracking-tighter ${isTalking ? 'animate-pulse text-red-500' : 'text-black'}`}>
          {isTalking ? "I AM LISTENING..." : "TAP TO TALK"}
        </p>
      </div>
    </div>
  );
}