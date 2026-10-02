"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "./UserAvatar";
import { useStore, useTaskCompletionCounts } from "@/lib/store";
import { formatDate, formatWeekRange } from "@/lib/utils";

type DateFilter = "all" | "last30" | "last90";

export function HistoryView() {
  const { state } = useStore();
  const counts = useTaskCompletionCounts();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [showStats, setShowStats] = useState(true);

  function getUserById(id: string | null) {
    if (!id) return undefined;
    return state.users.find((u) => u.id === id);
  }

  const cutoff = useMemo(() => {
    const now = new Date();
    if (dateFilter === "last30") { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
    if (dateFilter === "last90") { const d = new Date(now); d.setDate(d.getDate() - 90); return d; }
    return null;
  }, [dateFilter]);

  const filtered = state.history.filter((e) => !cutoff || new Date(e.completedAt) >= cutoff);

  // Top tasks
  const topTasks = useMemo(() => {
    return Object.entries(counts)
      .map(([id, count]) => {
        const log = state.completionLog.find((l) => l.taskId === id);
        return { id, title: log?.taskTitle ?? id, count, type: log?.taskType ?? "quest" };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [counts, state.completionLog]);

  // Per-user counts
  const userCounts = state.users.map((u) => ({
    user: u,
    count: state.completionLog.filter((l) => l.completedByUserId === u.id).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
            📜 The Annals
          </h2>
          <p className="text-xs italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            {state.completionLog.length} deed{state.completionLog.length !== 1 ? "s" : ""} recorded for eternity
          </p>
        </div>
        <button onClick={() => setShowStats(!showStats)} className="text-[0.65rem] border px-2 py-1 rounded-sm transition-colors"
          style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
          {showStats ? "Hide stats" : "Stats"}
        </button>
      </div>

      {/* Stats */}
      {showStats && (topTasks.length > 0 || userCounts.some((u) => u.count > 0)) && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {topTasks.length > 0 && (
            <Card>
              <h3 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>🏆 Most Completed</h3>
              <ol className="flex flex-col gap-2">
                {topTasks.map((t, i) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <span className="w-5 text-center" style={{ color: "var(--reseda-readable)" }}>{["🥇","🥈","🥉","4.","5."][i]}</span>
                    <span className="flex-1 truncate" style={{ fontFamily: "var(--font-body)", color: "var(--color-text)" }}>{t.title}</span>
                    <span className="text-[0.65rem] px-2 py-0.5 border rounded-sm" style={{ fontFamily: "var(--font-display)", borderColor: "var(--reseda-dark)", color: "var(--reseda-readable)", background: "rgba(130,140,106,0.1)" }}>{t.count}×</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
          {userCounts.some((u) => u.count > 0) && (
            <Card>
              <h3 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>👥 Household</h3>
              {userCounts.map(({ user, count }) => {
                const pct = userCounts[0].count > 0 ? (count / userCounts[0].count) * 100 : 0;
                return (
                  <div key={user.id} className="flex items-center gap-2 mb-2">
                    <UserAvatar displayName={user.displayName} avatarColor={user.avatarColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[0.65rem] mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
                        <span style={{ color: "var(--color-text)" }}>{user.displayName}</span>
                        <span style={{ color: "var(--color-text-muted)" }}>{count}</span>
                      </div>
                      <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
                        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: user.avatarColor }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}

      {/* Date filter */}
      <div className="flex gap-1.5" role="group" aria-label="Date filter">
        {(["all","last30","last90"] as DateFilter[]).map((f) => (
          <button key={f} onClick={() => setDateFilter(f)} aria-pressed={dateFilter === f}
            className="px-3 py-1 rounded-sm text-[0.65rem] font-semibold border transition-all uppercase tracking-wider"
            style={{ fontFamily: "var(--font-display)", background: dateFilter === f ? "linear-gradient(180deg,var(--reseda),var(--reseda-dark))" : "transparent", borderColor: dateFilter === f ? "var(--reseda-readable)" : "var(--color-border)", color: dateFilter === f ? "var(--blush)" : "var(--color-text-muted)" }}>
            {f === "all" ? "All time" : f === "last30" ? "30 days" : "90 days"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="text-4xl">📜</div>
          <p className="text-sm italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            {state.history.length === 0 ? "Complete your first week to inscribe in the annals." : "No entries match this filter."}
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((entry, i) => {
            const completedBy = getUserById(entry.completedByUserId);
            const doneCount = entry.quests.filter((q) => q.doneByUserIds.length > 0).length;
            return (
              <li key={entry.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <Card>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="done">✦ Week Done</Badge>
                          <span className="text-[0.65rem]" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
                            Week {entry.weekId.split("-W")[1]} · {formatWeekRange(entry.weekStartDate, entry.weekEndDate)}
                          </span>
                        </div>
                        <p className="text-[0.65rem]" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
                          {doneCount}/{entry.quests.length} quests completed
                        </p>
                        {completedBy && (
                          <div className="flex items-center gap-1.5">
                            <UserAvatar displayName={completedBy.displayName} avatarColor={completedBy.avatarColor} size="xs" />
                            <span className="text-xs italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>{completedBy.displayName}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs shrink-0 italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>{formatDate(entry.completedAt)}</span>
                    </div>

                    <ul className="flex flex-col gap-1">
                      {entry.quests.map((q) => {
                        const qCount = counts[q.id] ?? 0;
                        const done = q.doneByUserIds.length > 0;
                        return (
                          <li key={q.id} className="flex items-center gap-2 text-sm">
                            <span className="w-4 h-4 shrink-0 rounded-sm border flex items-center justify-center text-[0.6rem]"
                              style={{ background: done ? "var(--tea-dark)" : "transparent", borderColor: done ? "var(--tea-rose)" : "var(--color-border)", color: done ? "var(--blush)" : "" }}>
                              {done ? "✓" : ""}
                            </span>
                            <span style={{ fontFamily: "var(--font-body)", color: done ? "var(--color-done-text)" : "var(--color-text-muted)" }}>{q.title}</span>
                            {("fromMainTaskTitle" in q) && q.fromMainTaskTitle && (
                              <span className="text-[0.55rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--tea-rose)" }}>✦ {q.fromMainTaskTitle}</span>
                            )}
                            {qCount > 1 && (
                              <span className="text-[0.6rem] px-1.5 border rounded-sm ml-auto shrink-0" style={{ fontFamily: "var(--font-display)", borderColor: "var(--reseda-dark)", color: "var(--reseda-readable)", background: "rgba(130,140,106,0.08)" }}>🔁 {qCount}×</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
