// Original learner-book symbols. Presentation only: never alter source blocks or IDs.
export const lessonIcons = {
  read: { symbol: "📘", label: "Read Carefully", meaning: "Read the story or concept." },
  reflection: { symbol: "💭", label: "Pause and Reflect", meaning: "Think and write your honest response." },
  activity: { symbol: "✍️", label: "Activity", meaning: "Put the idea into practice." },
  checkpoint: { symbol: "✅", label: "Checkpoint", meaning: "Show what you have learned." },
  home: { symbol: "🏠", label: "Try This at Home", meaning: "Try the learning beyond the classroom." },
  portfolio: { symbol: "📂", label: "Portfolio evidence", meaning: "Keep this work as evidence of your growth." },
  equation: { symbol: "⬜", label: "Thinking Equation", meaning: "Pause and consider the idea." },
} as const;

export const learningLevelIcons = {
  Remember: "🔍",
  Understand: "💡",
  Apply: "🛠️",
  Analyze: "🔬",
  Evaluate: "⚖️",
  Create: "🌟",
} as const;

export type LessonIconName = keyof typeof lessonIcons;

export function lessonHeadingText(text: string) {
  return text.replace(/^(?:(?:📘|💭|✍️?|✅|🏠|📂|⬜)\s*)+/u, "").trim();
}
