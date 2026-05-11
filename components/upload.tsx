"use client";

import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    console.log("BUTTON CLICKED");

    if (!file) {
      console.log("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    console.log("Sending request...");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Response:", data);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center pt-20 gap-10">

      {/* Upload Box */}
      <div className="bg-zinc-900 p-6 rounded-xl shadow-lg flex flex-col items-center gap-4">

        <input
          type="file"
          onChange={(e) => {
            const selected = e.target.files?.[0] || null;
            setFile(selected);
          }}
          className="bg-white text-black p-2 rounded"
        />

        <button
          onClick={handleUpload}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-white font-semibold"
        >
          Upload PDF
        </button>

        {file && (
          <p className="text-green-400 text-sm">
            ✅ Uploaded: {file.name}
          </p>
        )}

      </div>

      {/* Hero Section */}
      <div className="w-full max-w-5xl bg-yellow-100 text-black rounded-2xl p-8 flex justify-between items-start">

        {/* Left Content */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Library</h1>
          <p className="text-gray-700 mb-4">
            Convert your books into interactive AI conversations.
            <br />
            Listen, learn, and discuss your favorite reads.
          </p>

          <button className="bg-white px-4 py-2 rounded shadow">
            + Add new book
          </button>
        </div>

        {/* Right Steps */}
        <div className="bg-white p-4 rounded-xl shadow text-sm">
          <p className="mb-2">1️⃣ Upload PDF</p>
          <p className="mb-2">2️⃣ AI Processing</p>
          <p>3️⃣ Voice Chat</p>
        </div>

      </div>

    </div>
  );
}