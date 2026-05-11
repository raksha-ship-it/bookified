import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || "Untitled";
    const author = (formData.get("author") as string) || "Unknown";
    const voice = (formData.get("voice") as string) || "default";

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // -----------------------------------
    // 📄 CONVERT FILE TO BUFFER
    // -----------------------------------
    const buffer = Buffer.from(await file.arrayBuffer());

    // -----------------------------------
    // ☁️ UPLOAD PDF TO SUPABASE
    // -----------------------------------
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabaseServer.storage
      .from("books")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
      });

    if (uploadError) {
      throw uploadError;
    }

    // -----------------------------------
    // 🔗 GET PUBLIC URL
    // -----------------------------------
    const { data: fileUrlData } = supabaseServer.storage
      .from("books")
      .getPublicUrl(fileName);

    const fileUrl = fileUrlData.publicUrl;

    // -----------------------------------
    // 💾 SAVE BOOK
    // -----------------------------------
    const { data: book, error: dbError } = await supabaseServer
      .from("books")
      .insert({
        name: title,
        author,
        file_url: fileUrl,
        voice,
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    const bookId = book.id;

    console.log("BOOK CREATED:", bookId);

    // -----------------------------------
    // 📖 EXTRACT TEXT USING OPENAI FILE API
    // -----------------------------------
    const uploadedFile = await openai.files.create({
      file: new File([buffer], file.name, {
        type: "application/pdf",
      }),
      purpose: "assistants",
    });

    console.log("OPENAI FILE:", uploadedFile.id);

    // -----------------------------------
    // 🧠 ASK OPENAI TO READ PDF
    // -----------------------------------
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: uploadedFile.id,
            },
            {
              type: "input_text",
              text: "Extract all readable text from this PDF.",
            },
          ],
        },
      ],
    });

    const fullText = response.output_text || "";

    console.log("TEXT LENGTH:", fullText.length);

    if (!fullText.trim()) {
      throw new Error("No text extracted from PDF");
    }

    // -----------------------------------
    // ✂️ CHUNK TEXT
    // -----------------------------------
    const chunkSize = 1000;
    const overlap = 200;

    const chunks: string[] = [];

    for (let i = 0; i < fullText.length; i += chunkSize - overlap) {
      const chunk = fullText.slice(i, i + chunkSize);

      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }

    console.log("TOTAL CHUNKS:", chunks.length);

    // -----------------------------------
    // 🧠 CREATE EMBEDDINGS
    // -----------------------------------
    const rows = [];

    for (const chunk of chunks) {
      const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });

      rows.push({
        book_id: bookId,
        content: chunk,
        embedding: embeddingRes.data[0].embedding,
      });
    }

    console.log("ROWS READY:", rows.length);
    
    const { error: insertError } = await supabaseServer
      .from("book_chunks")
      .insert(rows);

    if (insertError) {
      console.error(insertError);
      throw insertError;
    }

    console.log("BOOK CHUNKS INSERTED");

  
    return NextResponse.json({
      success: true,
      bookId,
    });

  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);

    return NextResponse.json(
      {
        error: err.message || "Upload failed",
      },
      { status: 500 }
    );
  }
}