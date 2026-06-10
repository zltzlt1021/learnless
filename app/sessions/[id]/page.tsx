"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Resource = {
  id: string;
  position: number;
  input_text: string;
  url: string | null;
  normalized_url: string | null;
  title: string | null;
  source_type: "url" | "title_only";
  evidence_level: string;
};

type SessionDetail = {
  id: string;
  learning_goal: string;
  preference: string | null;
  status: string;
  recommended_resource_title: string | null;
  confidence_level: string | null;
  confidence_reason: string | null;
  error_message: string | null;
  created_at: string;
  resources: Resource[];
  result: null;
};

const preferenceLabels: Record<string, string> = {
  quick_overview: "\u5feb\u901f\u6982\u89c8",
  hands_on_project: "\u52a8\u624b\u9879\u76ee",
  deep_understanding: "\u6df1\u5ea6\u7406\u89e3",
  interview_prep: "\u9762\u8bd5\u51c6\u5907"
};

export default function SessionPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch(`/api/sessions/${params.id}`);
        const data = await response.json();

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setError(data.error?.message ?? "\u8bfb\u53d6\u5b66\u4e60\u4efb\u52a1\u5931\u8d25\u3002");
          return;
        }

        setSession(data as SessionDetail);
      } catch {
        if (isMounted) {
          setError("\u7f51\u7edc\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="brand">{"\u5b66\u4e60\u4efb\u52a1"}</h1>
          <p className="subtitle">
            {"\u67e5\u770b\u8fd9\u6b21\u5df2\u4fdd\u5b58\u7684\u5b66\u4e60\u76ee\u6807\u548c\u5019\u9009\u8d44\u6e90\u3002"}
          </p>
        </div>
        <Link className="nav-link" href="/">
          {"\u65b0\u5efa"}
        </Link>
      </div>

      <section className="panel">
        {isLoading ? <p className="muted">{"\u8bfb\u53d6\u4e2d..."}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {session ? (
          <>
            <h2>{session.learning_goal}</h2>
            <p className="meta">
              {"\u504f\u597d\uff1a"}
              {session.preference
                ? preferenceLabels[session.preference] ?? session.preference
                : "\u672a\u9009\u62e9"}
            </p>
            <p className="meta">
              {"\u72b6\u6001\uff1a"}
              {session.status}
            </p>

            {session.status === "pending" ? (
              <p className="notice">
                {"\u5df2\u4fdd\u5b58\u3002AI \u5206\u6790\u5c06\u5728\u4e0b\u4e00\u9636\u6bb5\u63a5\u5165\u3002"}
              </p>
            ) : null}

            {session.status === "failed" ? (
              <p className="error">
                {session.error_message ?? "\u8fd9\u4e2a\u5b66\u4e60\u4efb\u52a1\u5904\u7406\u5931\u8d25\u3002"}
              </p>
            ) : null}

            <h3>{"\u5019\u9009\u8d44\u6e90"}</h3>
            <ul className="list">
              {session.resources.map((resource) => (
                <li className="list-item" key={resource.id}>
                  <strong>{resource.position}.</strong>{" "}
                  <span className="resource-title">{resource.input_text}</span>
                  <div className="meta">
                    {"\u7c7b\u578b\uff1a"}
                    {resource.source_type === "url" ? "URL" : "\u6807\u9898"}
                    {" \u00b7 \u8bc1\u636e\uff1a"}
                    {resource.evidence_level}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </>
  );
}
