import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/folders — 폴더명 일괄 변경
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { oldName, newName } = await req.json();
  if (!oldName || !newName?.trim()) {
    return NextResponse.json({ error: "oldName and newName required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("bookmarks")
    .update({ folder: newName.trim() })
    .eq("user_id", user.id)
    .eq("folder", oldName);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
