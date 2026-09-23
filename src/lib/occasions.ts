/**
 * Occasions shown on the landing page. Each links to /write?occasion=key,
 * which swaps in writing prompts for that occasion. The occasion is a
 * presentation hint only: it is never stored, and every letter follows the
 * same rules whichever card it started from.
 */

export type Occasion = {
  key: string;
  title: string;
  summary: string;
  prompts: readonly string[];
};

export const OCCASIONS = [
  {
    key: "wedding",
    title: "Your wedding day",
    summary: "Write it tonight. It arrives on your first anniversary.",
    prompts: [
      "Describe the moment from today you most want to remember clearly.",
      "What do you hope your first year together will have taught you?",
      "Write down one promise you did not say aloud at the ceremony.",
    ],
  },
  {
    key: "anniversary",
    title: "An anniversary",
    summary: "Write to the next one and record what this year held.",
    prompts: [
      "What surprised you most about this year together?",
      "Which small, ordinary habit of theirs do you love?",
      "Where do you hope you will both be when this arrives?",
    ],
  },
  {
    key: "baby",
    title: "A new arrival",
    summary: "A letter for a first birthday, from the parent you are today.",
    prompts: [
      "What does an ordinary night look like at the moment?",
      "What did you feel the first time you held them?",
      "What do you want them to know about the day they were born?",
    ],
  },
  {
    key: "graduation",
    title: "A graduation",
    summary: "Encouragement that arrives a year into what comes next.",
    prompts: [
      "What are you proudest of them for, beyond the results?",
      "Which advice do you wish someone had given you at their age?",
      "What do you think they will be doing when this arrives?",
    ],
  },
  {
    key: "self",
    title: "A letter to yourself",
    summary: "A check-in with the person you will be in one year or five.",
    prompts: [
      "What worries you now that you hope will not matter by then?",
      "What do you want to have started, finished, or let go of?",
      "Describe an ordinary day in your life today, in detail.",
    ],
  },
  {
    key: "farewell",
    title: "Someone moving away",
    summary: "Arrives on the first birthday you spend apart.",
    prompts: [
      "What will you miss most about living close to each other?",
      "Describe one shared memory in as much detail as you can.",
      "What do you want to plan for the next time you meet?",
    ],
  },
] as const satisfies readonly Occasion[];

export type OccasionKey = (typeof OCCASIONS)[number]["key"];

/** Unknown or missing keys fall back to the wedding prompts. */
export function occasionFor(key: unknown): Occasion {
  return OCCASIONS.find((o) => o.key === key) ?? OCCASIONS[0];
}
