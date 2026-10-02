"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { UserAvatar } from "./UserAvatar";
import { useStore } from "@/lib/store";
import { POINTS } from "@/lib/utils";
import type { DailyTask } from "@/lib/types";

// ── Inline edit modal ──────────────────────────────────────────────────────

function EditDailyModal({ open, onClose, task }: { open: boolean; onClose: () => void; task: DailyTask }) {
  const { dispatch } = useStore();
  const [title, setTitle] = useState(task.title);
  const [shared, setShared] = useState(task.shared);
  const [category, setCategory] = useState<"personal" | "chore">(task.category);
  const [weeklyGoal, setWeeklyGoal] = useState(task.weeklyGoal ? String(task.weeklyGoal) : "");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (open) {
      setTitle(task.title); setShared(task.shared); setCategory(task.category);
      setWeeklyGoal(task.weeklyGoal ? String(task.weeklyGoal) : ""); setError("");
    }
  }, [open, task]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Name required."); return; }
    const goal = Number(weeklyGoal);
    dispatch({ type: "EDIT_DAILY", payload: { id: task.id, title: title.trim(), shared, category, weeklyGoal: goal > 0 ? goal : null } });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Daily Deed" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Name" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} error={error} autoFocus />

        <div className="flex flex-col gap-1">
          <label className="text-[0.65rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>Type</label>
          <div className="grid grid-cols-2 gap-2">
            {([{ val: false, icon: "🗡️", label: "Solo" }, { val: true, icon: "⚔️", label: "Group" }] as const).map(({ val, icon, label }) => (
              <button key={String(val)} type="button" onClick={() => setShared(val)}
                className="flex flex-col items-center gap-1 py-2 border rounded-sm transition-all"
                style={{ background: shared === val ? "linear-gradient(180deg,#1e2219,#161a12)" : "rgba(0,0,0,0.3)", borderColor: shared === val ? (val ? "var(--tea-rose)" : "var(--reseda-readable)") : "var(--color-border-gold)" }}>
                <span className="text-base">{icon}</span>
                <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: shared === val ? (val ? "var(--tea-rose)" : "var(--reseda-readable)") : "var(--color-text-muted)" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[0.65rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>Category</label>
          <div className="grid grid-cols-2 gap-2">
            {([{ val: "personal" as const, icon: "🧘", label: "Personal" }, { val: "chore" as const, icon: "🧹", label: "Chore" }]).map(({ val, icon, label }) => (
              <button key={val} type="button" onClick={() => setCategory(val)}
                className="flex flex-col items-center gap-1 py-2 border rounded-sm transition-all"
                style={{ background: category === val ? "linear-gradient(180deg,#1e2219,#161a12)" : "rgba(0,0,0,0.3)", borderColor: category === val ? "var(--reseda-readable)" : "var(--color-border-gold)" }}>
                <span className="text-base">{icon}</span>
                <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: category === val ? "var(--reseda-readable)" : "var(--color-text-muted)" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Input label="Weekly goal (optional)" type="number" min={1} max={14} placeholder="e.g. 5 times a week for a bonus"
          value={weeklyGoal} onChange={(e) => setWeeklyGoal(e.target.value)}
          hint="Hit this many completions in a week for a +5 point bonus" />

        <div className="flex gap-2 justify-end pt-1" style={{ borderTop: "1px solid var(--color-border)" }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Daily task row ─────────────────────────────────────────────────────────

function DailyTaskRow({ task, index, doneByIds, currentUserDone, isFullyDone, onToggle }: {
  task: DailyTask;
  index: number;
  doneByIds: string[];
  currentUserDone: boolean;
  isFullyDone: boolean;
  onToggle: () => void;
}) {
  const { state, dispatch } = useStore();
  const users = state.users;
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <li className="animate-slide-in" style={{ animationDelay: `${index * 40}ms` }}>
      <div
        className="flex items-center gap-3 px-4 py-3 border text-sm transition-all rounded-sm"
        style={{
          background: isFullyDone ? "linear-gradient(135deg,#1a1416,#140f12)" : currentUserDone ? "linear-gradient(135deg,#161a12,#121610)" : "linear-gradient(135deg,#1a1e16,#161a12)",
          borderColor: isFullyDone ? "var(--tea-rose)" : currentUserDone ? "var(--reseda)" : "var(--color-border)",
        }}
      >
        {/* Toggle checkbox */}
        <button
          onClick={onToggle}
          role="checkbox"
          aria-checked={currentUserDone}
          className="w-7 h-7 shrink-0 rounded-sm flex items-center justify-center text-xs font-bold border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--reseda-readable)] cursor-pointer"
          style={{
            fontFamily: "var(--font-display)",
            background: isFullyDone ? "var(--tea-dark)" : currentUserDone ? "var(--reseda-dark)" : "rgba(130,140,106,0.12)",
            borderColor: isFullyDone ? "var(--tea-rose)" : "var(--reseda-dark)",
            color: isFullyDone ? "var(--blush)" : currentUserDone ? "var(--blush)" : "var(--reseda-readable)",
          }}>
          {isFullyDone ? "✓" : currentUserDone ? "½" : index + 1}
        </button>

        {/* Title */}
        <span className="flex-1 flex flex-col gap-0.5" style={{
          fontFamily: "var(--font-body)",
          color: isFullyDone ? "var(--color-done-text)" : "var(--color-text)",
          textDecoration: isFullyDone ? "line-through" : "none",
          opacity: isFullyDone ? 0.7 : 1,
        }}>
          {task.title}
          <span className="flex items-center gap-2 flex-wrap" style={{ textDecoration: "none", opacity: 1 }}>
            {task.shared && (
              <span className="text-[0.55rem] tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--sage)" }}>
                ⚔ Group Task
              </span>
            )}
            <span className="text-[0.55rem] tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
              +{task.category === "chore" ? POINTS.dailyChore : POINTS.dailyPersonal} pt
            </span>
            {task.weeklyGoal && (
              <span className="text-[0.55rem] tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
                🎯 {task.weeklyGoal}×/wk +{POINTS.weeklyGoalBonus}
              </span>
            )}
          </span>
        </span>

        {/* Completion avatars */}
        {task.shared && users.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {users.map((u) => (
              <span key={u.id} className={["transition-all", doneByIds.includes(u.id) ? "opacity-100" : "opacity-25 grayscale"].join(" ")}
                title={doneByIds.includes(u.id) ? `${u.displayName} ✓` : `${u.displayName} – not yet`}>
                <UserAvatar displayName={u.displayName} avatarColor={u.avatarColor} size="xs" />
              </span>
            ))}
          </div>
        )}
        {!task.shared && doneByIds.length > 0 && (() => {
          const completedBy = users.find((u) => u.id === doneByIds[0]);
          return completedBy ? (
            <div className="flex items-center gap-1 shrink-0" title={`Done by ${completedBy.displayName}`}>
              <UserAvatar displayName={completedBy.displayName} avatarColor={completedBy.avatarColor} size="xs" />
            </div>
          ) : <span className="text-[0.6rem] tracking-widest uppercase shrink-0" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>done</span>;
        })()}
        {!task.shared && doneByIds.length === 0 && (
          <span className="text-[0.6rem] tracking-widest uppercase shrink-0" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>solo</span>
        )}

        {/* Edit + Delete */}
        <button
          onClick={() => setEditOpen(true)}
          className="shrink-0 text-xs px-1.5 py-1 border rounded-sm transition-all"
          style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "rgba(0,0,0,0.2)" }}
          aria-label="Edit daily deed"
          title="Edit">
          ✎
        </button>
        <button
          onClick={() => { if (confirmDelete) { dispatch({ type: "DELETE_DAILY", payload: { id: task.id } }); } else setConfirmDelete(true); }}
          onBlur={() => setConfirmDelete(false)}
          className="shrink-0 text-xs px-1.5 py-1 border rounded-sm transition-all"
          style={{ fontFamily: "var(--font-display)", borderColor: confirmDelete ? "var(--coral)" : "var(--color-border)", color: confirmDelete ? "var(--coral)" : "var(--color-text-muted)", background: confirmDelete ? "rgba(230,155,151,0.1)" : "rgba(0,0,0,0.2)" }}
          aria-label="Delete daily deed">
          {confirmDelete ? "Sure?" : "✕"}
        </button>
      </div>

      {task.shared && currentUserDone && !isFullyDone && users.length > 1 && (
        <p className="text-xs pl-14 mt-0.5 italic" style={{ color: "var(--reseda)", fontFamily: "var(--font-body)" }}>
          Your deed is recorded — awaiting {users.filter((u) => !doneByIds.includes(u.id)).map((u) => u.displayName).join(" & ")}
        </p>
      )}

      <EditDailyModal open={editOpen} onClose={() => setEditOpen(false)} task={task} />
    </li>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

interface DailyTasksViewProps {
  onAddTask: () => void;
}

export function DailyTasksView({ onAddTask }: DailyTasksViewProps) {
  const { state, dispatch } = useStore();
  const tasks = state.dailyPool.filter((t) => t.active);
  const users = state.users;
  const currentUserId = state.currentUserId ?? "unknown";
  const totalUsers = users.length || 1;

  function toggle(taskId: string) {
    dispatch({ type: "TOGGLE_DAILY", payload: { taskId } });
  }

  function getStatus(taskId: string, shared: boolean) {
    const done: string[] = state.dailyState.completedByUserIds[taskId] ?? [];
    const currentUserDone = done.includes(currentUserId);
    const isFullyDone = shared
      ? done.length >= Math.min(2, totalUsers)
      : done.length >= 1;
    return { done, currentUserDone, isFullyDone };
  }

  const fullyDoneCount = tasks.filter((t) => getStatus(t.id, t.shared).isFullyDone).length;
  const progress = tasks.length > 0 ? (fullyDoneCount / tasks.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
            🕯 Daily Deeds
          </h2>
          <p className="text-xs italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            Resets at dawn · Fixed order
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={<span aria-hidden>+</span>} onClick={onAddTask}>Add</Button>
      </div>

      {tasks.length > 0 && (
        <div>
          <div className="flex justify-between text-[0.65rem] mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            <span className="uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Today</span>
            <span style={{ color: "var(--reseda-readable)" }}>{fullyDoneCount}/{tasks.length}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-sm" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--color-border)" }}
            role="progressbar" aria-valuenow={fullyDoneCount} aria-valuemin={0} aria-valuemax={tasks.length}>
            <div className="h-full transition-all duration-500" style={{
              width: `${progress}%`,
              background: progress === 100 ? "linear-gradient(90deg,var(--tea-rose),var(--tea-dark))" : "linear-gradient(90deg,var(--reseda),var(--sage))",
            }} />
          </div>
          {progress === 100 && (
            <p className="text-xs font-semibold mt-1" style={{ color: "var(--tea-rose)", fontFamily: "var(--font-display)" }}>
              ✦ All daily deeds done for today!
            </p>
          )}
        </div>
      )}

      {tasks.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            No daily deeds inscribed yet.
          </p>
          <Button variant="primary" onClick={onAddTask} icon={<span aria-hidden>+</span>}>Add Daily Deed</Button>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Daily deeds">
          {tasks.map((task, index) => {
            const { done: doneByIds, currentUserDone, isFullyDone } = getStatus(task.id, task.shared);
            return (
              <DailyTaskRow
                key={task.id}
                task={task}
                index={index}
                doneByIds={doneByIds}
                currentUserDone={currentUserDone}
                isFullyDone={isFullyDone}
                onToggle={() => toggle(task.id)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
