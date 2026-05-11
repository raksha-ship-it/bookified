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

  const handleUpload = async () => {
    if (!file || uploading) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("author", author);
      formData.append("voice", voice);

      if (cover) {
        formData.append("cover", cover);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();

console.log("RAW RESPONSE:", text);

const data = JSON.parse(text);

      if (data?.bookId) {
        // ✅ SAFE ROUTER CALL (fixes your error)
        setTimeout(() => {
          router.push(`/book/${data.bookId}`);
        }, 0);
      } else {
        console.error("No bookId returned", data);
        setUploading(false);
      }

    } catch (err) {
      console.error("Upload error:", err);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3eadf] text-gray-900">
      
      {/* NAV */}
      <div className="flex justify-between items-center px-10 py-6 max-w-7xl mx-auto">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          📚 <span>Bookified</span>
        </h1>

        <div className="flex gap-8 text-sm items-center">
          <button
            onClick={() => router.push("/")}
            className="text-gray-700 hover:text-black"
          >
            Library
          </button>

          <span className="font-semibold border-b-2 border-black pb-1">
            Add New
          </span>

          <span className="text-gray-700">Adrian</span>
        </div>
      </div>

      {/* FORM */}
      <div className="max-w-2xl mx-auto px-6 mt-10">
        
        <h1 className="text-5xl font-bold text-center mb-3">
          Add a New Book
        </h1>

        <p className="text-center text-gray-700 mb-10">
          Upload a PDF to generate your interactive reading experience
        </p>

        {/* PDF */}
        <div className="mb-6">
          <p className="mb-2 font-medium">Book PDF File</p>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl h-[160px] cursor-pointer bg-[#fafafa] hover:bg-gray-100 transition">
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="text-gray-600">
              {file ? file.name : "Click to upload PDF"}
            </p>
            <p className="text-xs text-gray-400">PDF file (max 50MB)</p>
          </label>
        </div>

        {/* COVER */}
        <div className="mb-6">
          <p className="mb-2 font-medium">Cover Image (Optional)</p>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl h-[130px] cursor-pointer bg-[#fafafa] hover:bg-gray-100 transition">
            <input
              type="file"
              className="hidden"
              onChange={(e) => setCover(e.target.files?.[0] || null)}
            />
            <p className="text-gray-600">
              {cover ? cover.name : "Click to upload cover image"}
            </p>
            <p className="text-xs text-gray-400">
              Leave empty to auto-generate
            </p>
          </label>
        </div>

        {/* TITLE */}
        <div className="mb-4">
          <p className="mb-1 font-medium">Title</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Rich Dad Poor Dad"
            className="w-full border border-gray-300 rounded-lg p-2 bg-white"
          />
        </div>

        {/* AUTHOR */}
        <div className="mb-6">
          <p className="mb-1 font-medium">Author Name</p>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="ex: Robert Kiyosaki"
            className="w-full border border-gray-300 rounded-lg p-2 bg-white"
          />
        </div>

        {/* VOICE */}
        <div className="mb-8">
          <p className="mb-3 font-medium">Choose Assistant Voice</p>

          <p className="text-sm text-gray-500 mb-2">Male Voices</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { id: "dave", name: "Dave", desc: "Young, British, casual" },
              { id: "daniel", name: "Daniel", desc: "Authoritative, warm" },
              { id: "chris", name: "Chris", desc: "Easy-going" },
            ].map((v) => (
              <div
                key={v.id}
                onClick={() => setVoice(v.id)}
                className={`border rounded-xl p-4 cursor-pointer ${
                  voice === v.id
                    ? "border-black bg-[#efe6d0]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <p className="font-medium">{v.name}</p>
                <p className="text-xs text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mb-2">Female Voices</p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { id: "rachel", name: "Rachel", desc: "Calm & clear" },
              { id: "sarah", name: "Sarah", desc: "Soft & approachable" },
            ].map((v) => (
              <div
                key={v.id}
                onClick={() => setVoice(v.id)}
                className={`border rounded-xl p-4 cursor-pointer ${
                  voice === v.id
                    ? "border-black bg-[#efe6d0]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <p className="font-medium">{v.name}</p>
                <p className="text-xs text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-[#6b3f1d] text-white py-3 rounded-xl"
        >
          {uploading ? "Processing..." : "Begin Synthesis"}
        </button>
      </div>
    </div>
  );
}