import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { query, bookId } = await req.json();

    if (!query || !bookId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 🔹 Create embedding
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const embedding = embeddingRes.data[0].embedding;

    // 🔹 Search DB
    const { data, error } = await supabase.rpc("match_book_chunks", {
      query_embedding: embedding,
      match_count: 5,
      filter_book_id: bookId as string,
    });

    if (error) {
      console.error("RPC error:", error);
      throw error;
    }

    const context =
      data?.map((d: any) => d.content).join("\n\n") || "";

    return NextResponse.json({ context });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}