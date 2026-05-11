import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("BOOK API ERROR:", err);

    return NextResponse.json(
      {
        error: err.message || "Failed to fetch books",
      },
      { status: 500 }
    );
  }
}