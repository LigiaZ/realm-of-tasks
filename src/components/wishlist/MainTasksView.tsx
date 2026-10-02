"use client";

import { AI_SUGGESTIONS } from "@/lib/edition";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { UserAvatar } from "./UserAvatar";
import { useStore } from "@/lib/store";
import type { MainTask, SubQuest } from "@/lib/types";
import { formatDate, POINTS } from "@/lib/utils";

// ── Sub-quest add form ─────────────────────────────────────────────────────

function AddSubQuestModal({ open, onClose, mainTaskId }: { open: boolean; onClose: () => void; mainTaskId: string }) {
  const { dispatch } = useStore();
  const [title, setTitle] = useState("");
  const [shared, setShared] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState("");

  function handleClose() { setTitle(""); setShared(false); setRecurring(false); setError(""); onClose(); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Name required."); return; }
    dispatch({ type: "ADD_SUB_QUEST", payload: { mainTaskId, title: title.trim(), shared, recurring } });
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Sub-Quest" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Sub-quest name" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="e.g. Research flights" error={error} autoFocus />

        <div className="grid grid-cols-2 gap-2">
          {[{ val: false, icon: "🗡️", label: "Solo" }, { val: true, icon: "⚔️", label: "Group" }].map(({ val, icon, label }) => (
            <button key={String(val)} type="button" onClick={() => setShared(val)}
              className="flex flex-col items-center gap-1 py-2 border rounded-sm transition-all"
              style={{ background: shared === val ? "linear-gradient(180deg,#1e2219,#161a12)" : "rgba(0,0,0,0.3)", borderColor: shared === val ? (val ? "var(--tea-rose)" : "var(--reseda-readable)") : "var(--color-border-gold)" }}>
              <span className="text-base">{icon}</span>
              <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: shared === val ? (val ? "var(--tea-rose)" : "var(--reseda-readable)") : "var(--color-text-muted)" }}>{label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[{ val: false, icon: "💀", label: "Once" }, { val: true, icon: "🔄", label: "Recurring" }].map(({ val, icon, label }) => (
            <button key={String(val)} type="button" onClick={() => setRecurring(val)}
              className="flex flex-col items-center gap-1 py-2 border rounded-sm transition-all"
              style={{ background: recurring === val ? "linear-gradient(180deg,#1e2219,#161a12)" : "rgba(0,0,0,0.3)", borderColor: recurring === val ? "var(--reseda-readable)" : "var(--color-border-gold)" }}>
              <span className="text-base">{icon}</span>
              <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: recurring === val ? "var(--reseda-readable)" : "var(--color-text-muted)" }}>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-end pt-1" style={{ borderTop: "1px solid var(--color-border)" }}>
          <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="primary">Add</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Sub-quest row ──────────────────────────────────────────────────────────

function SubQuestRow({ sq, mainTaskId }: { sq: SubQuest; mainTaskId: string }) {
  const { state, dispatch } = useStore();
  const users = state.users;
  const currentUserId = state.currentUserId ?? "unknown";
  const isDone = !!sq.completedAt;
  const alreadyOnBoard = sq.weekId !== null;
  const currentUserDone = sq.completedByUserIds.includes(currentUserId);

  return (
    <li className="flex items-center gap-2 px-3 py-2.5 border rounded-sm text-sm transition-all"
      style={{
        background: isDone ? "linear-gradient(135deg,#1a1416,#140f12)" : "rgba(0,0,0,0.2)",
        borderColor: isDone ? "var(--tea-rose)" : "var(--color-border)",
      }}>
      <button
        onClick={() => dispatch({ type: "TOGGLE_SUB_QUEST_DONE", payload: { mainTaskId, subQuestId: sq.id } })}
        className="w-6 h-6 shrink-0 rounded-sm flex items-center justify-center text-xs font-bold border transition-all"
        style={{ background: isDone ? "var(--tea-dark)" : "rgba(130,140,106,0.12)", borderColor: isDone ? "var(--tea-rose)" : "var(--reseda-dark)", color: isDone ? "var(--blush)" : "var(--reseda-readable)", fontFamily: "var(--font-display)" }}
        aria-label={isDone ? "Mark undone" : "Mark done"}>{isDone ? "✓" : ""}</button>

      <div className="flex-1 min-w-0">
        <span style={{ fontFamily: "var(--font-body)", color: isDone ? "var(--color-done-text)" : "var(--color-text)", textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.7 : 1 }}>
          {sq.title}
        </span>
        <div className="flex gap-1.5 mt-0.5">
          {sq.shared && <span className="text-[0.5rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--sage)" }}>⚔ group</span>}
          {sq.recurring && <span className="text-[0.5rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>🔄 recurring</span>}
          {alreadyOnBoard && !isDone && <span className="text-[0.5rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--tea-rose)" }}>📋 on board</span>}
          <span className="text-[0.5rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>+{POINTS.subtask} pt</span>
        </div>
      </div>

      {sq.shared && users.length > 0 && (
        <div className="flex gap-0.5 shrink-0">
          {users.map((u) => (
            <span key={u.id} className={sq.completedByUserIds.includes(u.id) ? "opacity-100" : "opacity-25 grayscale"} title={u.displayName}>
              <UserAvatar displayName={u.displayName} avatarColor={u.avatarColor} size="xs" />
            </span>
          ))}
        </div>
      )}
      {!sq.shared && isDone && sq.completedByUserIds[0] && (() => {
        const doneBy = users.find((u) => u.id === sq.completedByUserIds[0]);
        return doneBy ? (
          <div className="shrink-0" title={`Done by ${doneBy.displayName}`}>
            <UserAvatar displayName={doneBy.displayName} avatarColor={doneBy.avatarColor} size="xs" />
          </div>
        ) : null;
      })()}

      {!alreadyOnBoard && !isDone && (
        <button
          onClick={() => dispatch({ type: "SEND_SUB_TO_WEEKLY", payload: { mainTaskId, subQuestId: sq.id } })}
          className="shrink-0 text-[0.6rem] px-2 py-0.5 border rounded-sm transition-all"
          style={{ fontFamily: "var(--font-display)", borderColor: "var(--reseda-dark)", color: "var(--reseda-readable)", background: "rgba(130,140,106,0.1)" }}
          title="Add to this week's quest board">
          + Board
        </button>
      )}

      <button
        onClick={() => dispatch({ type: "DELETE_SUB_QUEST", payload: { mainTaskId, subQuestId: sq.id } })}
        className="shrink-0 text-xs text-[var(--color-text-muted)] hover:text-[var(--coral)] transition-colors"
        aria-label="Delete sub-quest">✕</button>
    </li>
  );
}

// ── Edit main task modal ───────────────────────────────────────────────────

function EditMainTaskModal({ open, onClose, task }: { open: boolean; onClose: () => void; task: MainTask }) {
  const { dispatch } = useStore();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [error, setError] = useState("");

  // Reset fields when task changes or modal opens
  React.useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description);
      setNotes(task.notes ?? "");
      setError("");
    }
  }, [open, task]);

  function handleClose() { setError(""); onClose(); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title required."); return; }
    dispatch({ type: "EDIT_MAIN_TASK", payload: { id: task.id, title: title.trim(), description: description.trim(), notes: notes.trim() } });
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit Main Task" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Title" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="e.g. Plan the trip" error={error} autoFocus />
        <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description or goal" />
        <div className="flex flex-col gap-1">
          <label className="text-[0.65rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any extra notes…"
            className="w-full rounded-sm px-3 py-2 text-sm resize-none"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontFamily: "var(--font-body)", outline: "none" }}
          />
        </div>
        <div className="flex gap-2 justify-end pt-1" style={{ borderTop: "1px solid var(--color-border)" }}>
          <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main task card ─────────────────────────────────────────────────────────

function MainTaskCard({ task }: { task: MainTask }) {
  const { state, dispatch } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [addSubOpen, setAddSubOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const users = state.users;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  const isDone = !!task.completedAt;
  const completedBy = users.find((u) => u.id === task.completedByUserId);
  const doneSubCount = task.subQuests.filter((sq) => !!sq.completedAt).length;

  async function handleSuggestSubtasks() {
    setSuggesting(true);
    setSuggestError("");
    try {
      const res = await fetch("/api/ai/suggest-subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: task.title, description: task.description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get suggestions");
      setSuggestions(data.subtasks ?? []);
      setSelectedSuggestions(new Set(data.subtasks ?? []));
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Failed to get suggestions");
    } finally {
      setSuggesting(false);
    }
  }

  function toggleSuggestion(s: string) {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  function addSelectedSuggestions() {
    for (const s of selectedSuggestions) {
      dispatch({ type: "ADD_SUB_QUEST", payload: { mainTaskId: task.id, title: s, shared: false, recurring: false } });
    }
    setSuggestions([]);
    setSelectedSuggestions(new Set());
  }

  return (
    <Card className={isDone ? "opacity-80" : ""}>
      <div className="flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Complete toggle */}
          <button
            onClick={() => dispatch({ type: "TOGGLE_MAIN_DONE", payload: { id: task.id } })}
            className="mt-0.5 w-7 h-7 shrink-0 rounded-sm border-2 flex items-center justify-center transition-all"
            style={{ borderColor: isDone ? "var(--tea-rose)" : "var(--reseda)", background: isDone ? "var(--tea-dark)" : "transparent", color: isDone ? "var(--blush)" : "transparent" }}
            aria-label={isDone ? "Mark undone" : "Mark complete"}
            aria-checked={isDone} role="checkbox">
            {isDone ? "✓" : ""}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[0.6rem] uppercase tracking-widest px-1.5 py-0.5 border" style={{ fontFamily: "var(--font-display)", borderColor: "var(--reseda-dark)", color: "var(--reseda-readable)", background: "rgba(130,140,106,0.08)" }}>
                🏰 Main Task
              </span>
              {task.shared && <span className="text-[0.6rem] uppercase tracking-widest px-1.5 py-0.5 border" style={{ fontFamily: "var(--font-display)", borderColor: "var(--sage)", color: "var(--sage)" }}>⚔ Group</span>}
              <span className="text-[0.6rem] uppercase tracking-widest px-1.5 py-0.5 border" style={{ fontFamily: "var(--font-display)", borderColor: "var(--reseda-dark)", color: "var(--reseda-readable)" }}>+{POINTS.mainTaskBonus} pt</span>
              {isDone && <Badge variant="done">✦ Achieved</Badge>}
            </div>

            <h3 className="font-semibold" style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", color: isDone ? "var(--color-text-muted)" : "var(--color-text)", textDecoration: isDone ? "line-through" : "none" }}>
              {task.title}
            </h3>

            {task.description && (
              <p className="text-sm italic mt-0.5" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>{task.description}</p>
            )}

            {isDone && completedBy && (
              <div className="flex items-center gap-1.5 mt-1">
                <UserAvatar displayName={completedBy.displayName} avatarColor={completedBy.avatarColor} size="xs" />
                <span className="text-xs italic" style={{ color: "var(--tea-rose)", fontFamily: "var(--font-body)" }}>
                  Achieved by {completedBy.displayName} · {formatDate(task.completedAt!)}
                </span>
              </div>
            )}

            {task.subQuests.length > 0 && (
              <div className="text-[0.65rem] mt-1.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
                Sub-quests: {doneSubCount}/{task.subQuests.length} complete
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs px-2 py-1 border rounded-sm transition-all"
              style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "rgba(0,0,0,0.2)" }}>
              {expanded ? "▲" : "▼"}
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="text-xs px-2 py-1 border rounded-sm transition-all"
              style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "rgba(0,0,0,0.2)" }}
              aria-label="Edit task"
              title="Edit task">
              ✎
            </button>
            <button
              onClick={() => { if (confirmDelete) { dispatch({ type: "DELETE_MAIN_TASK", payload: { id: task.id } }); } else setConfirmDelete(true); }}
              onBlur={() => setConfirmDelete(false)}
              className="text-xs px-2 py-1 border rounded-sm transition-all"
              style={{ fontFamily: "var(--font-display)", borderColor: confirmDelete ? "var(--coral)" : "var(--color-border)", color: confirmDelete ? "var(--coral)" : "var(--color-text-muted)", background: confirmDelete ? "rgba(230,155,151,0.1)" : "rgba(0,0,0,0.2)" }}>
              {confirmDelete ? "Sure?" : "✕"}
            </button>
          </div>
        </div>

        {/* Sub-quests */}
        {expanded && (
          <div className="flex flex-col gap-2 animate-fade-in pl-2 border-l-2" style={{ borderColor: "var(--reseda-dark)" }}>
            {task.subQuests.length === 0 ? (
              <p className="text-xs italic px-2" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
                No sub-quests yet. Break this goal into smaller steps.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {task.subQuests.map((sq) => <SubQuestRow key={sq.id} sq={sq} mainTaskId={task.id} />)}
              </ul>
            )}
            <div className="flex gap-2 flex-wrap mt-1">
              <button
                onClick={() => setAddSubOpen(true)}
                className="self-start text-xs px-3 py-1.5 border rounded-sm transition-all"
                style={{ fontFamily: "var(--font-display)", borderColor: "var(--reseda-dark)", color: "var(--reseda-readable)", background: "rgba(130,140,106,0.08)" }}>
                + Add Sub-Quest
              </button>
              {AI_SUGGESTIONS && <button
                onClick={handleSuggestSubtasks}
                disabled={suggesting}
                className="self-start text-xs px-3 py-1.5 border rounded-sm transition-all disabled:opacity-50"
                style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "rgba(0,0,0,0.2)" }}>
                {suggesting ? "Thinking…" : "✨ Suggest subtasks"}
              </button>}
            </div>

            {suggestError && (
              <p className="text-xs italic" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>{suggestError}</p>
            )}

            {suggestions.length > 0 && (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <p className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
                  Tap to include
                </p>
                {suggestions.map((s) => {
                  const isSelected = selectedSuggestions.has(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSuggestion(s)}
                      className="flex items-center gap-2 px-3 py-2 border rounded-sm text-sm text-left transition-all"
                      style={{
                        background: isSelected ? "rgba(130,140,106,0.1)" : "rgba(0,0,0,0.2)",
                        borderColor: isSelected ? "var(--reseda-readable)" : "var(--color-border)",
                        color: isSelected ? "var(--color-text)" : "var(--color-text-muted)",
                        fontFamily: "var(--font-body)",
                      }}>
                      <span className="w-4 h-4 shrink-0 rounded-sm border flex items-center justify-center text-[0.6rem]"
                        style={{ background: isSelected ? "var(--reseda-dark)" : "transparent", borderColor: isSelected ? "var(--reseda-readable)" : "var(--color-border)", color: "var(--blush)" }}>
                        {isSelected ? "✓" : ""}
                      </span>
                      {s}
                    </button>
                  );
                })}
                <Button type="button" variant="primary" size="sm" onClick={addSelectedSuggestions} disabled={selectedSuggestions.size === 0}>
                  Add {selectedSuggestions.size} sub-quest{selectedSuggestions.size === 1 ? "" : "s"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <AddSubQuestModal open={addSubOpen} onClose={() => setAddSubOpen(false)} mainTaskId={task.id} />
      <EditMainTaskModal open={editOpen} onClose={() => setEditOpen(false)} task={task} />
    </Card>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

interface MainTasksViewProps {
  onAddTask: () => void;
}

export function MainTasksView({ onAddTask }: MainTasksViewProps) {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");
  const [confirmPurge, setConfirmPurge] = useState(false);

  const filtered = state.mainTasks.filter((mt) => {
    if (filter === "active") return !mt.completedAt;
    if (filter === "done") return !!mt.completedAt;
    return true;
  });

  const completedCount = state.mainTasks.filter((mt) => !!mt.completedAt).length;

  function handlePurge() {
    if (confirmPurge) {
      dispatch({ type: "PURGE_COMPLETED_MAIN_TASKS" });
      setConfirmPurge(false);
      setFilter("active");
    } else {
      setConfirmPurge(true);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
            🏰 Main Tasks
          </h2>
          <p className="text-xs italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            Big ambitions with sub-quests
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<span aria-hidden>+</span>} onClick={onAddTask}>Add</Button>
      </div>

      {/* Filter + purge row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1.5" role="group" aria-label="Filter">
          {(["active", "all", "done"] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setConfirmPurge(false); }} aria-pressed={filter === f}
              className="px-3 py-1 rounded-sm text-[0.65rem] font-semibold border transition-all uppercase tracking-wider"
              style={{
                fontFamily: "var(--font-display)",
                background: filter === f ? "linear-gradient(180deg,var(--reseda),var(--reseda-dark))" : "transparent",
                borderColor: filter === f ? "var(--reseda-readable)" : "var(--color-border)",
                color: filter === f ? "var(--blush)" : "var(--color-text-muted)",
              }}>
              {f === "active" ? "In Progress" : f === "done" ? "Achieved" : "All"}
            </button>
          ))}
        </div>

        {filter === "done" && completedCount > 0 && (
          <button
            onClick={handlePurge}
            onBlur={() => setConfirmPurge(false)}
            className="ml-auto px-3 py-1 rounded-sm text-[0.65rem] font-semibold border transition-all uppercase tracking-wider"
            style={{
              fontFamily: "var(--font-display)",
              borderColor: confirmPurge ? "var(--coral)" : "var(--color-border)",
              color: confirmPurge ? "var(--coral)" : "var(--color-text-muted)",
              background: confirmPurge ? "rgba(230,155,151,0.1)" : "transparent",
            }}>
            {confirmPurge ? `Purge ${completedCount}? Sure?` : `🗑 Clear all achieved (${completedCount})`}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="text-4xl">🏰</div>
          <p className="text-sm italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            {filter === "done" ? "No achieved goals yet." : "No main tasks. Add a big ambitious goal!"}
          </p>
          {filter !== "done" && <Button variant="primary" onClick={onAddTask} icon={<span aria-hidden>+</span>}>Add Main Task</Button>}
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((mt, i) => (
            <li key={mt.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <MainTaskCard task={mt} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
