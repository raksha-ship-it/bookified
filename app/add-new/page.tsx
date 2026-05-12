"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddNewPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [voice, setVoice] = useState("daniel");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file || uploading) return;

    try {
      setUploading(true);
      setStatus("Starting upload... please wait.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || "Untitled Book");
      formData.append("author", author || "Unknown Author");
      formData.append("voice", voice);

      if (cover) {
        formData.append("cover", cover);
      }

      setStatus("Indexing text chunks into Supabase... (this takes a minute)");
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data?.bookId) {
        setStatus("✅ Success! Redirecting to your book...");
        // Small delay so the user can see the success message
        setTimeout(() => {
          router.push(`/book/${data.bookId}`);
        }, 1500);
      } else {
        console.error("No bookId returned", data);
        setStatus("❌ Error: Could not get Book ID.");
        setUploading(false);
      }

    } catch (err) {
      console.error("Upload error:", err);
      setStatus("❌ Connection error. Check your terminal.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3eadf] text-gray-900 pb-20 font-sans">
      
      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-6 max-w-7xl mx-auto">
        <h1 className="text-xl font-bold flex items-center gap-2 text-black">
          📚 <span>Bookified</span>
        </h1>
        <div className="flex gap-8 text-sm items-center">
          <button onClick={() => router.push("/")} className="text-gray-700 hover:text-black font-medium">
            Library
          </button>
          <span className="font-bold border-b-2 border-black pb-1">Add New</span>
          <span className="text-gray-500">Adrian</span>
        </div>
      </div>

      {/* FORM CONTAINER */}
      <div className="max-w-2xl mx-auto px-6 mt-10">
        <h1 className="text-5xl font-black text-center mb-3 tracking-tighter text-black">
          ADD NEW BOOK
        </h1>
        <p className="text-center text-gray-600 mb-10 font-medium">
          Upload a PDF and Riley will index it for voice conversation.
        </p>

        {/* FILE UPLOAD BOX */}
        <div className="mb-6">
          <p className="mb-2 font-bold text-sm uppercase tracking-wider text-gray-700">Book PDF File</p>
          <label className={`flex flex-col items-center justify-center border-4 border-dashed rounded-3xl h-[160px] cursor-pointer transition-all ${file ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white/50 hover:bg-white'}`}>
            <input type="file" className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="font-bold text-lg">{file ? "✅ " + file.name : "Click to upload PDF"}</p>
            <p className="text-xs text-gray-400 mt-2 italic">PDF files only (max 50MB)</p>
          </label>
        </div>

        {/* TITLE & AUTHOR */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="mb-1 font-bold text-sm uppercase text-gray-700">Title</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Rich Dad Poor Dad"
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-white focus:border-black outline-none transition"
            />
          </div>
          <div>
            <p className="mb-1 font-bold text-sm uppercase text-gray-700">Author</p>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="ex: Robert Kiyosaki"
              className="w-full border-2 border-gray-200 rounded-xl p-3 bg-white focus:border-black outline-none transition"
            />
          </div>
        </div>

        {/* VOICE SELECTION */}
        <div className="mb-8 bg-white/30 p-6 rounded-3xl border-2 border-gray-100">
          <p className="mb-4 font-bold text-sm uppercase text-gray-700">Choose Assistant Voice</p>
          <div className="grid grid-cols-3 gap-3">
            {['daniel', 'dave', 'chris', 'rachel', 'sarah'].map((v) => (
              <button
                key={v}
                onClick={() => setVoice(v)}
                className={`py-3 px-2 rounded-xl font-bold text-xs uppercase tracking-tighter transition-all border-2 ${
                  voice === v ? "border-black bg-black text-white shadow-lg" : "border-gray-200 bg-white text-gray-400 hover:border-gray-400"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* STATUS & ACTION BUTTON */}
        <div className="text-center">
          {status && (
            <p className={`mb-4 font-bold text-sm ${status.includes('❌') ? 'text-red-500' : 'text-blue-600 animate-pulse'}`}>
              {status}
            </p>
          )}
          
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-tighter transition-all shadow-[0_8px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-2 ${
              uploading ? "bg-gray-400 text-white cursor-not-allowed" : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {uploading ? "INDEXING CONTENT..." : "BEGIN SYNTHESIS"}
          </button>
        </div>

      </div>
    </div>
  );
}