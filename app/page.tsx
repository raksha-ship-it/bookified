"use client";

import { useEffect, useState } from "react";
import Vapi from "@vapi-ai/web";

const MY_BOOK_ID = "a93f87b3-10ba-4d9b-b300-dd0ad5719cc8"; 

export default function Page() {
  const [vapi, setVapi] = useState<any>(null);
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => {
    // Hardcoding keys for the live test to ensure Vercel reads them correctly
    const vapiInstance = new Vapi("d588ad57-40c0-47e1-a703-3626cdda6ff6");
    
    setVapi(vapiInstance);

    vapiInstance.on("call-start", () => {
      console.log("Call started");
      setIsTalking(true);
    });

    vapiInstance.on("call-end", () => {
      console.log("Call ended");
      setIsTalking(false);
    });

    vapiInstance.on("error", (error) => {
      console.error("Vapi Instance Error:", error);
    });

    return () => {
      vapiInstance.stop();
    };
  }, []);

  const startVoice = async () => {
    if (!vapi) {
      console.error("Vapi not initialized");
      return;
    }
    
    try {
      // Using your specific Assistant ID from the dashboard
      await vapi.start("6b6cda5d-86e6-416e-ac45-34be5d401d4d", {
        metadata: { bookId: MY_BOOK_ID },
        assistantOverride: { metadata: { bookId: MY_BOOK_ID } }
      });
    } catch (e) {
      console.error("Vapi Start Error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5 font-sans">
      <div className="bg-white p-10 rounded-[50px] text-center shadow-2xl w-full max-w-sm border-[12px] border-black">
        <h1 className="text-3xl font-black mb-2 tracking-tighter italic">VOICE LIBRARIAN</h1>
        <p className="text-gray-500 mb-8 font-bold text-xs uppercase tracking-widest">
          Rich Dad Poor Dad Session
        </p>
        
        <button 
          onClick={isTalking ? () => vapi.stop() : startVoice}
          className={`w-32 h-32 rounded-full border-8 border-black text-5xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center mx-auto ${
            isTalking ? 'bg-red-500 text-white' : 'bg-white text-black'
          }`}
        >
          {isTalking ? "■" : "🎤"}
        </button>
        
        <p className={`mt-8 font-black text-xl uppercase tracking-tighter ${isTalking ? 'animate-pulse text-red-500' : 'text-black'}`}>
          {isTalking ? "I AM LISTENING..." : "TAP TO TALK"}
        </p>
      </div>
    </div>
  );
}