import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import OpenAI from "openai";
import PDFParser from "pdf2json";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing OpenAI Key" }, { status: 500 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || "Untitled";
    const author = (formData.get("author") as string) || "Unknown";

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. EXTRACT TEXT
    const fullText = await new Promise<string>((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, 1);
      pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });
      pdfParser.parseBuffer(buffer);
    });

    if (!fullText || fullText.trim().length === 0) throw new Error("No text extracted from PDF");

    // 2. SAVE BOOK ENTRY
    const { data: book, error: dbError } = await supabaseServer
      .from("books")
      .insert({ name: title, author })
      .select().single();

    if (dbError) throw dbError;
    const bookId = book.id;

    // 3. CHUNKING
    const chunks: string[] = [];
    for (let i = 0; i < fullText.length; i += 1000) {
      chunks.push(fullText.slice(i, i + 1000));
    }

    // 4. GENERATE EMBEDDINGS (OpenAI Batching)
    console.log(`--- Starting OpenAI Embeddings for ${chunks.length} chunks ---`);
    const rows: { book_id: string; content: string; embedding: number[] }[] = [];
    
    const EMBED_BATCH_SIZE = 100;
    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
      console.log(`Embedding Batch ${Math.floor(i / EMBED_BATCH_SIZE) + 1}...`);

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
      });

      embeddingResponse.data.forEach((item, index) => {
        rows.push({
          book_id: bookId,
          content: batch[index],
          embedding: item.embedding,
        });
      });
    }

    // 5. BULK INSERT TO SUPABASE (Supabase Batching to prevent timeout)
    console.log(`--- Inserting ${rows.length} rows into Supabase ---`);
    const DB_BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += DB_BATCH_SIZE) {
      const chunkToInsert = rows.slice(i, i + DB_BATCH_SIZE);
      console.log(`Uploading rows ${i} to ${Math.min(i + DB_BATCH_SIZE, rows.length)}...`);
      
      const { error: insertError } = await supabaseServer
        .from("book_chunks")
        .insert(chunkToInsert);

      if (insertError) throw insertError;
    }

    console.log("✅ SUCCESS: Book uploaded and indexed.");
    return NextResponse.json({ success: true, bookId });

  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}