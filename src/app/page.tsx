"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

const FEATURES = [
  {
    icon: "🎙️",
    title: "Real-Time Transcription",
    desc: "Powered by Whisper ASR with speaker diarization — know exactly who said what and when.",
    color: "purple",
  },
  {
    icon: "🧠",
    title: "AI Intelligence Layer",
    desc: "GPT-4o extracts key points, action items, and decisions from natural conversation in real time.",
    color: "cyan",
  },
  {
    icon: "🖥️",
    title: "Visual Capture",
    desc: "OCR captures text from shared slides, whiteboards, and documents seamlessly.",
    color: "pink",
  },
  {
    icon: "✅",
    title: "Action Item Tracking",
    desc: "Automatically detect tasks with owners and deadlines. Sync to Jira, Notion, or Asana.",
    color: "green",
  },
  {
    icon: "🔍",
    title: "Semantic Search",
    desc: "Chat with your entire meeting history. Ask anything — MeetAI finds the answer instantly.",
    color: "amber",
  },
  {
    icon: "🔒",
    title: "Privacy First",
    desc: "On-device mode, end-to-end encryption. GDPR, HIPAA & SOC 2 compliant.",
    color: "red",
  },
];

const STATS = [
  { value: "< 8%", label: "Word Error Rate" },
  { value: "85%+", label: "Action Item Accuracy" },
  { value: "< 3s", label: "Latency" },
  { value: "4h+", label: "Meeting Length Supported" },
];

const TESTIMONIALS = [
  {
    quote: "MeetAI has completely changed how our team runs standups. We never lose track of action items anymore.",
    name: "Priya Sharma",
    role: "Engineering Manager, Razorpay",
    avatar: "PS",
    color: "#6366f1",
  },
  {
    quote: "As a student, I can finally focus on understanding lectures instead of frantically taking notes.",
    name: "Arjun Mehta",
    role: "MBA Student, IIM Bangalore",
    avatar: "AM",
    color: "#06b6d4",
  },
  {
    quote: "The speaker diarization is uncanny. It correctly attributed comments in a 12-person all-hands.",
    name: "Lisa Chen",
    role: "Product Lead, Zepto",
    avatar: "LC",
    color: "#10b981",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [waveActive, setWaveActive] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.page}>
      {/* ── Navbar ── */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <div className="container flex items-center justify-between" style={{ height: "100%" }}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span>MeetAI</span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="#features" className={styles.navLink}>Features</Link>
            <Link href="#how-it-works" className={styles.navLink}>How it Works</Link>
            <Link href="#pricing" className={styles.navLink}>Pricing</Link>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
            <Link href="/record" className="btn btn-primary btn-sm">Start Recording</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            AI-Powered · Real-Time · Private
          </div>
          <h1 className={styles.heroTitle}>
            Your AI Second Brain<br />
            <span className={styles.heroGradient}>for Every Meeting</span>
          </h1>
          <p className={styles.heroSubtitle}>
            MeetAI listens, understands, and summarizes in real-time. Never miss a key point,
            action item, or decision again — in meetings, lectures, or workshops.
          </p>

          {/* Sound wave visualizer */}
          <div className={styles.waveContainer}>
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className={`${styles.waveBar} ${waveActive ? styles.waveBarActive : ""}`}
                style={{ animationDelay: `${i * 0.06}s`, animationDuration: `${0.6 + (i % 5) * 0.1}s` }}
              />
            ))}
          </div>

          <div className="flex gap-4 justify-center" style={{ flexWrap: "wrap" }}>
            <Link href="/record" className="btn btn-primary btn-lg">
              🎙️ Start Free Recording
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              📋 View Demo Dashboard
            </Link>
          </div>

          <p style={{ marginTop: 16, color: "var(--text-muted)", fontSize: "0.82rem", textAlign: "center" }}>
            No credit card required · Free 5 hours/month
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((s) => (
              <div key={s.label} className={styles.statCard}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="badge badge-purple" style={{ marginBottom: 16 }}>Core Features</div>
            <h2>Everything you need to<br /><span className={styles.heroGradient}>master your meetings</span></h2>
            <p style={{ marginTop: 16, maxWidth: 520, margin: "16px auto 0" }}>
              A complete AI pipeline that goes from raw audio to structured, actionable intelligence in seconds.
            </p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`glass-card ${styles.featureCard}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`${styles.featureIcon} ${styles[`featureIcon_${f.color}`]}`}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" className="section" style={{ background: "var(--bg-secondary)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="badge badge-cyan" style={{ marginBottom: 16 }}>How It Works</div>
            <h2>From audio to action items<br /><span className={styles.heroGradient}>in under 3 seconds</span></h2>
          </div>
          <div className={styles.stepsGrid}>
            {[
              { num: "01", icon: "🎙️", title: "Capture", desc: "MeetAI captures audio from your mic or virtual meeting, with real-time noise cancellation." },
              { num: "02", icon: "📝", title: "Transcribe", desc: "Whisper ASR + pyannote diarization converts speech to text, labeled by speaker." },
              { num: "03", icon: "🧠", title: "Understand", desc: "GPT-4o analyzes context to extract key points, action items, decisions, and topics." },
              { num: "04", icon: "📋", title: "Deliver", desc: "Structured summary appears live, then exports to Notion, Jira, Slack, or PDF." },
            ].map((step, i) => (
              <div key={step.num} className={styles.stepCard}>
                <div className={styles.stepNum}>{step.num}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < 3 && <div className={styles.stepArrow}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="badge badge-green" style={{ marginBottom: 16 }}>Testimonials</div>
            <h2>Loved by professionals<br /><span className={styles.heroGradient}>and students alike</span></h2>
          </div>
          <div className={styles.testimonialContainer}>
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`${styles.testimonialCard} glass-card ${i === activeTestimonial ? styles.testimonialActive : ""}`}
              >
                <p className={styles.testimonialQuote}>"{t.quote}"</p>
                <div className="flex items-center gap-3" style={{ marginTop: 20 }}>
                  <div className={styles.testimonialAvatar} style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.testimonialDots}>
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === activeTestimonial ? styles.dotActive : ""}`}
                onClick={() => setActiveTestimonial(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaOrb} />
        <div className="container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <h2 style={{ marginBottom: 16 }}>Ready to never miss a thing?</h2>
          <p style={{ marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
            Start your free account today — 5 hours/month free, no credit card required.
          </p>
          <Link href="/record" className="btn btn-primary btn-lg">
            🚀 Get Started Free
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className="container flex items-center justify-between" style={{ flexWrap: "wrap", gap: 16 }}>
          <div className={styles.logo} style={{ fontSize: "1.1rem" }}>
            <span className={styles.logoIcon}>⚡</span>
            <span>MeetAI</span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            © 2026 MeetAI. GDPR · HIPAA · SOC 2 Compliant.
          </p>
          <div className="flex gap-4">
            {["Privacy", "Terms", "Security"].map((l) => (
              <a key={l} href="#" style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
