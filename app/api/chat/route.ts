import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const vapiMessage = body.message;
    const query = vapiMessage?.transcript || vapiMessage?.content || body.query;
    
    // Using the ID we confirmed is in your database
    const bookId = "a93f87b3-10ba-4d9b-b300-dd0ad5719cc8"; 

    if (!query || query === "undefined") return NextResponse.json({});

    console.log(`--- 🔍 RAG SEARCH: "${query}" ---`);

    // 1. Generate the embedding
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    // 2. Query Supabase
    const { data: chunks, error } = await supabase.rpc("match_book_chunks", {
      query_embedding: emb.data[0].embedding,
      match_threshold: 0.01, 
      match_count: 5,
      target_book_id: bookId, 
    });

    if (error) throw error;

    // 3. Prepare Context
    const context = chunks?.length 
      ? chunks.map((c: any) => c.content).join("\n\n") 
      : "No direct snippets found.";

    console.log(`✅ Found ${chunks?.length || 0} chunks. Sending to Riley.`);

    // 4. Return formatted for Vapi's Server URL
    return NextResponse.json({
      message: [
        {
          role: "assistant",
          content: `Using the book's context: ${context} \n\n User asked: ${query}`
        }
      ]
    });

  } catch (err: any) {
    console.error("VAPI ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}