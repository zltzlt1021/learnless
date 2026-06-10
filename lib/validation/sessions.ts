export const PREFERENCES = [
  "quick_overview",
  "hands_on_project",
  "deep_understanding",
  "interview_prep"
] as const;

export type Preference = (typeof PREFERENCES)[number];

export type CreateSessionInput = {
  learning_goal?: unknown;
  preference?: unknown;
  resources?: unknown;
};

export type ValidCreateSessionInput = {
  learningGoal: string;
  preference: Preference | null;
  resources: string[];
};

export class ValidationError extends Error {
  code = "VALIDATION_ERROR";
}

export function validateCreateSessionInput(
  input: CreateSessionInput
): ValidCreateSessionInput {
  const learningGoal =
    typeof input.learning_goal === "string" ? input.learning_goal.trim() : "";

  if (!learningGoal) {
    throw new ValidationError("\u8bf7\u8f93\u5165\u5b66\u4e60\u76ee\u6807\u3002");
  }

  const rawResources = Array.isArray(input.resources) ? input.resources : [];
  const resources = rawResources
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (resources.length < 3 || resources.length > 10) {
    throw new ValidationError(
      "\u8bf7\u8f93\u5165 3 \u5230 10 \u4e2a\u8d44\u6e90\u3002"
    );
  }

  let preference: Preference | null = null;

  if (typeof input.preference === "string" && input.preference.trim()) {
    const cleanedPreference = input.preference.trim();
    if (!PREFERENCES.includes(cleanedPreference as Preference)) {
      throw new ValidationError(
        "\u8bf7\u9009\u62e9\u6709\u6548\u7684\u5b66\u4e60\u504f\u597d\u3002"
      );
    }
    preference = cleanedPreference as Preference;
  }

  return {
    learningGoal,
    preference,
    resources
  };
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
