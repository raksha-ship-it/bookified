"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Book = {
  id: string;
  name: string;
  file_url: string;
  cover_url?: string | null;
  author?: string | null;
};

export default function Page() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH BOOKS FROM YOUR DATABASE
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/books");

      if (!res.ok) {
        console.error("Failed to fetch books");
        setBooks([]);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setBooks(data);
      } else {
        setBooks([]);
      }
    } catch (err) {
      console.error("FETCH BOOKS ERROR:", err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5efe6] text-gray-900 font-sans">
      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-6 max-w-7xl mx-auto">
        <h1 className="text-xl font-semibold text-black">
          📚 Bookified
        </h1>

        <div className="flex gap-8 text-sm text-gray-700 items-center">
          <span className="font-semibold border-b-2 border-black pb-1 cursor-pointer">
            Library
          </span>
          <button
            onClick={() => router.push("/add-new")}
            className="hover:text-black transition-colors"
          >
            Add New
          </button>
          <span className="text-gray-500">Adrian</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HERO SECTION */}
        <div className="bg-[#e6d9a8] rounded-3xl px-12 py-14 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-5xl font-bold mb-4 text-black">
              Your Library
            </h1>
            <p className="text-gray-700 mb-6 max-w-md">
              Convert your books into interactive AI conversations.
            </p>
            <button
              onClick={() => router.push("/add-new")}
              className="bg-white px-6 py-3 rounded-xl shadow-md hover:bg-gray-50 transition-all font-medium text-black"
            >
              + Add new book
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md text-sm w-[230px] space-y-2 text-black">
            <p>1️⃣ Upload PDF</p>
            <p>2️⃣ AI Processing</p>
            <p>3️⃣ Voice Chat</p>
          </div>
        </div>

        {/* RECENT BOOKS SECTION */}
        <div className="mt-20 pb-20">
          <h2 className="text-2xl font-semibold mb-8 text-black">
            Recent Books
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <p className="animate-pulse text-gray-500">Loading your books...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="bg-white/50 border-2 border-dashed border-gray-300 rounded-3xl p-20 text-center">
              <p className="text-gray-500">No books found in your library yet.</p>
              <button 
                onClick={() => router.push("/add-new")}
                className="mt-4 text-black underline font-semibold"
              >
                Upload your first book
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {books.map((book) => {
                const cover = book.cover_url && book.cover_url.trim() !== ""
                    ? book.cover_url
                    : "/default-book.png";

                return (
                  <div
                    key={book.id}
                    onClick={() => router.push(`/book/${book.id}`)}
                    className="group cursor-pointer"
                  >
                    {/* BOOK COVER IMAGE */}
                    <div className="h-[260px] bg-gray-200 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                      <img
                        src={cover}
                        alt={book.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/default-book.png";
                        }}
                      />
                    </div>

                    {/* BOOK DETAILS */}
                    <div className="mt-4">
                      <p className="font-bold text-sm text-black truncate">
                        {book.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {book.author || "Unknown Author"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}