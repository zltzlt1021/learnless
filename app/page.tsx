"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const preferenceOptions = [
  { value: "", label: "\u4e0d\u9009\u62e9" },
  { value: "quick_overview", label: "\u5feb\u901f\u6982\u89c8" },
  { value: "hands_on_project", label: "\u52a8\u624b\u9879\u76ee" },
  { value: "deep_understanding", label: "\u6df1\u5ea6\u7406\u89e3" },
  { value: "interview_prep", label: "\u9762\u8bd5\u51c6\u5907" }
];

type ApiError = {
  error?: {
    message?: string;
  };
};

export default function InputPage() {
  const router = useRouter();
  const [learningGoal, setLearningGoal] = useState("");
  const [preference, setPreference] = useState("");
  const [resourcesText, setResourcesText] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resources = useMemo(
    () =>
      resourcesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [resourcesText]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!learningGoal.trim()) {
      setError("\u8bf7\u8f93\u5165\u5b66\u4e60\u76ee\u6807\u3002");
      return;
    }

    if (resources.length < 3 || resources.length > 10) {
      setError("\u8bf7\u8f93\u5165 3 \u5230 10 \u4e2a\u8d44\u6e90\u3002");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          learning_goal: learningGoal,
          preference: preference || null,
          resources
        })
      });

      const data = (await response.json()) as ApiError & {
        session_id?: string;
      };

      if (!response.ok || !data.session_id) {
        setError(data.error?.message ?? "\u521b\u5efa\u5b66\u4e60\u4efb\u52a1\u5931\u8d25\u3002");
        return;
      }

      router.push(`/sessions/${data.session_id}`);
    } catch {
      setError("\u7f51\u7edc\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="brand">LearnLess</h1>
          <p className="subtitle">
            {"\u7c98\u8d34\u4e00\u4e2a\u5b66\u4e60\u76ee\u6807\u548c 3-10 \u4e2a\u5019\u9009\u8d44\u6e90\uff0c\u5148\u51b3\u5b9a\u770b\u54ea\u4e00\u4e2a\u3002"}
          </p>
        </div>
        <Link className="nav-link" href="/history">
          {"\u5386\u53f2"}
        </Link>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        {error ? <p className="error">{error}</p> : null}

        <div className="field">
          <label htmlFor="learning-goal">{"\u5b66\u4e60\u76ee\u6807"}</label>
          <input
            id="learning-goal"
            value={learningGoal}
            onChange={(event) => setLearningGoal(event.target.value)}
            placeholder="\u4f8b\u5982\uff1a\u6211\u60f3\u5feb\u901f\u5165\u95e8 AI Agent \u5f00\u53d1"
          />
        </div>

        <div className="field">
          <label htmlFor="preference">{"\u5b66\u4e60\u504f\u597d"}</label>
          <select
            id="preference"
            value={preference}
            onChange={(event) => setPreference(event.target.value)}
          >
            {preferenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <div className="label-row">
            <label htmlFor="resources">{"\u5019\u9009\u8d44\u6e90"}</label>
            <span className="hint">
              {"\u5df2\u8f93\u5165"} {resources.length} / 10
            </span>
          </div>
          <textarea
            id="resources"
            value={resourcesText}
            onChange={(event) => setResourcesText(event.target.value)}
            placeholder="\u6bcf\u884c\u4e00\u4e2a URL \u6216\u6807\u9898"
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "\u4fdd\u5b58\u4e2d..." : "\u5f00\u59cb\u5206\u6790"}
        </button>
      </form>
    </>
  );
}
