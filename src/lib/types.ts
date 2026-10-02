// ── User ──────────────────────────────────────────────────────────────────

/** Client-visible user profile (no credential hashes). */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatarColor: string;
  createdAt: string;
  /** Founding member — can remove other members from the realm. */
  isAdmin: boolean;
}

/** @deprecated Use PublicUser on the client; full User lives server-side in auth-server.ts */
export type User = PublicUser;

// ═══════════════════════════════════════════════════════════════════════════
// QUEST  —  weekly pool task
// ═══════════════════════════════════════════════════════════════════════════

export interface Quest {
  id: string;
  title: string;
  /** recurring = returns to pool after completion; once = removed when done */
  recurring: boolean;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
  /** "active" = in the pool; "archived" = done and removed (once-tasks) */
  status: "active" | "archived";
}

// ═══════════════════════════════════════════════════════════════════════════
// DAILY TASK  —  recurring daily habit
// ═══════════════════════════════════════════════════════════════════════════

export interface DailyTask {
  id: string;
  title: string;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  /** personal = 1pt/completion, chore = 1.5pt/completion */
  category: "personal" | "chore";
  /** Optional "N times per week" target — hitting it awards a one-time weekly bonus */
  weeklyGoal?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TASK  —  big ambitious goal, may have sub-quests
// ═══════════════════════════════════════════════════════════════════════════

export interface SubQuest {
  id: string;
  title: string;
  shared: boolean;
  recurring: boolean;
  /** null = not yet added to weekly board; weekId = which week it was added */
  weekId: string | null;
  completedAt: string | null;
  completedByUserIds: string[];
}

export interface MainTask {
  id: string;
  title: string;
  description: string;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  completedByUserId: string | null;
  notes: string;
  subQuests: SubQuest[];
}

// ═══════════════════════════════════════════════════════════════════════════
// WEEKLY STATE  —  current week's active quests
// ═══════════════════════════════════════════════════════════════════════════

export interface WeeklyState {
  weekId: string;
  weekStartDate: string;
  weekEndDate: string;
  /** Ids of quests (Quest.id or SubQuest.id) drawn for this week */
  questIds: string[];
  /**
   * Per-quest completion: questId -> userId[]
   * Solo: needs 1 entry. Shared: needs all users.
   */
  doneStatus: Record<string, string[]>;
  /** True once "Complete Week" is triggered */
  weekDone: boolean;
  completedByUserId: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// DAILY STATE  —  today's daily task completions
// ═══════════════════════════════════════════════════════════════════════════

export interface DailyState {
  date: string;
  completedByUserIds: Record<string, string[]>;
  pointer: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY  —  completed weeks
// ═══════════════════════════════════════════════════════════════════════════

export interface HistoryEntry {
  id: string;
  weekId: string;
  weekStartDate: string;
  weekEndDate: string;
  completedAt: string;
  completedByUserId: string | null;
  quests: Array<{
    id: string;
    title: string;
    shared: boolean;
    doneByUserIds: string[];
    fromMainTaskId?: string;
    fromMainTaskTitle?: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETION LOG  —  every single completion event
// ═══════════════════════════════════════════════════════════════════════════

export interface CompletionLog {
  id: string;
  taskId: string;
  taskTitle: string;
  taskType: "quest" | "daily" | "mainTask" | "subQuest";
  completedAt: string;
  completedByUserId: string;
  /** Snapshotted at creation so historical totals stay stable even if task definitions later change. */
  points: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING  —  monthly rewards ("Wheel of Pleasure")
// ═══════════════════════════════════════════════════════════════════════════

export interface PleasureReward {
  id: string;
  title: string;
  createdAt: string;
}

export interface MonthlyReward {
  id: string;
  /** "YYYY-MM" */
  monthId: string;
  /** Array to gracefully handle ties */
  wonByUserId: string[];
  closedAt: string;
  prizeId: string | null;
  prizeTitle: string | null;
  claimedAt: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface AppState {
  users: PublicUser[];
  currentUserId: string | null;

  questPool: Quest[];
  dailyPool: DailyTask[];
  mainTasks: MainTask[];

  weeklyState: WeeklyState | null;
  dailyState: DailyState;

  history: HistoryEntry[];
  completionLog: CompletionLog[];

  pleasurePool: PleasureReward[];
  monthlyRewards: MonthlyReward[];

  theme: "light" | "dark";
}
