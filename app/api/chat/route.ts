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
    const body = await req.json();

    const query = body.query;
    const bookId = body.bookId;

    console.log("QUESTION:", query);
    console.log("BOOK ID:", bookId);

    // -----------------------------
    // CREATE QUERY EMBEDDING
    // -----------------------------
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const embedding = embeddingResponse.data[0].embedding;

    console.log("EMBEDDING CREATED");

    // -----------------------------
    // SEARCH CHUNKS
    // -----------------------------
    const { data, error } = await supabase.rpc(
      "match_book_chunks",
      {
        query_embedding: embedding,
        match_count: 5,
        filter_book_id: bookId,
      }
    );

    console.log("MATCH DATA:", data);
    console.log("MATCH ERROR:", error);

    if (error) {
      throw error;
    }

    // -----------------------------
    // NO RESULTS
    // -----------------------------
    if (!data || data.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find that in the book.",
      });
    }

    // -----------------------------
    // BUILD CONTEXT
    // -----------------------------
    const context = data
      .map((item: any) => item.content)
      .join("\n\n");

    console.log("CONTEXT LENGTH:", context.length);

    // -----------------------------
    // ASK GPT
    // -----------------------------
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Answer ONLY using the provided book context.",
        },
        {
          role: "user",
          content: `
BOOK CONTEXT:
${context}

QUESTION:
${query}
          `,
        },
      ],
    });

    const answer =
      completion.choices[0].message.content ||
      "No answer found.";

    return NextResponse.json({
      answer,
    });

  } catch (err: any) {
    console.error("CHAT ERROR:", err);

    return NextResponse.json(
      {
        error: err.message || "Chat failed",
      },
      { status: 500 }
    );
  }
}