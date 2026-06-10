import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type CreateSessionInput,
  validateCreateSessionInput,
  ValidationError
} from "@/lib/validation/sessions";
import { parseResources } from "@/lib/utils/resources";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "INVALID_JSON",
      "\u8bf7\u6c42\u5185\u5bb9\u4e0d\u662f\u6709\u6548\u7684 JSON\u3002",
      400
    );
  }

  let input;

  try {
    input = validateCreateSessionInput(body as CreateSessionInput);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.code, error.message, 400);
    }
    return errorResponse(
      "VALIDATION_ERROR",
      "\u8f93\u5165\u5185\u5bb9\u65e0\u6548\u3002",
      400
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data: session, error: sessionError } = await supabase
      .from("decision_sessions")
      .insert({
        learning_goal: input.learningGoal,
        preference: input.preference,
        status: "pending",
        recommended_resource_title: null
      })
      .select("id, status")
      .single();

    if (sessionError || !session) {
      return errorResponse(
        "DATABASE_ERROR",
        "\u521b\u5efa\u5b66\u4e60\u4efb\u52a1\u5931\u8d25\u3002",
        500
      );
    }

    const parsedResources = parseResources(input.resources).map((resource) => ({
      ...resource,
      session_id: session.id
    }));

    const { error: resourcesError } = await supabase
      .from("resources")
      .insert(parsedResources);

    if (resourcesError) {
      await supabase.from("decision_sessions").delete().eq("id", session.id);
      return errorResponse(
        "DATABASE_ERROR",
        "\u4fdd\u5b58\u8d44\u6e90\u5931\u8d25\u3002",
        500
      );
    }

    return NextResponse.json({
      session_id: session.id,
      status: session.status
    });
  } catch {
    return errorResponse(
      "DATABASE_ERROR",
      "\u6570\u636e\u5e93\u8fde\u63a5\u5931\u8d25\u3002",
      500
    );
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("decision_sessions")
      .select(
        "id, learning_goal, recommended_resource_title, confidence_level, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return errorResponse(
        "DATABASE_ERROR",
        "\u8bfb\u53d6\u5386\u53f2\u8bb0\u5f55\u5931\u8d25\u3002",
        500
      );
    }

    return NextResponse.json({
      sessions: data ?? []
    });
  } catch {
    return errorResponse(
      "DATABASE_ERROR",
      "\u6570\u636e\u5e93\u8fde\u63a5\u5931\u8d25\u3002",
      500
    );
  }
}
