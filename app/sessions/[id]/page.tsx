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
  result: RecommendationResult | null;
};

type RecommendationItem = {
  resource_id: string;
  category: "primary" | "complementary" | "not_recommended_now";
  rank: number | null;
  reason: string;
  resource: Resource | null;
};

type RecommendationResult = {
  primary: RecommendationItem | null;
  complementary: RecommendationItem[];
  not_recommended_now: RecommendationItem[];
  comparative_summary: string;
  primary_reason: string;
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

            {session.status === "pending" || session.status === "processing" ? (
              <p className="notice">
                {"\u6b63\u5728\u751f\u6210\u63a8\u8350\uff0c\u8bf7\u7a0d\u540e\u5237\u65b0\u3002"}
              </p>
            ) : null}

            {session.status === "failed" ? (
              <p className="error">
                {session.error_message ?? "\u8fd9\u4e2a\u5b66\u4e60\u4efb\u52a1\u5904\u7406\u5931\u8d25\u3002"}
              </p>
            ) : null}

            {session.result ? (
              <section>
                <h3>{"Primary Recommendation"}</h3>
                {session.result.primary ? (
                  <RecommendationBlock item={session.result.primary} />
                ) : (
                  <p className="muted">{"\u6682\u65e0\u4e3b\u63a8\u8350\u3002"}</p>
                )}

                <h3>{"Supporting Resources"}</h3>
                {session.result.complementary.length > 0 ? (
                  <ul className="list">
                    {session.result.complementary.map((item) => (
                      <RecommendationListItem
                        key={item.resource_id}
                        item={item}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="muted">{"\u6ca1\u6709\u989d\u5916\u8865\u5145\u8d44\u6e90\u3002"}</p>
                )}

                <h3>{"Not Recommended Now"}</h3>
                {session.result.not_recommended_now.length > 0 ? (
                  <ul className="list">
                    {session.result.not_recommended_now.map((item) => (
                      <RecommendationListItem
                        key={item.resource_id}
                        item={item}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="muted">{"\u6ca1\u6709\u9700\u8981\u6682\u7f13\u7684\u8d44\u6e90\u3002"}</p>
                )}

                <h3>{"Comparative Reasoning"}</h3>
                <p>{session.result.comparative_summary}</p>

                <h3>{"Confidence"}</h3>
                <p>
                  {session.confidence_level ?? "\u6682\u65e0"}
                  {session.confidence_reason
                    ? `: ${session.confidence_reason}`
                    : ""}
                </p>
              </section>
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

function RecommendationBlock({ item }: { item: RecommendationItem }) {
  return (
    <div className="list-item">
      <strong>{item.resource?.input_text ?? item.resource_id}</strong>
      <p>{item.reason}</p>
    </div>
  );
}

function RecommendationListItem({ item }: { item: RecommendationItem }) {
  return (
    <li className="list-item">
      <strong>{item.resource?.input_text ?? item.resource_id}</strong>
      <p>{item.reason}</p>
    </li>
  );
}
