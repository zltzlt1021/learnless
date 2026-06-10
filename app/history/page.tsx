"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HistorySession = {
  id: string;
  learning_goal: string;
  recommended_resource_title: string | null;
  confidence_level: string | null;
  status: string;
  created_at: string;
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const response = await fetch("/api/sessions");
        const data = await response.json();

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setError(data.error?.message ?? "\u8bfb\u53d6\u5386\u53f2\u8bb0\u5f55\u5931\u8d25\u3002");
          return;
        }

        setSessions(data.sessions ?? []);
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

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="brand">{"\u5386\u53f2"}</h1>
          <p className="subtitle">{"\u67e5\u770b\u4e4b\u524d\u521b\u5efa\u8fc7\u7684\u5b66\u4e60\u4efb\u52a1\u3002"}</p>
        </div>
        <Link className="nav-link" href="/">
          {"\u65b0\u5efa"}
        </Link>
      </div>

      <section className="panel">
        {isLoading ? <p className="muted">{"\u8bfb\u53d6\u4e2d..."}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {!isLoading && !error && sessions.length === 0 ? (
          <p className="muted">{"\u8fd8\u6ca1\u6709\u5386\u53f2\u8bb0\u5f55\u3002"}</p>
        ) : null}

        {sessions.length > 0 ? (
          <ul className="list">
            {sessions.map((session) => (
              <li className="list-item" key={session.id}>
                <Link href={`/sessions/${session.id}`}>
                  <strong>{session.learning_goal}</strong>
                </Link>
                <div className="meta">
                  {"\u63a8\u8350\u8d44\u6e90\uff1a"}
                  {session.recommended_resource_title ?? "\u5c1a\u672a\u751f\u6210"}
                </div>
                <div className="meta">
                  {"\u72b6\u6001\uff1a"}
                  {session.status}
                  {" \u00b7 \u7f6e\u4fe1\u5ea6\uff1a"}
                  {session.confidence_level ?? "\u6682\u65e0"}
                  {" \u00b7 "}
                  {new Date(session.created_at).toLocaleString("zh-CN")}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  );
}
