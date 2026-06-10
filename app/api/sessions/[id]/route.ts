import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/sessions";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!isUuid(id)) {
    return errorResponse(
      "INVALID_SESSION_ID",
      "\u5b66\u4e60\u4efb\u52a1 ID \u65e0\u6548\u3002",
      400
    );
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data: session, error: sessionError } = await supabase
      .from("decision_sessions")
      .select(
        "id, learning_goal, preference, status, recommended_resource_title, confidence_level, confidence_reason, error_message, created_at"
      )
      .eq("id", id)
      .single();

    if (sessionError || !session) {
      return errorResponse(
        "SESSION_NOT_FOUND",
        "\u6ca1\u6709\u627e\u5230\u8fd9\u4e2a\u5b66\u4e60\u4efb\u52a1\u3002",
        404
      );
    }

    const { data: resources, error: resourcesError } = await supabase
      .from("resources")
      .select(
        "id, position, input_text, url, normalized_url, title, source_type, evidence_level"
      )
      .eq("session_id", id)
      .order("position", { ascending: true });

    if (resourcesError) {
      return errorResponse(
        "DATABASE_ERROR",
        "\u8bfb\u53d6\u8d44\u6e90\u5931\u8d25\u3002",
        500
      );
    }

    return NextResponse.json({
      ...session,
      resources: resources ?? [],
      result: null
    });
  } catch {
    return errorResponse(
      "DATABASE_ERROR",
      "\u6570\u636e\u5e93\u8fde\u63a5\u5931\u8d25\u3002",
      500
    );
  }
}
