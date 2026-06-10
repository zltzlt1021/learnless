export type ResourceEvidence = {
  id: string;
  position: number;
  input_text: string;
  url: string | null;
  title: string | null;
  source_type: "url" | "title_only";
  evidence_level: string;
};

export type RecommendationCategory =
  | "primary"
  | "complementary"
  | "not_recommended_now";

export type RecommendationItem = {
  resource_id: string;
  category: RecommendationCategory;
  rank: number | null;
  reason: string;
};

export type StructuredRecommendation = {
  primary_resource_id: string;
  primary_reason: string;
  comparative_summary: string;
  confidence_level: "low" | "medium" | "high";
  confidence_reason: string;
  items: RecommendationItem[];
};

type RawRecommendation = {
  primary_resource_id?: unknown;
  primary_reason?: unknown;
  comparative_summary?: unknown;
  confidence_level?: unknown;
  confidence_reason?: unknown;
  items?: unknown;
};

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

const categories: RecommendationCategory[] = [
  "primary",
  "complementary",
  "not_recommended_now"
];

export async function generateRecommendation(input: {
  learningGoal: string;
  preference: string | null;
  resources: ResourceEvidence[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const messages = buildMessages(input);
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}.`);
      }

      const completion = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const content = completion.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned an empty response.");
      }

      const parsed = JSON.parse(content) as RawRecommendation;
      return validateRecommendation(parsed, input.resources);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to generate a valid recommendation.");
}

function buildMessages(input: {
  learningGoal: string;
  preference: string | null;
  resources: ResourceEvidence[];
}): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are LearnLess, a lightweight learning resource decision assistant. Compare 3-10 candidate resources for one learning goal. Use only the provided evidence: input_text, url, title, source_type, and evidence_level. Do not claim to have read full content. Return valid JSON only. Categories must be primary, complementary, and not_recommended_now. There must be exactly one primary item, at most two complementary items, and every resource must appear exactly once. Reasons must be comparative, not generic. Since there is no metadata extraction, confidence should usually be low or medium and must not be high when evidence is title_only."
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          learning_goal: input.learningGoal,
          preference: input.preference,
          resources: input.resources,
          required_json_shape: {
            primary_resource_id: "resource uuid",
            primary_reason: "comparative reason",
            comparative_summary: "comparative summary across resources",
            confidence_level: "low | medium | high",
            confidence_reason: "why this confidence level is justified",
            items: [
              {
                resource_id: "resource uuid",
                category: "primary | complementary | not_recommended_now",
                rank: 1,
                reason: "comparative reason"
              }
            ]
          }
        },
        null,
        2
      )
    }
  ];
}

function validateRecommendation(
  raw: RawRecommendation,
  resources: ResourceEvidence[]
): StructuredRecommendation {
  if (
    typeof raw.primary_resource_id !== "string" ||
    typeof raw.primary_reason !== "string" ||
    typeof raw.comparative_summary !== "string" ||
    typeof raw.confidence_level !== "string" ||
    typeof raw.confidence_reason !== "string" ||
    !Array.isArray(raw.items)
  ) {
    throw new Error("Recommendation response is missing required fields.");
  }

  if (!isConfidenceLevel(raw.confidence_level)) {
    throw new Error("Recommendation confidence level is invalid.");
  }

  const resourceIds = new Set(resources.map((resource) => resource.id));
  if (!resourceIds.has(raw.primary_resource_id)) {
    throw new Error("Primary resource is not one of the session resources.");
  }

  const hasOnlyLowEvidence = resources.every(
    (resource) => resource.evidence_level === "title_only"
  );
  if (hasOnlyLowEvidence && raw.confidence_level === "high") {
    throw new Error("High confidence is not allowed for title-only evidence.");
  }

  const seen = new Set<string>();
  let primaryCount = 0;
  let complementaryCount = 0;

  const items = raw.items.map((item) => {
    if (!isRawItem(item)) {
      throw new Error("Recommendation item is invalid.");
    }

    if (!resourceIds.has(item.resource_id)) {
      throw new Error("Recommendation item references an unknown resource.");
    }

    if (seen.has(item.resource_id)) {
      throw new Error("A resource was classified more than once.");
    }
    seen.add(item.resource_id);

    if (item.category === "primary") {
      primaryCount += 1;
      if (item.resource_id !== raw.primary_resource_id) {
        throw new Error("Primary item does not match primary_resource_id.");
      }
    }

    if (item.category === "complementary") {
      complementaryCount += 1;
    }

    return {
      resource_id: item.resource_id,
      category: item.category,
      rank: item.rank,
      reason: item.reason.trim()
    };
  });

  if (seen.size !== resources.length) {
    throw new Error("Every resource must be classified exactly once.");
  }

  if (primaryCount !== 1) {
    throw new Error("There must be exactly one primary recommendation.");
  }

  if (complementaryCount > 2) {
    throw new Error("There can be at most two complementary resources.");
  }

  return {
    primary_resource_id: raw.primary_resource_id,
    primary_reason: raw.primary_reason.trim(),
    comparative_summary: raw.comparative_summary.trim(),
    confidence_level: raw.confidence_level,
    confidence_reason: raw.confidence_reason.trim(),
    items
  };
}

function isRawItem(item: unknown): item is RecommendationItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as RecommendationItem;
  return (
    typeof candidate.resource_id === "string" &&
    categories.includes(candidate.category) &&
    (typeof candidate.rank === "number" || candidate.rank === null) &&
    typeof candidate.reason === "string" &&
    candidate.reason.trim().length > 0
  );
}

function isConfidenceLevel(value: string): value is "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high";
}
