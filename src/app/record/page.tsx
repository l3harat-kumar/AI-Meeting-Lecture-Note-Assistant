"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./record.module.css";
import { TranscriptItem, KeyPoint, ActionItem, Decision, Session } from "@/lib/types";
import { extractInsightsFromTranscript } from "@/lib/aiExtractor";
import { saveSession } from "@/lib/sessionStore";

export default function RecordPage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState("Live Presentation & Meeting");
  const [screenActive, setScreenActive] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [activeView, setActiveView] = useState<"screen" | "transcript">("screen");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Live intelligence state
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Check Speech Recognition support in browser
    if (typeof window !== "undefined") {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        setSpeechSupported(true);
      }
    }
    return () => {
      stopAllMedia();
    };
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Start Screen Capture + Audio
  const handleStartRecording = async () => {
    setStatusMessage("Requesting screen & audio permissions...");
    try {
      let screenStream: MediaStream | null = null;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } catch (screenErr) {
        console.warn("Screen share cancelled or not allowed:", screenErr);
        // Fallback to camera/mic if screen not granted
        try {
          screenStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (mediaErr) {
          console.warn("Camera fallback also unavailable:", mediaErr);
        }
      }

      if (screenStream) {
        streamRef.current = screenStream;
        setScreenActive(true);

        // Listen for when user stops sharing screen from browser chrome
        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            setScreenActive(false);
          };
        }

        // Attach to video element
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
          videoRef.current.play().catch((err) => console.log("Video play error:", err));
        }
      }

      // Initialize Speech Recognition if supported
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec && micActive) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = false;
          rec.lang = "en-US";

          rec.onresult = (event: any) => {
            const current = event.resultIndex;
            const text = event.results[current][0].transcript.trim();
            if (text) {
              addTranscriptLine(text, "You", "#6366f1", "voice");
            }
          };

          rec.onerror = (event: any) => {
            console.warn("Speech recognition error:", event.error);
          };

          rec.onend = () => {
            // Auto-restart if still recording
            if (isRecording && !isPaused && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (_) {}
            }
          };

          rec.start();
          recognitionRef.current = rec;
        } catch (err) {
          console.warn("Failed to start SpeechRecognition:", err);
        }
      }

      setIsRecording(true);
      setIsPaused(false);
      setStatusMessage("");

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);

      // Start periodic slide snapshot (every 25 seconds)
      snapshotIntervalRef.current = setInterval(() => {
        captureFrameSnapshot();
      }, 25000);

      // Take initial snapshot after 3s
      setTimeout(() => {
        captureFrameSnapshot();
      }, 3000);
    } catch (err: any) {
      console.error("Recording error:", err);
      alert("Could not start screen or audio recording: " + (err.message || err));
    }
  };

  const stopAllMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
  };

  const captureFrameSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = Math.min(640, video.videoWidth);
      canvas.height = Math.min(360, video.videoHeight);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setSnapshots((prev) => [...prev.slice(-5), dataUrl]);
      }
    }
  };

  const addTranscriptLine = (text: string, speaker: string, color: string, source: "voice" | "ocr" | "note") => {
    const newItem: TranscriptItem = {
      id: `tr_${Date.now()}_${Math.random()}`,
      speaker,
      color,
      time: formatTime(elapsed),
      text,
      source,
    };

    setTranscript((prev) => {
      const updated = [...prev, newItem];
      // Run AI insights extractor
      const insights = extractInsightsFromTranscript(updated);
      setKeyPoints(insights.keyPoints);
      setActionItems(insights.actionItems);
      setDecisions(insights.decisions);
      return updated;
    });

    // Auto-scroll
    setTimeout(() => {
      if (transcriptBottomRef.current) {
        transcriptBottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleAddManualRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    addTranscriptLine(manualInput.trim(), "Presenter", "#06b6d4", "note");
    setManualInput("");
  };

  // Finish and Save Session
  const handleFinishSession = () => {
    stopAllMedia();
    setIsRecording(false);

    // Compute final insights
    const insights = extractInsightsFromTranscript(transcript);
    const newSessionId = Date.now().toString();

    const newSession: Session = {
      id: newSessionId,
      title: meetingTitle || "Recorded Presentation Session",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      createdAt: Date.now(),
      duration: formatTime(elapsed),
      durationSeconds: elapsed,
      attendees: insights.attendees,
      summary: insights.summary,
      keyPoints: insights.keyPoints,
      actionItems: insights.actionItems,
      decisions: insights.decisions,
      topics: insights.topics,
      transcript: transcript,
      tags: ["recording", screenActive ? "screen" : "audio"],
      status: "completed",
      screenSnapshots: snapshots,
    };

    saveSession(newSession);
    router.push(`/session/${newSessionId}`);
  };

  return (
    <div className={styles.page}>
      {/* Hidden canvas for capturing video snapshots */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Top bar */}
      <header className={styles.topBar}>
        <Link href="/dashboard" className={styles.backBtn} onClick={() => stopAllMedia()}>
          ← Dashboard
        </Link>
        <div className={styles.meetingTitle}>
          {isRecording && <span className={styles.recDot} />}
          <span>{isRecording ? meetingTitle : "Start Live Screen & Audio Recording"}</span>
          {isRecording && <span className={styles.timer}>{formatTime(elapsed)}</span>}
        </div>
        <div className="flex gap-2">
          {isRecording && (
            <button
              id="finish-recording-btn"
              className="btn btn-primary btn-sm"
              onClick={handleFinishSession}
            >
              ✓ Finish &amp; Generate Notes
            </button>
          )}
        </div>
      </header>

      <div className={styles.layout}>
        {/* Left Pane: Setup or Live Screen/Transcript */}
        <div className={styles.leftPane}>
          {!isRecording ? (
            /* Pre-recording setup panel */
            <div className={styles.setupPanel}>
              <div className={styles.setupIcon}>🖥️</div>
              <h2>Ready to Capture Your Screen</h2>
              <p>
                MeetAI will watch your presentation, slides, or documents in real-time, transcribe spoken discussions, and extract key points &amp; action items.
              </p>

              <div style={{ width: "100%", maxWidth: 480, textAlign: "left" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Session Title
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Q4 Strategy Review, CS Lecture Week 3"
                  className={styles.quickInput}
                  style={{ width: "100%", marginTop: 6 }}
                />
              </div>

              <div className={styles.setupOptions}>
                <div
                  className={`${styles.optionCard} ${styles.optionActive}`}
                  onClick={() => setScreenActive(!screenActive)}
                >
                  <span className={styles.optionIcon}>🖥️</span>
                  <div>
                    <div className={styles.optionLabel}>Screen &amp; Window Capture</div>
                    <div className={styles.optionSub}>Share slides, browser tabs, or code windows</div>
                  </div>
                  <div className={`${styles.optionToggle} ${styles.toggleOn}`} />
                </div>

                <div
                  className={`${styles.optionCard} ${micActive ? styles.optionActive : ""}`}
                  onClick={() => setMicActive(!micActive)}
                >
                  <span className={styles.optionIcon}>🎙️</span>
                  <div>
                    <div className={styles.optionLabel}>Live Audio Transcription</div>
                    <div className={styles.optionSub}>
                      {speechSupported
                        ? "Web Speech API ready (English)"
                        : "Microphone input + manual remarks"}
                    </div>
                  </div>
                  <div className={`${styles.optionToggle} ${micActive ? styles.toggleOn : ""}`} />
                </div>
              </div>

              <div className={styles.consentBanner}>
                🔒 <strong>Privacy Assured:</strong> Screen frames and audio are processed directly on your device. Zero cloud retention option enabled.
              </div>

              {statusMessage && (
                <div style={{ color: "var(--accent-tertiary)", fontSize: "0.85rem" }}>
                  {statusMessage}
                </div>
              )}

              <button
                id="start-capture-btn"
                className="btn btn-primary"
                style={{ padding: "14px 36px", fontSize: "1rem", marginTop: 10 }}
                onClick={handleStartRecording}
              >
                🔴 Share Screen &amp; Start Recording
              </button>
            </div>
          ) : (
            /* Active recording interface */
            <>
              <div className={styles.activeHeader}>
                <div className={styles.viewTabs}>
                  <button
                    className={`${styles.viewTab} ${activeView === "screen" ? styles.viewTabActive : ""}`}
                    onClick={() => setActiveView("screen")}
                  >
                    🖥️ Screen Feed
                  </button>
                  <button
                    className={`${styles.viewTab} ${activeView === "transcript" ? styles.viewTabActive : ""}`}
                    onClick={() => setActiveView("transcript")}
                  >
                    💬 Live Transcript ({transcript.length})
                  </button>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={captureFrameSnapshot}
                    title="Capture slide frame for OCR"
                  >
                    📸 Take Slide Snapshot
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleFinishSession}
                  >
                    Stop &amp; Save
                  </button>
                </div>
              </div>

              {activeView === "screen" ? (
                <div className={styles.screenFeedArea}>
                  <div className={styles.videoContainer}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={styles.screenVideo}
                    />
                    <div className={styles.videoOverlay}>
                      <span className={styles.recDot} />
                      <span>{screenActive ? "LIVE SCREEN CAPTURE ACTIVE" : "SCREEN FEED PAUSED"}</span>
                    </div>
                  </div>

                  {snapshots.length > 0 && (
                    <div>
                      <div className={styles.panelSectionTitle}>
                        SLIDE SNAPSHOTS ({snapshots.length})
                      </div>
                      <div className={styles.snapshotGrid}>
                        {snapshots.map((snap, i) => (
                          <img
                            key={i}
                            src={snap}
                            alt={`Slide frame ${i + 1}`}
                            className={styles.snapshotThumb}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.transcriptArea}>
                  {transcript.length === 0 ? (
                    <div className={styles.transcriptEmpty}>
                      🎙️ Listening for speech... Speak into your microphone or type remarks below to see live transcript and automatic AI intelligence extraction.
                    </div>
                  ) : (
                    transcript.map((item) => (
                      <div key={item.id} className={styles.transcriptLine}>
                        <div className={styles.speakerDot} style={{ background: item.color }} />
                        <div className={styles.transcriptContent}>
                          <div className={styles.transcriptMeta}>
                            <span className={styles.speakerName} style={{ color: item.color }}>
                              {item.speaker}
                            </span>
                            <span className={styles.timestamp}>{item.time}</span>
                            {item.source === "ocr" && <span className="badge badge-indigo">Slide OCR</span>}
                          </div>
                          <p className={styles.transcriptText}>{item.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={transcriptBottomRef} />
                </div>
              )}

              {/* Quick Remark / Speech Input Bar */}
              <form onSubmit={handleAddManualRemark} className={styles.quickInputBar}>
                <input
                  type="text"
                  placeholder="Speak into microphone or type spoken remark / action item here (Press Enter)..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className={styles.quickInput}
                />
                <button type="submit" className="btn btn-secondary btn-sm">
                  Add Note
                </button>
              </form>

              {/* Audio Wave Bar */}
              <div className={styles.bottomWave}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className={styles.waveBar}
                    style={{
                      height: `${4 + ((i * 7) % 22)}px`,
                      animationDelay: `${(i * 0.05).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Pane: Live AI Smart Panel */}
        <div className={styles.rightPane}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>
              <span className={styles.liveDot} />
              AI Intelligence
            </span>
            <span className="badge badge-indigo">Real-Time</span>
          </div>

          {/* Key Points */}
          <div>
            <div className={styles.panelSectionTitle}>
              📌 Key Points ({keyPoints.length})
            </div>
            {keyPoints.length === 0 ? (
              <div className={styles.panelEmpty}>
                Waiting for spoken discussion or slide changes...
              </div>
            ) : (
              <div className={styles.keyPointsList}>
                {keyPoints.map((kp) => (
                  <div key={kp.id} className={styles.keyPointItem}>
                    <div className={styles.kpDot} />
                    <span>{kp.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Items */}
          <div>
            <div className={styles.panelSectionTitle}>
              ✅ Action Items ({actionItems.length})
            </div>
            {actionItems.length === 0 ? (
              <div className={styles.panelEmpty}>
                No tasks voiced yet. Try saying: &quot;I will follow up by Friday&quot;
              </div>
            ) : (
              <div className={styles.actionItemsList}>
                {actionItems.map((act) => (
                  <div key={act.id} className={styles.panelAction}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {act.task}
                      </div>
                      <div className="flex gap-2" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                        <span>👤 {act.owner}</span>
                        <span>📅 {act.due}</span>
                      </div>
                    </div>
                    <span className="badge badge-amber">{act.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Decisions */}
          <div>
            <div className={styles.panelSectionTitle}>
              ⚖️ Decisions ({decisions.length})
            </div>
            {decisions.length === 0 ? (
              <div className={styles.panelEmpty}>
                No formal decisions logged yet.
              </div>
            ) : (
              <div className={styles.decisionsList}>
                {decisions.map((dec) => (
                  <div key={dec.id} className={styles.decisionItem}>
                    <span>✓ {dec.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
