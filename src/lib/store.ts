"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import type { AppState, Quest, DailyTask, MainTask, SubQuest, WeeklyState, MonthlyReward } from "./types";
import {
  buildDefaultState, createQuest, createDailyTask, createMainTask, createSubQuest,
  createWeeklyState, createHistoryEntry, createDailyState, createPleasureReward,
  pickUniqueRandom, isDuplicate, todayString, generateId, getWeekId, getMonthId, POINTS,
} from "./utils";
import { buildSampleRealm, createMember } from "./sample";

const STORAGE_KEY = "realm-of-tasks-browser-v1"; // the whole realm, kept in this browser
const LOCAL_KEY   = "realm-of-tasks-browser-local-v1"; // who is playing + theme

// ═══════════════════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

export type Action =
  // Household members (browser edition: no accounts, just names on this device)
  | { type: "LOGOUT" }
  | { type: "SET_CURRENT_USER"; payload: { userId: string | null } }
  | { type: "ADD_MEMBER";    payload: { displayName: string; avatarColor: string; select?: boolean } }
  | { type: "UPDATE_MEMBER"; payload: { userId: string; displayName?: string; avatarColor?: string } }
  | { type: "REMOVE_MEMBER"; payload: { userId: string } }
  | { type: "LOAD_SAMPLE" }
  | { type: "RESET_REALM" }

  // Quests
  | { type: "ADD_QUEST";    payload: { title: string; recurring: boolean; shared: boolean } }
  | { type: "EDIT_QUEST";   payload: { id: string; title: string; shared?: boolean; recurring?: boolean } }
  | { type: "DELETE_QUEST"; payload: { id: string } }
  | { type: "SPIN" }
  | { type: "TOGGLE_QUEST_DONE"; payload: { questId: string } }
  | { type: "COMPLETE_WEEK" }
  | { type: "DISCARD_WEEK" }

  // Daily
  | { type: "ADD_DAILY";    payload: { title: string; shared: boolean; category: "personal" | "chore"; weeklyGoal?: number } }
  | { type: "EDIT_DAILY";   payload: { id: string; title: string; shared?: boolean; category?: "personal" | "chore"; weeklyGoal?: number | null } }
  | { type: "DELETE_DAILY"; payload: { id: string } }
  | { type: "TOGGLE_DAILY"; payload: { taskId: string } }
  | { type: "RESET_DAILY_IF_NEW_DAY" }

  // Main Tasks
  | { type: "ADD_MAIN_TASK";       payload: { title: string; description: string; shared: boolean; id?: string } }
  | { type: "EDIT_MAIN_TASK";      payload: { id: string; title?: string; description?: string; notes?: string } }
  | { type: "TOGGLE_MAIN_DONE";    payload: { id: string } }
  | { type: "DELETE_MAIN_TASK";    payload: { id: string } }
  | { type: "PURGE_COMPLETED_MAIN_TASKS" }
  | { type: "ADD_SUB_QUEST";       payload: { mainTaskId: string; title: string; shared: boolean; recurring: boolean } }
  | { type: "DELETE_SUB_QUEST";    payload: { mainTaskId: string; subQuestId: string } }
  | { type: "TOGGLE_SUB_QUEST_DONE"; payload: { mainTaskId: string; subQuestId: string } }
  | { type: "SEND_SUB_TO_WEEKLY";  payload: { mainTaskId: string; subQuestId: string } }

  // Scoring — monthly rewards ("Wheel of Pleasure")
  | { type: "CLOSE_MONTH" }
  | { type: "SPIN_PLEASURE_WHEEL" }
  | { type: "ADD_PLEASURE_REWARD";    payload: { title: string } }
  | { type: "DELETE_PLEASURE_REWARD"; payload: { id: string } }

  // UI
  | { type: "SET_THEME";      payload: { theme: "light" | "dark" } }
  | { type: "HYDRATE";        payload: AppState }
  /** Hydrate from the server — preserves local-only fields (currentUserId, theme) */
  | { type: "HYDRATE_REMOTE"; payload: AppState };

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Shared tasks require at least 2 completions (or all users if fewer than 2). */
function sharedThreshold(totalUsers: number): number {
  return Math.min(2, totalUsers);
}

function isQuestFullyDone(questId: string, shared: boolean, doneStatus: Record<string, string[]>, totalUsers: number): boolean {
  const done = doneStatus[questId] ?? [];
  if (!shared) return done.length >= 1;
  return done.length >= sharedThreshold(totalUsers);
}

// ═══════════════════════════════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════════════════════════════

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {

    // ── Hydrate ────────────────────────────────────────────────────────────
    case "HYDRATE": {
      const p = action.payload;
      const def = buildDefaultState();
      return {
        ...def,
        ...p,
        users: p.users ?? [],
        questPool: (p.questPool ?? def.questPool).map((q) => ({ ...q, status: q.status ?? "active" })),
        dailyPool: (p.dailyPool ?? def.dailyPool).map((t) => ({ ...t, category: t.category ?? "personal" })),
        mainTasks: p.mainTasks ?? def.mainTasks,
        weeklyState: (() => {
          const ws = p.weeklyState as WeeklyState & Record<string, unknown>;
          if (!ws) return null;
          // migrate old shape
          if (!ws.questIds) return null;
          return ws as WeeklyState;
        })(),
        dailyState: {
          ...createDailyState(),
          ...p.dailyState,
          completedByUserIds: (() => {
            const raw = p.dailyState?.completedByUserIds ?? {};
            const out: Record<string, string[]> = {};
            for (const [k, v] of Object.entries(raw)) out[k] = Array.isArray(v) ? v : [v as string];
            return out;
          })(),
        },
        completionLog: (p.completionLog ?? []).map((l) => ({ ...l, points: l.points ?? 0 })),
        history: p.history ?? [],
        pleasurePool: p.pleasurePool ?? [],
        monthlyRewards: p.monthlyRewards ?? [],
      };
    }

    // ── Hydrate from remote (preserves local-only fields) ─────────────────
    case "HYDRATE_REMOTE": {
      const p = action.payload;
      const def = buildDefaultState();
      return {
        ...def,
        ...p,
        users: p.users ?? [],
        questPool: (p.questPool ?? def.questPool).map((q) => ({ ...q, status: q.status ?? "active" })),
        dailyPool: (p.dailyPool ?? def.dailyPool).map((t) => ({ ...t, category: t.category ?? "personal" })),
        mainTasks: p.mainTasks ?? def.mainTasks,
        weeklyState: (() => {
          const ws = p.weeklyState as WeeklyState & Record<string, unknown>;
          if (!ws) return null;
          if (!ws.questIds) return null;
          return ws as WeeklyState;
        })(),
        dailyState: {
          ...createDailyState(),
          ...p.dailyState,
          completedByUserIds: (() => {
            const raw = p.dailyState?.completedByUserIds ?? {};
            const out: Record<string, string[]> = {};
            for (const [k, v] of Object.entries(raw)) out[k] = Array.isArray(v) ? v : [v as string];
            return out;
          })(),
        },
        completionLog: (p.completionLog ?? []).map((l) => ({ ...l, points: l.points ?? 0 })),
        history: p.history ?? [],
        pleasurePool: p.pleasurePool ?? [],
        monthlyRewards: p.monthlyRewards ?? [],
        // Preserve local-only fields from current state
        currentUserId: state.currentUserId,
        theme: state.theme,
      };
    }

    // ── Auth (local session) ───────────────────────────────────────────────
    case "LOGOUT":
      return { ...state, currentUserId: null };

    case "SET_CURRENT_USER":
      return { ...state, currentUserId: action.payload.userId };

    case "ADD_MEMBER": {
      const name = action.payload.displayName.trim();
      if (!name || state.users.some((u) => u.displayName.toLowerCase() === name.toLowerCase())) return state;
      const member = createMember(name, action.payload.avatarColor, state.users.length === 0);
      return { ...state, users: [...state.users, member], currentUserId: action.payload.select ? member.id : state.currentUserId };
    }
    case "UPDATE_MEMBER":
      return {
        ...state,
        users: state.users.map((u) => u.id !== action.payload.userId ? u : {
          ...u,
          displayName: action.payload.displayName?.trim() || u.displayName,
          avatarColor: action.payload.avatarColor ?? u.avatarColor,
        }),
      };
    case "REMOVE_MEMBER":
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload.userId),
        currentUserId: state.currentUserId === action.payload.userId ? null : state.currentUserId,
      };
    case "LOAD_SAMPLE":
      return buildSampleRealm(state.theme);
    case "RESET_REALM":
      return { ...buildDefaultState(), theme: state.theme };

    // ── Quests ─────────────────────────────────────────────────────────────
    case "ADD_QUEST": {
      if (isDuplicate(action.payload.title, state.questPool)) return state;
      return { ...state, questPool: [...state.questPool, createQuest(action.payload.title, action.payload.recurring, action.payload.shared)] };
    }
    case "EDIT_QUEST": {
      const { id, title, shared, recurring } = action.payload;
      return {
        ...state,
        questPool: state.questPool.map((q) =>
          q.id !== id ? q : {
            ...q,
            title,
            ...(shared !== undefined ? { shared } : {}),
            ...(recurring !== undefined ? { recurring } : {}),
            updatedAt: new Date().toISOString(),
          }
        ),
      };
    }

    case "DELETE_QUEST":
      return { ...state, questPool: state.questPool.filter((q) => q.id !== action.payload.id) };

    case "SPIN": {
      const available = state.questPool.filter((q) => q.status === "active");
      if (available.length < 1) return state;
      const count = Math.min(4, available.length);
      const chosen = pickUniqueRandom(available, count);

      // Also include any sub-quests that have been sent to weekly board
      const pendingSubQuests = state.mainTasks.flatMap((mt) =>
        mt.subQuests.filter((sq) => sq.weekId === "pending")
      );

      return {
        ...state,
        weeklyState: createWeeklyState([
          ...chosen.map((q) => q.id),
          ...pendingSubQuests.map((sq) => sq.id),
        ]),
        // Mark pending sub-quests with this weekId
        mainTasks: state.mainTasks.map((mt) => ({
          ...mt,
          subQuests: mt.subQuests.map((sq) =>
            sq.weekId === "pending"
              ? { ...sq, weekId: getWeekId() }
              : sq
          ),
        })),
      };
    }

    case "TOGGLE_QUEST_DONE": {
      if (!state.weeklyState) return state;
      const { questId } = action.payload;
      const userId = state.currentUserId ?? "unknown";
      const current = state.weeklyState.doneStatus[questId] ?? [];
      const alreadyDone = current.includes(userId);
      const newUserIds = alreadyDone ? current.filter((id) => id !== userId) : [...current, userId];

      // Find quest title for log
      const quest = state.questPool.find((q) => q.id === questId);
      const subQuest = !quest ? state.mainTasks.flatMap((mt) => mt.subQuests).find((sq) => sq.id === questId) : null;
      const title = quest?.title ?? subQuest?.title ?? questId;
      const points = quest ? (quest.recurring ? POINTS.recurringQuest : POINTS.oneTimeQuest) : POINTS.subtask;

      let newLog = [...state.completionLog];
      if (!alreadyDone) {
        newLog = [{ id: generateId(), taskId: questId, taskTitle: title, taskType: subQuest ? "subQuest" : "quest", completedAt: new Date().toISOString(), completedByUserId: userId, points }, ...newLog];
      } else {
        const idx = newLog.findIndex((l) => l.taskId === questId && l.completedByUserId === userId);
        if (idx !== -1) newLog.splice(idx, 1);
      }

      return {
        ...state,
        completionLog: newLog,
        weeklyState: {
          ...state.weeklyState,
          doneStatus: { ...state.weeklyState.doneStatus, [questId]: newUserIds },
        },
      };
    }

    case "COMPLETE_WEEK": {
      if (!state.weeklyState) return state;
      const ws = state.weeklyState;
      const totalUsers = state.users.length || 1;
      const userId = state.currentUserId;

      // Resolve quest objects for history
      const allQuests = ws.questIds.map((qid) => {
        const q = state.questPool.find((x) => x.id === qid);
        if (q) return { id: q.id, title: q.title, shared: q.shared };
        // sub-quest
        for (const mt of state.mainTasks) {
          const sq = mt.subQuests.find((s) => s.id === qid);
          if (sq) return { id: sq.id, title: sq.title, shared: sq.shared, fromMainTaskId: mt.id, fromMainTaskTitle: mt.title };
        }
        return { id: qid, title: qid, shared: false };
      });

      const entry = createHistoryEntry({ ...ws, weekDone: true }, allQuests, userId);

      // Archive one-time quests that are done; recurring quests stay active
      const doneQuestIds = new Set(
        ws.questIds.filter((qid) =>
          isQuestFullyDone(qid, state.questPool.find((q) => q.id === qid)?.shared ?? false, ws.doneStatus, totalUsers)
        )
      );

      const updatedQuestPool = state.questPool.map((q) => {
        if (!doneQuestIds.has(q.id)) return q;
        return q.recurring ? q : { ...q, status: "archived" as const };
      });

      // Mark completed sub-quests
      const updatedMainTasks = state.mainTasks.map((mt) => ({
        ...mt,
        subQuests: mt.subQuests.map((sq) => {
          if (!doneQuestIds.has(sq.id)) return sq;
          const nowDone = { ...sq, completedAt: new Date().toISOString(), completedByUserIds: ws.doneStatus[sq.id] ?? [] };
          return sq.recurring ? { ...nowDone, weekId: null, completedAt: null, completedByUserIds: [] } : nowDone;
        }),
      }));

      // NOTE: completionLog is intentionally left untouched here. Each contributing
      // user's completion was already logged (correctly attributed, with points)
      // by TOGGLE_QUEST_DONE the moment they toggled it — this used to also bulk-append
      // a second, duplicate entry attributed to whoever clicked "Complete Week"
      // (not necessarily who did the task), which double-counted points.
      return {
        ...state,
        questPool: updatedQuestPool,
        mainTasks: updatedMainTasks,
        weeklyState: { ...ws, weekDone: true, completedByUserId: userId },
        history: [entry, ...state.history],
      };
    }

    case "DISCARD_WEEK":
      if (!state.weeklyState) return state;
      // Clear pending sub-quest weekIds
      return {
        ...state,
        weeklyState: null,
        mainTasks: state.mainTasks.map((mt) => ({
          ...mt,
          subQuests: mt.subQuests.map((sq) =>
            sq.weekId && sq.weekId !== null && sq.completedAt === null
              ? { ...sq, weekId: null }
              : sq
          ),
        })),
      };

    // ── Daily ──────────────────────────────────────────────────────────────
    case "ADD_DAILY": {
      const { title, shared, category, weeklyGoal } = action.payload;
      if (isDuplicate(title, state.dailyPool)) return state;
      return { ...state, dailyPool: [...state.dailyPool, createDailyTask(title, shared, category, weeklyGoal)] };
    }
    case "EDIT_DAILY": {
      const { id, title, shared, category, weeklyGoal } = action.payload;
      return {
        ...state,
        dailyPool: state.dailyPool.map((t) =>
          t.id !== id ? t : {
            ...t,
            title,
            ...(shared !== undefined ? { shared } : {}),
            ...(category !== undefined ? { category } : {}),
            ...(weeklyGoal !== undefined ? { weeklyGoal: weeklyGoal ?? undefined } : {}),
            updatedAt: new Date().toISOString(),
          }
        ),
      };
    }

    case "DELETE_DAILY":
      return { ...state, dailyPool: state.dailyPool.filter((t) => t.id !== action.payload.id) };

    case "TOGGLE_DAILY": {
      const { taskId } = action.payload;
      const userId = state.currentUserId ?? "unknown";
      const current = state.dailyState.completedByUserIds[taskId] ?? [];
      const alreadyDone = current.includes(userId);
      const newUserIds = alreadyDone ? current.filter((id) => id !== userId) : [...current, userId];

      const task = state.dailyPool.find((t) => t.id === taskId);
      const weekId = getWeekId();
      const bonusTaskId = `${taskId}:bonus:${weekId}`;
      const points = task?.category === "chore" ? POINTS.dailyChore : POINTS.dailyPersonal;

      let newLog = [...state.completionLog];
      if (!alreadyDone) {
        newLog = [{ id: generateId(), taskId, taskTitle: task?.title ?? taskId, taskType: "daily", completedAt: new Date().toISOString(), completedByUserId: userId, points }, ...newLog];

        // Weekly frequency goal — award a one-time bonus the moment this completion hits the target
        if (task?.weeklyGoal) {
          const weekCount = newLog.filter((l) => l.taskType === "daily" && l.taskId === taskId && l.completedByUserId === userId && getWeekId(new Date(l.completedAt)) === weekId).length;
          if (weekCount === task.weeklyGoal) {
            newLog = [{ id: generateId(), taskId: bonusTaskId, taskTitle: `${task.title} — weekly goal!`, taskType: "daily", completedAt: new Date().toISOString(), completedByUserId: userId, points: POINTS.weeklyGoalBonus }, ...newLog];
          }
        }
      } else {
        const idx = newLog.findIndex((l) => l.taskId === taskId && l.taskType === "daily" && l.completedByUserId === userId);
        if (idx !== -1) newLog.splice(idx, 1);

        // If this completion was what earned the weekly bonus, claw it back too
        if (task?.weeklyGoal) {
          const weekCount = newLog.filter((l) => l.taskType === "daily" && l.taskId === taskId && l.completedByUserId === userId && getWeekId(new Date(l.completedAt)) === weekId).length;
          if (weekCount < task.weeklyGoal) {
            const bonusIdx = newLog.findIndex((l) => l.taskId === bonusTaskId && l.completedByUserId === userId);
            if (bonusIdx !== -1) newLog.splice(bonusIdx, 1);
          }
        }
      }

      return {
        ...state,
        completionLog: newLog,
        dailyState: {
          ...state.dailyState,
          completedByUserIds: { ...state.dailyState.completedByUserIds, [taskId]: newUserIds },
        },
      };
    }

    case "RESET_DAILY_IF_NEW_DAY": {
      if (state.dailyState.date !== todayString()) return { ...state, dailyState: createDailyState() };
      return state;
    }

    // ── Main Tasks ─────────────────────────────────────────────────────────
    case "ADD_MAIN_TASK": {
      const { title, description, shared, id } = action.payload;
      if (isDuplicate(title, state.mainTasks)) return state;
      return { ...state, mainTasks: [createMainTask(title, description, shared, id), ...state.mainTasks] };
    }

    case "EDIT_MAIN_TASK":
      return {
        ...state,
        mainTasks: state.mainTasks.map((mt) =>
          mt.id !== action.payload.id ? mt : {
            ...mt,
            title: action.payload.title ?? mt.title,
            description: action.payload.description ?? mt.description,
            notes: action.payload.notes ?? mt.notes,
            updatedAt: new Date().toISOString(),
          }
        ),
      };

    case "TOGGLE_MAIN_DONE": {
      const userId = state.currentUserId ?? "unknown";
      const mainTask = state.mainTasks.find((mt) => mt.id === action.payload.id);
      if (!mainTask) return state;
      const nowDone = !mainTask.completedAt;

      let newLog = [...state.completionLog];
      if (nowDone) {
        newLog = [{ id: generateId(), taskId: mainTask.id, taskTitle: mainTask.title, taskType: "mainTask", completedAt: new Date().toISOString(), completedByUserId: userId, points: POINTS.mainTaskBonus }, ...newLog];
      } else {
        const idx = newLog.findIndex((l) => l.taskId === mainTask.id && l.taskType === "mainTask");
        if (idx !== -1) newLog.splice(idx, 1);
      }

      return {
        ...state,
        completionLog: newLog,
        mainTasks: state.mainTasks.map((mt) => {
          if (mt.id !== action.payload.id) return mt;
          return { ...mt, completedAt: nowDone ? new Date().toISOString() : null, completedByUserId: nowDone ? userId : null, updatedAt: new Date().toISOString() };
        }),
      };
    }

    case "DELETE_MAIN_TASK":
      return { ...state, mainTasks: state.mainTasks.filter((mt) => mt.id !== action.payload.id) };

    case "PURGE_COMPLETED_MAIN_TASKS":
      return { ...state, mainTasks: state.mainTasks.filter((mt) => !mt.completedAt) };

    case "ADD_SUB_QUEST": {
      const { mainTaskId, title, shared, recurring } = action.payload;
      return {
        ...state,
        mainTasks: state.mainTasks.map((mt) =>
          mt.id !== mainTaskId ? mt : { ...mt, subQuests: [...mt.subQuests, createSubQuest(title, shared, recurring)] }
        ),
      };
    }

    case "DELETE_SUB_QUEST":
      return {
        ...state,
        mainTasks: state.mainTasks.map((mt) =>
          mt.id !== action.payload.mainTaskId ? mt : { ...mt, subQuests: mt.subQuests.filter((sq) => sq.id !== action.payload.subQuestId) }
        ),
      };

    case "TOGGLE_SUB_QUEST_DONE": {
      const userId = state.currentUserId ?? "unknown";
      const { mainTaskId, subQuestId } = action.payload;
      const subQuest = state.mainTasks.find((mt) => mt.id === mainTaskId)?.subQuests.find((sq) => sq.id === subQuestId);
      if (!subQuest) return state;
      const alreadyDone = subQuest.completedByUserIds.includes(userId);

      let newLog = [...state.completionLog];
      if (!alreadyDone) {
        newLog = [{ id: generateId(), taskId: subQuestId, taskTitle: subQuest.title, taskType: "subQuest", completedAt: new Date().toISOString(), completedByUserId: userId, points: POINTS.subtask }, ...newLog];
      } else {
        const idx = newLog.findIndex((l) => l.taskId === subQuestId && l.taskType === "subQuest" && l.completedByUserId === userId);
        if (idx !== -1) newLog.splice(idx, 1);
      }

      return {
        ...state,
        completionLog: newLog,
        mainTasks: state.mainTasks.map((mt) => {
          if (mt.id !== mainTaskId) return mt;
          return {
            ...mt,
            subQuests: mt.subQuests.map((sq) => {
              if (sq.id !== subQuestId) return sq;
              const newIds = alreadyDone ? sq.completedByUserIds.filter((id) => id !== userId) : [...sq.completedByUserIds, userId];
              const allDone = newIds.length > 0;
              return { ...sq, completedByUserIds: newIds, completedAt: allDone ? new Date().toISOString() : null };
            }),
          };
        }),
      };
    }

    case "SEND_SUB_TO_WEEKLY": {
      return {
        ...state,
        mainTasks: state.mainTasks.map((mt) =>
          mt.id !== action.payload.mainTaskId ? mt : {
            ...mt,
            subQuests: mt.subQuests.map((sq) =>
              sq.id !== action.payload.subQuestId ? sq : { ...sq, weekId: "pending" }
            ),
          }
        ),
      };
    }

    // ── Scoring — monthly rewards ────────────────────────────────────────────
    case "CLOSE_MONTH": {
      const monthId = getMonthId();
      if (state.monthlyRewards.some((r) => r.monthId === monthId)) return state; // already closed

      const totals: Record<string, number> = {};
      for (const log of state.completionLog) {
        if (getMonthId(new Date(log.completedAt)) !== monthId) continue;
        totals[log.completedByUserId] = (totals[log.completedByUserId] ?? 0) + log.points;
      }
      const maxPoints = Math.max(0, ...Object.values(totals));
      const wonByUserId = maxPoints > 0 ? Object.entries(totals).filter(([, pts]) => pts === maxPoints).map(([uid]) => uid) : [];

      const reward: MonthlyReward = {
        id: generateId(), monthId, wonByUserId, closedAt: new Date().toISOString(),
        prizeId: null, prizeTitle: null, claimedAt: null,
      };
      return { ...state, monthlyRewards: [reward, ...state.monthlyRewards] };
    }

    case "SPIN_PLEASURE_WHEEL": {
      if (state.pleasurePool.length === 0) return state;
      const latest = state.monthlyRewards[0];
      const userId = state.currentUserId;
      if (!latest || !userId || latest.claimedAt || !latest.wonByUserId.includes(userId)) return state;
      const [prize] = pickUniqueRandom(state.pleasurePool, 1);
      return {
        ...state,
        monthlyRewards: state.monthlyRewards.map((r) =>
          r.id !== latest.id ? r : { ...r, prizeId: prize.id, prizeTitle: prize.title, claimedAt: new Date().toISOString() }
        ),
      };
    }

    case "ADD_PLEASURE_REWARD": {
      if (isDuplicate(action.payload.title, state.pleasurePool)) return state;
      return { ...state, pleasurePool: [...state.pleasurePool, createPleasureReward(action.payload.title)] };
    }

    case "DELETE_PLEASURE_REWARD":
      return { ...state, pleasurePool: state.pleasurePool.filter((r) => r.id !== action.payload.id) };

    case "SET_THEME":
      return { ...state, theme: action.payload.theme };

    default:
      return state;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT + PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface StoreCtx { state: AppState; dispatch: React.Dispatch<Action>; loaded: boolean }
const StoreContext = createContext<StoreCtx | null>(null);

/** Read the saved realm synchronously so the board appears without a flash. */
function buildInitialState(): import("./types").AppState {
  const base = buildDefaultState();
  if (typeof window === "undefined") return base;

  // Apply cached local-only fields (currentUserId, theme)
  let localCurrentUserId: string | null = null;
  let localTheme: "light" | "dark" = "dark";
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      localCurrentUserId = parsed.currentUserId ?? null;
      localTheme = parsed.theme ?? "dark";
    }
  } catch { /* corrupted */ }

  // The saved realm (members, tasks, history, ...)
  try {
    const shared = localStorage.getItem(STORAGE_KEY);
    if (shared) {
      const parsed = JSON.parse(shared);
      return {
        ...base,
        ...parsed,
        currentUserId: localCurrentUserId,
        theme: localTheme,
      };
    }
  } catch { /* corrupted */ }

  return { ...base, currentUserId: localCurrentUserId, theme: localTheme };
}

const noopSubscribe = () => () => {};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as import("./types").AppState, buildInitialState);
  // False while rendering on the server / hydrating, true once running in the browser
  // (where buildInitialState has already read the saved realm from localStorage).
  const loaded = React.useSyncExternalStore(noopSubscribe, () => true, () => false);

  // ── Save the realm to this browser on every change ─────────────────────────
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ currentUserId: state.currentUserId, theme: state.theme }));
      const { currentUserId: _uid, theme: _theme, ...realm } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(realm));
    } catch { /* private mode or storage full: the realm still works for this visit */ }
  }, [state, loaded]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme]);

  useEffect(() => {
    dispatch({ type: "RESET_DAILY_IF_NEW_DAY" });
    const t = setInterval(() => dispatch({ type: "RESET_DAILY_IF_NEW_DAY" }), 60_000);
    return () => clearInterval(t);
  }, []);

  return React.createElement(StoreContext.Provider, { value: { state, dispatch, loaded } }, children);
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useCurrentUser() {
  const { state } = useStore();
  return state.users.find((u) => u.id === state.currentUserId) ?? null;
}

export function useWeeklyQuests() {
  const { state } = useStore();
  if (!state.weeklyState) return [];
  return state.weeklyState.questIds.map((qid) => {
    const q = state.questPool.find((x) => x.id === qid);
    if (q) return { ...q, type: "quest" as const, fromMainTaskId: undefined, fromMainTaskTitle: undefined };
    for (const mt of state.mainTasks) {
      const sq = mt.subQuests.find((s) => s.id === qid);
      if (sq) return { ...sq, type: "subQuest" as const, status: "active" as const, fromMainTaskId: mt.id, fromMainTaskTitle: mt.title };
    }
    return null;
  }).filter(Boolean) as Array<(Quest | SubQuest) & { type: "quest" | "subQuest"; status: "active" | "archived"; fromMainTaskId?: string; fromMainTaskTitle?: string }>;
}

export function useCanSpin() {
  const { state } = useStore();
  return state.questPool.filter((q) => q.status === "active").length >= 1;
}

export function useTaskCompletionCounts() {
  const { state } = useStore();
  const counts: Record<string, number> = {};
  for (const log of state.completionLog) {
    counts[log.taskId] = (counts[log.taskId] ?? 0) + 1;
  }
  return counts;
}

export function useIsDuplicate() {
  const { state } = useStore();
  return useCallback(
    (title: string, type: "quest" | "daily" | "mainTask") => {
      if (type === "quest") return isDuplicate(title, state.questPool);
      if (type === "daily") return isDuplicate(title, state.dailyPool);
      return isDuplicate(title, state.mainTasks);
    },
    [state.questPool, state.dailyPool, state.mainTasks]
  );
}

// ── Scoring ───────────────────────────────────────────────────────────────

/** Live per-user point totals for the current (not-yet-closed) month. */
export function useMonthlyPoints() {
  const { state } = useStore();
  const monthId = getMonthId();
  const totals: Record<string, number> = {};
  for (const log of state.completionLog) {
    if (getMonthId(new Date(log.completedAt)) !== monthId) continue;
    totals[log.completedByUserId] = (totals[log.completedByUserId] ?? 0) + log.points;
  }
  return state.users
    .map((user) => ({ user, points: totals[user.id] ?? 0 }))
    .sort((a, b) => b.points - a.points);
}

export function useLatestMonthlyReward() {
  const { state } = useStore();
  return state.monthlyRewards[0] ?? null;
}

export function useCanCloseMonth() {
  const { state } = useStore();
  const monthId = getMonthId();
  return !state.monthlyRewards.some((r) => r.monthId === monthId);
}

export function useCanSpinPleasureWheel() {
  const { state } = useStore();
  const latest = state.monthlyRewards[0];
  if (!latest || latest.claimedAt || state.pleasurePool.length === 0) return false;
  return !!state.currentUserId && latest.wonByUserId.includes(state.currentUserId);
}
