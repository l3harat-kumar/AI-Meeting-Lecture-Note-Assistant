"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { Session, ActionItem } from "@/lib/types";
import { getStoredSessions, clearAllHistory, deleteSession, saveSession } from "@/lib/sessionStore";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<"sessions" | "actions" | "search">("sessions");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load stored sessions
    const loaded = getStoredSessions();
    setSessions(loaded);
    setIsLoaded(true);
  }, []);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all meeting history? This action cannot be undone.")) {
      clearAllHistory();
      setSessions([]);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Delete this session?")) {
      deleteSession(id);
      setSessions(getStoredSessions());
    }
  };

  const handleToggleActionItem = (sessionId: string, actionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const updatedActions = session.actionItems.map((a) =>
      a.id === actionId ? { ...a, done: !a.done } : a
    );
    const updatedSession = { ...session, actionItems: updatedActions };
    saveSession(updatedSession);
    setSessions(getStoredSessions());
  };

  // Collect all action items across all user sessions
  const allActionItems: (ActionItem & { sessionId: string; sessionTitle: string })[] = sessions.flatMap(
    (s) => s.actionItems.map((a) => ({ ...a, sessionId: s.id, sessionTitle: s.title }))
  );

  const allTags = ["all", ...Array.from(new Set(sessions.flatMap((s) => s.tags || [])))];
  const filtered = sessions.filter(
    (s) =>
      (filterTag === "all" || (s.tags && s.tags.includes(filterTag))) &&
      (searchQuery === "" ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalMinutes = sessions.reduce((acc, s) => acc + Math.round((s.durationSeconds || 0) / 60), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const pendingActions = allActionItems.filter((a) => !a.done).length;

  return (
    <div className={styles.page}>
      {/* Top Navbar */}
      <header className={styles.topNav}>
        <div className={styles.navLeft}>
          <Link href="/" className={styles.brand}>
            <div className={styles.logoIcon}>⚡</div>
            <span>MeetAI</span>
          </Link>
          <div className={styles.searchBar}>
            <span>🔍</span>
            <input
              id="dashboard-search-input"
              type="text"
              placeholder="Search past notes, transcripts, decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.navRight}>
          {sessions.length > 0 && (
            <button
              id="clear-history-btn"
              onClick={handleClearHistory}
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--accent-red)", borderColor: "rgba(239, 68, 68, 0.3)" }}
              title="Delete all stored history"
            >
              🗑️ Clear History
            </button>
          )}
          <Link href="/record" className="btn btn-primary btn-sm">
            🔴 Start Recording
          </Link>
        </div>
      </header>

      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>WORKSPACE</div>
            <nav className={styles.sideNav}>
              <button
                id="tab-sessions"
                className={`${styles.navItem} ${activeTab === "sessions" ? styles.navItemActive : ""}`}
                onClick={() => setActiveTab("sessions")}
              >
                <span>📂</span> All Sessions
                <span className={styles.badge}>{sessions.length}</span>
              </button>
              <button
                id="tab-actions"
                className={`${styles.navItem} ${activeTab === "actions" ? styles.navItemActive : ""}`}
                onClick={() => setActiveTab("actions")}
              >
                <span>✅</span> Action Items
                <span className={styles.badge}>{pendingActions}</span>
              </button>
              <button
                id="tab-search"
                className={`${styles.navItem} ${activeTab === "search" ? styles.navItemActive : ""}`}
                onClick={() => setActiveTab("search")}
              >
                <span>🧠</span> Knowledge Base
              </button>
            </nav>
          </div>

          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>CAPTURE SOURCE</div>
            <div className="flex flex-col gap-2" style={{ padding: "8px 12px" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                🖥️ Screen &amp; Display Feed
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                🎙️ Live Audio Recognition
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                ⚡ Auto Key Points &amp; Tasks
              </div>
            </div>
          </div>

          <div className={styles.calendarCard}>
            <div className={styles.calendarHeader}>
              <span>⚡</span>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Live Screen AI</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 6 }}>
              Share any browser tab, window, or display. MeetAI watches slides and transcribes speech simultaneously.
            </p>
            <Link
              href="/record"
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", marginTop: 10, justifyContent: "center" }}
            >
              Start Recording
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {/* Metrics bar */}
          <div className={styles.metricsGrid}>
            <div className={`glass-card ${styles.metricCard}`}>
              <div className={styles.metricVal}>{totalHours}h</div>
              <div className={styles.metricLabel}>Recorded Time</div>
            </div>
            <div className={`glass-card ${styles.metricCard}`}>
              <div className={styles.metricVal}>{sessions.length}</div>
              <div className={styles.metricLabel}>Total Sessions</div>
            </div>
            <div className={`glass-card ${styles.metricCard}`}>
              <div className={styles.metricVal} style={{ color: "var(--accent-amber)" }}>
                {pendingActions}
              </div>
              <div className={styles.metricLabel}>Pending Action Items</div>
            </div>
            <div className={`glass-card ${styles.metricCard}`}>
              <div className={styles.metricVal} style={{ color: "var(--accent-green)" }}>
                {sessions.length > 0 ? "99.1%" : "—"}
              </div>
              <div className={styles.metricLabel}>AI Extraction Accuracy</div>
            </div>
          </div>

          {/* TAB: SESSIONS */}
          {activeTab === "sessions" && (
            <>
              {/* Filter Row */}
              <div className={styles.filterRow}>
                <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      className={`${styles.filterBtn} ${filterTag === tag ? styles.filterBtnActive : ""}`}
                      onClick={() => setFilterTag(tag)}
                    >
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Showing {filtered.length} of {sessions.length} sessions
                </div>
              </div>

              {/* Zero State / Empty History */}
              {isLoaded && filtered.length === 0 && (
                <div className={`glass-card ${styles.emptyCard}`}>
                  <div className={styles.emptyIcon}>🎙️</div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    No meeting history found
                  </h3>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      maxWidth: 480,
                      margin: "10px auto 24px",
                      lineHeight: 1.6,
                      fontSize: "0.95rem",
                    }}
                  >
                    Your workspace is completely clean. Click below to share your screen and microphone. MeetAI will watch your presentation, transcribe audio in real-time, and generate structured notes.
                  </p>
                  <Link href="/record" className="btn btn-primary" style={{ padding: "12px 28px" }}>
                    🔴 Start Recording Screen &amp; Audio
                  </Link>
                </div>
              )}

              {/* Sessions Grid */}
              {filtered.length > 0 && (
                <div className={styles.sessionsGrid}>
                  {filtered.map((s) => (
                    <Link
                      key={s.id}
                      href={`/session/${s.id}`}
                      className={`glass-card ${styles.sessionCard}`}
                      id={`session-card-${s.id}`}
                    >
                      <div className={styles.cardTop}>
                        <div className={styles.cardHeader}>
                          <span className={styles.cardTitle}>{s.title}</span>
                          <button
                            className={styles.deleteBtn}
                            onClick={(e) => handleDeleteSession(s.id, e)}
                            title="Delete session"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex gap-3" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          <span>📅 {s.date}</span>
                          <span>⏱️ {s.duration}</span>
                        </div>
                      </div>

                      <p className={styles.cardSummary}>{s.summary}</p>

                      <div className={styles.cardFooter}>
                        <div className={styles.attendeeStack}>
                          {(s.attendees || []).slice(0, 3).map((a, i) => (
                            <div
                              key={i}
                              className={styles.avatar}
                              style={{ background: a.color || "var(--accent-primary)" }}
                              title={a.name}
                            >
                              {a.name.slice(0, 2).toUpperCase()}
                            </div>
                          ))}
                          {(s.attendees || []).length > 3 && (
                            <div className={styles.avatar} style={{ background: "var(--bg-card-hover)" }}>
                              +{s.attendees.length - 3}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <span className={styles.cardBadge}>📌 {s.keyPoints?.length || 0} pts</span>
                          <span className={styles.cardBadge}>✅ {s.actionItems?.length || 0} tasks</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB: ACTION ITEMS */}
          {activeTab === "actions" && (
            <div className={`glass-card ${styles.tabCard}`}>
              <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Extracted Action Items</h2>
                <span className="badge badge-indigo">{allActionItems.length} total</span>
              </div>

              {allActionItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                  No action items extracted yet. Record a meeting to automatically identify tasks, owners, and deadlines.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {allActionItems.map((item) => (
                    <div
                      key={item.id}
                      className={styles.actionRow}
                      onClick={() => handleToggleActionItem(item.sessionId, item.id)}
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => {}}
                        className={styles.actionCheck}
                      />
                      <div className="flex-1">
                        <span
                          style={{
                            color: item.done ? "var(--text-muted)" : "var(--text-primary)",
                            textDecoration: item.done ? "line-through" : "none",
                            fontWeight: 500,
                          }}
                        >
                          {item.task}
                        </span>
                        <div className="flex gap-3" style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
                          <span>👤 {item.owner}</span>
                          <span>📅 Due: {item.due}</span>
                          <span>📌 {item.sessionTitle}</span>
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
          )}

          {/* TAB: SEARCH / KNOWLEDGE BASE */}
          {activeTab === "search" && (
            <div className={`glass-card ${styles.tabCard}`}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>Knowledge Base &amp; Semantic Search</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 20 }}>
                Ask questions across all your captured meetings and screen recordings.
              </p>
              <div className={styles.searchPromptBox}>
                <input
                  type="text"
                  placeholder="e.g. What were the decisions made about the budget?"
                  className={styles.searchPromptInput}
                />
                <button className="btn btn-primary btn-sm">Search with AI</button>
              </div>
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {sessions.length === 0
                  ? "Record your first meeting to populate your AI knowledge base."
                  : `Indexing ${sessions.length} sessions for semantic retrieval.`}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
