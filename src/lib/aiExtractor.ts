import { ActionItem, Decision, KeyPoint, SessionAttendee, SessionTopic, TranscriptItem } from "./types";

const ACTION_INDICATORS = [
  /i will\s+(.+)/i,
  /i'll\s+(.+)/i,
  /we should\s+(.+)/i,
  /we need to\s+(.+)/i,
  /let's\s+(.+)/i,
  /can you\s+(.+)/i,
  /action item[:\s]+(.+)/i,
  /todo[:\s]+(.+)/i,
  /follow up on\s+(.+)/i,
  /please\s+(.+)/i,
];

const DECISION_INDICATORS = [
  /decision[:\s]+(.+)/i,
  /we agreed\s+(.+)/i,
  /agreed[:\s]+(.+)/i,
  /we decided to\s+(.+)/i,
  /approved\s+(.+)/i,
  /confirmed[:\s]+(.+)/i,
];

const TIME_INDICATORS = [
  /(by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
  /(by\s+(?:tomorrow|eod|end of day|end of week|next week))/i,
  /(by\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d+)/i,
  /(in\s+\d+\s+(?:days|weeks|hours))/i,
];

export function extractInsightsFromTranscript(transcript: TranscriptItem[]) {
  const keyPoints: KeyPoint[] = [];
  const actionItems: ActionItem[] = [];
  const decisions: Decision[] = [];

  transcript.forEach((item, index) => {
    const text = item.text.trim();
    if (!text) return;

    // Check for action items
    let matchedAction = false;
    for (const regex of ACTION_INDICATORS) {
      const match = text.match(regex);
      if (match && match[1]) {
        let task = match[1].trim();
        // Capitalize first letter
        task = task.charAt(0).toUpperCase() + task.slice(1);

        // Detect deadline
        let due = "Next Sprint";
        for (const timeRegex of TIME_INDICATORS) {
          const timeMatch = text.match(timeRegex);
          if (timeMatch) {
            due = timeMatch[1].trim();
            break;
          }
        }

        const priority = /urgent|asap|critical|blocker|important/i.test(text)
          ? "high"
          : /eventually|low priority|later/i.test(text)
          ? "low"
          : "medium";

        actionItems.push({
          id: `act_${index}_${Date.now()}`,
          task,
          owner: item.speaker || "You",
          due,
          priority,
          done: false,
        });
        matchedAction = true;
        break;
      }
    }

    // Check for decisions
    for (const regex of DECISION_INDICATORS) {
      const match = text.match(regex);
      if (match && match[1]) {
        let dec = match[1].trim();
        dec = dec.charAt(0).toUpperCase() + dec.slice(1);
        decisions.push({
          id: `dec_${index}_${Date.now()}`,
          text: dec,
          timestamp: item.time,
        });
        break;
      }
    }

    // Check for key points: sentences with substantial information
    if (!matchedAction && text.length > 25) {
      // Clean up punctuation
      const cleanText = text.replace(/^[-•*]\s*/, "");
      const confidence = Math.min(99, Math.max(82, 90 + Math.floor(Math.random() * 8)));
      keyPoints.push({
        id: `kp_${index}_${Date.now()}`,
        text: cleanText,
        confidence,
        timestamp: item.time,
      });
    }
  });

  // Calculate attendees based on speakers
  const speakerMap = new Map<string, number>();
  transcript.forEach((t) => {
    speakerMap.set(t.speaker, (speakerMap.get(t.speaker) || 0) + 1);
  });

  const totalLines = transcript.length || 1;
  const colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
  let colorIndex = 0;

  const attendees: SessionAttendee[] = Array.from(speakerMap.entries()).map(([name, count]) => {
    const pct = Math.round((count / totalLines) * 100);
    const color = colors[colorIndex % colors.length];
    colorIndex++;
    return {
      name,
      color,
      role: name === "You" ? "Presenter" : "Participant",
      pct,
    };
  });

  // Generate topics
  const topics: SessionTopic[] = [];
  if (transcript.length > 0) {
    topics.push({
      label: "Main Discussion & Overview",
      duration: `${Math.max(1, Math.round(transcript.length * 0.5))} min`,
      pct: 60,
    });
    if (actionItems.length > 0) {
      topics.push({
        label: "Action Items & Execution",
        duration: `${Math.max(1, Math.round(actionItems.length * 0.4))} min`,
        pct: 25,
      });
    }
    if (decisions.length > 0) {
      topics.push({
        label: "Strategic Decisions",
        duration: "2 min",
        pct: 15,
      });
    }
  }

  // Generate a synthesized summary
  let summary = "";
  if (transcript.length === 0) {
    summary = "No speech or screen content was recorded during this session.";
  } else {
    const keySnippets = transcript.slice(0, 4).map((t) => t.text).join(" ");
    summary = `This session focused on collaborative discussion and presentation. Key topics covered include: ${keySnippets.slice(0, 240)}... The session captured ${actionItems.length} action item(s) and ${decisions.length} recorded decision(s).`;
  }

  return {
    keyPoints: keyPoints.slice(-10), // Keep latest 10 key points
    actionItems,
    decisions,
    attendees: attendees.length > 0 ? attendees : [{ name: "You", color: "#6366f1", role: "Presenter", pct: 100 }],
    topics: topics.length > 0 ? topics : [{ label: "General Meeting", duration: "1 min", pct: 100 }],
    summary,
  };
}
