"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  // ✅ FETCH BOOKS
  const fetchBooks = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/books");

      // ❌ API FAILED
      if (!res.ok) {
        console.error("Failed to fetch books");
        setBooks([]);
        return;
      }

      const data = await res.json();

      console.log("BOOK API RESPONSE:", data);

      // ✅ SAFE ARRAY CHECK
      if (Array.isArray(data)) {
        setBooks(data);
      } else {
        console.error("Books API did not return array");
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
    <div className="min-h-screen bg-[#f5efe6] text-gray-900">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-6 max-w-7xl mx-auto">
        <h1 className="text-xl font-semibold">
          📚 Bookified
        </h1>

        <div className="flex gap-8 text-sm text-gray-700 items-center">
          <span className="font-semibold border-b-2 border-black pb-1">
            Library
          </span>

          <button
            onClick={() => router.push("/add-new")}
            className="hover:text-black"
          >
            Add New
          </button>

          <span>Adrian</span>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-6">

        {/* HERO */}
        <div className="bg-[#e6d9a8] rounded-3xl px-12 py-14 flex justify-between items-center shadow-sm">

          <div>
            <h1 className="text-5xl font-bold mb-4">
              Your Library
            </h1>

            <p className="text-gray-700 mb-6 max-w-md">
              Convert your books into interactive AI conversations.
            </p>

            <button
              onClick={() => router.push("/add-new")}
              className="bg-white px-6 py-3 rounded-xl shadow"
            >
              + Add new book
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md text-sm w-[230px]">
            <p>1️⃣ Upload PDF</p>
            <p>2️⃣ AI Processing</p>
            <p>3️⃣ Voice Chat</p>
          </div>

        </div>

        {/* BOOKS */}
        <div className="mt-20">

          <h2 className="text-2xl font-semibold mb-8">
            Recent Books
          </h2>

          {loading ? (
            <p>Loading...</p>

          ) : books.length === 0 ? (

            <p className="text-gray-500">
              No books yet
            </p>

          ) : (

            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

              {books.map((book) => {

                const cover =
                  book.cover_url &&
                  book.cover_url.trim() !== ""
                    ? book.cover_url
                    : "/default-book.png";

                return (
                  <div
                    key={book.id}
                    onClick={() => router.push(`/book/${book.id}`)}
                    className="group cursor-pointer"
                  >

                    {/* COVER */}
                    <div className="h-[260px] bg-gray-200 rounded-2xl overflow-hidden shadow">

                      <img
                        src={cover}
                        alt={book.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/default-book.png";
                        }}
                      />

                    </div>

                    {/* INFO */}
                    <div className="mt-3">

                      <p className="font-semibold text-sm truncate">
                        {book.name}
                      </p>

                      <p className="text-xs text-gray-500">
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