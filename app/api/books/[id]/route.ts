import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ FIX HERE

    const { data, error } = await supabaseServer
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(null, { status: 500 });
  }
}