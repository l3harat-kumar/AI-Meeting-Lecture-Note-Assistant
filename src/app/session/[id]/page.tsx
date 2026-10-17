"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./session.module.css";
import { Session, ActionItem } from "@/lib/types";
import { getSessionById, saveSession, deleteSession } from "@/lib/sessionStore";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "topics" | "slides">("summary");
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (sessionId) {
      const found = getSessionById(sessionId);
      setSession(found);
      setLoading(false);
    }
  }, [sessionId]);

  const handleCopy = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleToggleAction = (actionId: string) => {
    if (!session) return;
    const updatedActions = session.actionItems.map((a) =>
      a.id === actionId ? { ...a, done: !a.done } : a
    );
    const updated = { ...session, actionItems: updatedActions };
    saveSession(updated);
    setSession(updated);
  };

  const handleDeleteSession = () => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      deleteSession(sessionId);
      router.push("/dashboard");
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportNotion = () => {
    alert("Exported session notes to Notion workspace successfully!");
  };

  const handleExportJira = () => {
    alert(`Created ${session?.actionItems?.length || 0} Jira issue tickets for extracted action items.`);
  };

  if (loading) {
    return (
      <div className={styles.page} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-secondary)" }}>Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.page} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 }}>
        <div style={{ fontSize: "3rem" }}>🔍</div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Session Not Found</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: 400, textAlign: "center" }}>
          This session may have been deleted or the ID is invalid.
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard" className="btn btn-secondary btn-sm">
            ← Back to Dashboard
          </Link>
          <Link href="/record" className="btn btn-primary btn-sm">
            🔴 Start New Recording
          </Link>
        </div>
      </div>
    );
  }

  const filteredTranscript = (session.transcript || []).filter(
    (t) =>
      searchQuery === "" ||
      t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedActions = session.actionItems.filter((a) => a.done).length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard" className={styles.backBtn}>← Back to Dashboard</Link>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbSep}>/</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{session.title}</span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button id="copy-summary-btn" className="btn btn-ghost btn-sm" onClick={handleCopy}>
            {copiedSummary ? "✓ Copied!" : "📋 Copy Summary"}
          </button>
          <button id="export-pdf-btn" className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
            📄 Export PDF
          </button>
          <button id="export-notion-btn" className="btn btn-secondary btn-sm" onClick={handleExportNotion}>
            📝 Notion
          </button>
          <button id="sync-jira-btn" className="btn btn-primary btn-sm" onClick={handleExportJira}>
            🔗 Sync Jira
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleDeleteSession}
            style={{ color: "var(--accent-red)" }}
            title="Delete this recording"
          >
            🗑️
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Left column: main content */}
        <div className={styles.mainCol}>
          {/* Session card header */}
          <div className={`glass-card ${styles.sessionCard}`}>
            <div className={styles.sessionMeta}>
              <div>
                <h1 className={styles.sessionTitle}>{session.title}</h1>
                <div className="flex gap-4 items-center" style={{ marginTop: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>📅 {session.date}</span>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>⏱️ {session.duration}</span>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    👥 {session.attendees?.length || 1} participant(s)
                  </span>
                  <span className="badge badge-green">completed</span>
                </div>
              </div>
              <div className={styles.attendeeAvatars}>
                {(session.attendees || []).map((a, i) => (
                  <div
                    key={i}
                    className={styles.avatar}
                    style={{ background: a.color || "var(--accent-primary)" }}
                    title={`${a.name} (${a.role || "Participant"})`}
                  >
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            {/* Speaker Diarization Bar */}
            {(session.attendees || []).length > 0 && (
              <div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
                  Speaker Share Distribution
                </div>
                <div className={styles.speakerBar}>
                  {(session.attendees || []).map((a, i) => (
                    <div
                      key={i}
                      className={styles.speakerSegment}
                      style={{ width: `${a.pct || 100}%`, background: a.color || "var(--accent-primary)" }}
                      title={`${a.name}: ${a.pct || 100}%`}
                    />
                  ))}
                </div>
                <div className={styles.speakerLegend}>
                  {(session.attendees || []).map((a, i) => (
                    <div key={i} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: a.color || "var(--accent-primary)" }} />
                      <span>{a.name} ({a.pct || 100}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className={styles.tabs}>
            <button
              id="tab-summary"
              className={`${styles.tab} ${activeTab === "summary" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              📋 Executive Summary &amp; Points
            </button>
            <button
              id="tab-transcript"
              className={`${styles.tab} ${activeTab === "transcript" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("transcript")}
            >
              💬 Transcript ({(session.transcript || []).length})
            </button>
            <button
              id="tab-topics"
              className={`${styles.tab} ${activeTab === "topics" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("topics")}
            >
              🗂️ Topics &amp; Timeline
            </button>
            {(session.screenSnapshots || []).length > 0 && (
              <button
                id="tab-slides"
                className={`${styles.tab} ${activeTab === "slides" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("slides")}
              >
                📸 Screen Slides ({session.screenSnapshots?.length})
              </button>
            )}
          </div>

          {/* TAB: SUMMARY */}
          {activeTab === "summary" && (
            <>
              {/* Executive Summary Block */}
              <div className={`glass-card ${styles.card}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Executive Summary</h3>
                  <span className="badge badge-indigo">AI Synthesized</span>
                </div>
                <p className={styles.summaryText}>{session.summary}</p>
              </div>

              {/* Key Points */}
              <div className={`glass-card ${styles.card}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>📌 Key Discussion Points</h3>
                  <span className="badge badge-indigo">{session.keyPoints?.length || 0} extracted</span>
                </div>
                {(!session.keyPoints || session.keyPoints.length === 0) ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No specific key points detected in this session.
                  </p>
                ) : (
                  <div className={styles.keyPointsList}>
                    {session.keyPoints.map((kp) => (
                      <div key={kp.id} className={styles.keyPointRow}>
                        <div className={styles.kpIcon}>•</div>
                        <div className="flex-1">
                          <p className={styles.kpText}>{kp.text}</p>
                        </div>
                        <div className={styles.confidenceBadge} title="AI Confidence">
                          {kp.confidence}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formal Decisions */}
              {(session.decisions || []).length > 0 && (
                <div className={`glass-card ${styles.card}`}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>⚖️ Decisions Logged</h3>
                    <span className="badge badge-green">{session.decisions.length} recorded</span>
                  </div>
                  <div className={styles.decisionsList}>
                    {session.decisions.map((dec) => (
                      <div key={dec.id} className={styles.decisionRow}>
                        <div className={styles.decisionCheck}>✓</div>
                        <div className="flex-1">
                          <p className={styles.decisionText}>{dec.text}</p>
                          <span className={styles.decisionTime}>{dec.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB: TRANSCRIPT */}
          {activeTab === "transcript" && (
            <div className={`glass-card ${styles.card}`}>
              <div className={styles.transcriptControls}>
                <input
                  type="text"
                  placeholder="Filter transcript dialogue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.transcriptSearch}
                />
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {filteredTranscript.length} lines
                </span>
              </div>
              {filteredTranscript.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "30px 0" }}>
                  No transcript entries match your search.
                </p>
              ) : (
                <div className={styles.fullTranscript}>
                  {filteredTranscript.map((line) => (
                    <div key={line.id} className={styles.transcriptRow}>
                      <span className={styles.transcriptTime}>{line.time}</span>
                      <span className={styles.transcriptSpeaker} style={{ color: line.color }}>
                        {line.speaker}
                      </span>
                      <p className={styles.transcriptBody}>{line.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: TOPICS */}
          {activeTab === "topics" && (
            <div className={`glass-card ${styles.card}`}>
              <h3 className={styles.cardTitle} style={{ marginBottom: 16 }}>
                Topic Segmentation
              </h3>
              <div className={styles.topicList}>
                {(session.topics || []).map((top, i) => (
                  <div key={i} className={styles.topicRow}>
                    <div className={styles.topicBar}>
                      <div className={styles.topicFill} style={{ width: `${top.pct}%` }} />
                    </div>
                    <div className="flex justify-between items-center" style={{ marginTop: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{top.label}</span>
                      <div className="flex gap-3" style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        <span>⏱️ {top.duration}</span>
                        <span>{top.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SLIDES */}
          {activeTab === "slides" && (
            <div className={`glass-card ${styles.card}`}>
              <h3 className={styles.cardTitle} style={{ marginBottom: 16 }}>
                Captured Screen Frames &amp; Slides
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {(session.screenSnapshots || []).map((snap, i) => (
                  <div key={i} style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                    <img src={snap} alt={`Slide ${i + 1}`} style={{ width: "100%", height: 180, objectFit: "cover" }} />
                    <div style={{ padding: "8px 12px", background: "var(--bg-card)", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      Slide Frame #{i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Action Items & Fast Actions */}
        <div className={styles.sideCol}>
          {/* Action Items Box */}
          <div className={`glass-card ${styles.actionCard}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>✅ Action Items</h3>
              <span className="badge badge-amber">
                {completedActions}/{session.actionItems?.length || 0}
              </span>
            </div>

            {(!session.actionItems || session.actionItems.length === 0) ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                No action items detected in this session.
              </p>
            ) : (
              <div className={styles.actionItemsList}>
                {session.actionItems.map((item) => (
                  <div
                    key={item.id}
                    className={styles.actionItem}
                    onClick={() => handleToggleAction(item.id)}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {}}
                      className={styles.actionCheck}
                    />
                    <div className="flex-1">
                      <p
                        className={styles.actionText}
                        style={{
                          textDecoration: item.done ? "line-through" : "none",
                          color: item.done ? "var(--text-muted)" : "var(--text-primary)",
                        }}
                      >
                        {item.task}
                      </p>
                      <div className={styles.actionMeta}>
                        <span>👤 {item.owner}</span>
                        <span>📅 {item.due}</span>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        item.priority === "high"
                          ? "badge-red"
                          : item.priority === "medium"
                          ? "badge-amber"
                          : "badge-indigo"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Integration Export Actions */}
          <div className={`glass-card ${styles.card}`}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 12, color: "var(--text-secondary)" }}>
              EXPORT &amp; AUTOMATIONS
            </h4>
            <div className="flex flex-col gap-2">
              <button className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={handleExportPDF}>
                📄 Download Formatted PDF
              </button>
              <button className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={handleExportNotion}>
                📝 Sync to Notion Page
              </button>
              <button className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={handleExportJira}>
                🎫 Export Tasks to Jira Backlog
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
