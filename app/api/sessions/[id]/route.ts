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

    const { data: result, error: resultError } = await supabase
      .from("recommendation_results")
      .select("primary_resource_id, primary_reason, comparative_summary")
      .eq("session_id", id)
      .maybeSingle();

    if (resultError) {
      return errorResponse(
        "DATABASE_ERROR",
        "\u8bfb\u53d6\u63a8\u8350\u7ed3\u679c\u5931\u8d25\u3002",
        500
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from("recommendation_items")
      .select("resource_id, category, rank, reason")
      .eq("session_id", id)
      .order("rank", { ascending: true, nullsFirst: false });

    if (itemsError) {
      return errorResponse(
        "DATABASE_ERROR",
        "\u8bfb\u53d6\u63a8\u8350\u5206\u7c7b\u5931\u8d25\u3002",
        500
      );
    }

    const resourceById = new Map(
      (resources ?? []).map((resource) => [resource.id, resource])
    );

    const mappedItems = (items ?? []).map((item) => ({
      ...item,
      resource: resourceById.get(item.resource_id) ?? null
    }));

    const responseResult = result
      ? {
          primary:
            mappedItems.find((item) => item.category === "primary") ?? null,
          complementary: mappedItems.filter(
            (item) => item.category === "complementary"
          ),
          not_recommended_now: mappedItems.filter(
            (item) => item.category === "not_recommended_now"
          ),
          comparative_summary: result.comparative_summary,
          primary_reason: result.primary_reason
        }
      : null;

    return NextResponse.json({
      ...session,
      resources: resources ?? [],
      result: responseResult
    });
  } catch {
    return errorResponse(
      "DATABASE_ERROR",
      "\u6570\u636e\u5e93\u8fde\u63a5\u5931\u8d25\u3002",
      500
    );
  }
}
