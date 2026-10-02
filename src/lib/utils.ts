import type { Quest, DailyTask, MainTask, SubQuest, WeeklyState, HistoryEntry, AppState, DailyState, PleasureReward } from "./types";

// ── ID ────────────────────────────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Week helpers ──────────────────────────────────────────────────────────
export function getWeekId(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

export function getWeekEnd(date: Date = new Date()): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getMonthId(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ── Points ────────────────────────────────────────────────────────────────
export const POINTS = {
  dailyPersonal: 1,
  dailyChore: 1.5,
  weeklyGoalBonus: 5,
  recurringQuest: 3,
  oneTimeQuest: 10,
  subtask: 3,
  mainTaskBonus: 20,
} as const;

// ── Random ────────────────────────────────────────────────────────────────
export function pickUniqueRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// ── Sigil colours ─────────────────────────────────────────────────────────
export const AVATAR_COLORS = [
  "#5C291C", // Dragon blood
  "#300733", // Shadow plum
  "#246E48", // Verdant oak
  "#B0BFB8", // Mithril
];

export function getAvatarInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ── Factories ─────────────────────────────────────────────────────────────

export function createQuest(title: string, recurring = true, shared = false): Quest {
  const now = new Date().toISOString();
  return { id: generateId(), title: title.trim(), recurring, shared, createdAt: now, updatedAt: now, status: "active" };
}

export function createDailyTask(
  title: string,
  shared = false,
  category: "personal" | "chore" = "personal",
  weeklyGoal?: number
): DailyTask {
  const now = new Date().toISOString();
  return {
    id: generateId(), title: title.trim(), shared, createdAt: now, updatedAt: now, active: true,
    category, weeklyGoal,
  };
}

export function createPleasureReward(title: string): PleasureReward {
  return { id: generateId(), title: title.trim(), createdAt: new Date().toISOString() };
}

export function createSubQuest(title: string, shared = false, recurring = false): SubQuest {
  return {
    id: generateId(), title: title.trim(), shared, recurring,
    weekId: null, completedAt: null, completedByUserIds: [],
  };
}

export function createMainTask(title: string, description = "", shared = false, id?: string): MainTask {
  const now = new Date().toISOString();
  return {
    id: id ?? generateId(), title: title.trim(), description, shared,
    createdAt: now, updatedAt: now,
    completedAt: null, completedByUserId: null,
    notes: "", subQuests: [],
  };
}

export function createWeeklyState(questIds: string[]): WeeklyState {
  const now = new Date();
  return {
    weekId: getWeekId(now),
    weekStartDate: getWeekStart(now).toISOString(),
    weekEndDate: getWeekEnd(now).toISOString(),
    questIds,
    doneStatus: {},
    weekDone: false,
    completedByUserId: null,
  };
}

export function createDailyState(): DailyState {
  return { date: todayString(), completedByUserIds: {}, pointer: 0 };
}

export function createHistoryEntry(
  weeklyState: WeeklyState,
  quests: Array<{ id: string; title: string; shared: boolean; fromMainTaskId?: string; fromMainTaskTitle?: string }>,
  completedByUserId: string | null
): HistoryEntry {
  return {
    id: generateId(),
    weekId: weeklyState.weekId,
    weekStartDate: weeklyState.weekStartDate,
    weekEndDate: weeklyState.weekEndDate,
    completedAt: new Date().toISOString(),
    completedByUserId,
    quests: quests.map((q) => ({
      id: q.id,
      title: q.title,
      shared: q.shared,
      doneByUserIds: weeklyState.doneStatus[q.id] ?? [],
      fromMainTaskId: q.fromMainTaskId,
      fromMainTaskTitle: q.fromMainTaskTitle,
    })),
  };
}

// ── Default state ─────────────────────────────────────────────────────────
/** A brand-new realm always starts completely blank — members add their own tasks. */
export function buildDefaultState(): AppState {
  return {
    users: [],
    currentUserId: null,
    questPool: [],
    dailyPool: [],
    mainTasks: [],
    weeklyState: null,
    dailyState: createDailyState(),
    history: [],
    completionLog: [],
    pleasurePool: [],
    monthlyRewards: [],
    theme: "light",
  };
}

// ── Format helpers ────────────────────────────────────────────────────────
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatWeekRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

export function isDuplicate(title: string, pool: { title: string }[]): boolean {
  return pool.some((t) => t.title.trim().toLowerCase() === title.trim().toLowerCase());
}
