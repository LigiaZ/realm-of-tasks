"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SpinButton } from "./SpinButton";
import { UserAvatar } from "./UserAvatar";
import { useStore, useWeeklyQuests, useCanSpin } from "@/lib/store";
import { formatWeekRange, POINTS } from "@/lib/utils";
import type { Quest } from "@/lib/types";

// ── Edit quest modal ───────────────────────────────────────────────────────

function EditQuestModal({ open, onClose, quest }: { open: boolean; onClose: () => void; quest: Quest }) {
  const { dispatch } = useStore();
  const [title, setTitle] = useState(quest.title);
  const [shared, setShared] = useState(quest.shared);
  const [recurring, setRecurring] = useState(quest.recurring);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (open) { setTitle(quest.title); setShared(quest.shared); setRecurring(quest.recurring); setError(""); }
  }, [open, quest]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Name required."); return; }
    dispatch({ type: "EDIT_QUEST", payload: { id: quest.id, title: title.trim(), shared, recurring } });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Quest" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Quest name" value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} error={error} autoFocus />

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
          <label className="text-[0.65rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            {([{ val: false, icon: "💀", label: "Once" }, { val: true, icon: "🔄", label: "Recurring" }] as const).map(({ val, icon, label }) => (
              <button key={String(val)} type="button" onClick={() => setRecurring(val)}
                className="flex flex-col items-center gap-1 py-2 border rounded-sm transition-all"
                style={{ background: recurring === val ? "linear-gradient(180deg,#1e2219,#161a12)" : "rgba(0,0,0,0.3)", borderColor: recurring === val ? "var(--reseda-readable)" : "var(--color-border-gold)" }}>
                <span className="text-base">{icon}</span>
                <span className="text-[0.6rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: recurring === val ? "var(--reseda-readable)" : "var(--color-text-muted)" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1" style={{ borderTop: "1px solid var(--color-border)" }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Quest pool row ─────────────────────────────────────────────────────────

function QuestPoolRow({ quest }: { quest: Quest }) {
  const { dispatch } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <li className="flex items-center gap-2 px-3 py-2 border rounded-sm text-sm transition-all"
      style={{ background: "rgba(0,0,0,0.2)", borderColor: "var(--color-border)" }}>
      <span className="flex-1 min-w-0" style={{ fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
        {quest.title}
        <span className="flex gap-2 mt-0.5">
          {quest.shared && <span className="text-[0.5rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--sage)" }}>⚔ group</span>}
          {quest.recurring && <span className="text-[0.5rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>🔄 recurring</span>}
          {!quest.recurring && <span className="text-[0.5rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>once</span>}
          <span className="text-[0.5rem] uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
            +{quest.recurring ? POINTS.recurringQuest : POINTS.oneTimeQuest} pt
          </span>
        </span>
      </span>
      <button
        onClick={() => setEditOpen(true)}
        className="shrink-0 text-xs px-1.5 py-1 border rounded-sm transition-all"
        style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "rgba(0,0,0,0.2)" }}
        aria-label="Edit quest" title="Edit">✎</button>
      <button
        onClick={() => { if (confirmDelete) { dispatch({ type: "DELETE_QUEST", payload: { id: quest.id } }); } else setConfirmDelete(true); }}
        onBlur={() => setConfirmDelete(false)}
        className="shrink-0 text-xs px-1.5 py-1 border rounded-sm transition-all"
        style={{ fontFamily: "var(--font-display)", borderColor: confirmDelete ? "var(--coral)" : "var(--color-border)", color: confirmDelete ? "var(--coral)" : "var(--color-text-muted)", background: confirmDelete ? "rgba(230,155,151,0.1)" : "rgba(0,0,0,0.2)" }}
        aria-label="Delete quest">
        {confirmDelete ? "Sure?" : "✕"}
      </button>
      <EditQuestModal open={editOpen} onClose={() => setEditOpen(false)} quest={quest} />
    </li>
  );
}

interface QuestsViewProps {
  onAddQuest: () => void;
}

export function WeeklyTaskCard({ onAddQuest }: QuestsViewProps) {
  const { state, dispatch } = useStore();
  const quests = useWeeklyQuests();
  const canSpin = useCanSpin();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [completing, setCompleting] = useState(false);

  const ws = state.weeklyState;
  const users = state.users;
  const currentUserId = state.currentUserId ?? "unknown";
  const totalUsers = users.length || 1;

  function getQuestStatus(questId: string, shared: boolean) {
    const done: string[] = ws?.doneStatus[questId] ?? [];
    const currentUserDone = done.includes(currentUserId);
    const isFullyDone = shared
      ? done.length >= Math.min(2, totalUsers)
      : done.length >= 1; // solo: anyone completing it = done for all
    return { done, currentUserDone, isFullyDone };
  }

  function handleToggle(questId: string) {
    dispatch({ type: "TOGGLE_QUEST_DONE", payload: { questId } });
  }

  function handleCompleteWeek() {
    setCompleting(true);
    setTimeout(() => { dispatch({ type: "COMPLETE_WEEK" }); setCompleting(false); }, 500);
  }

  function handleDiscard() {
    if (!confirmDiscard) { setConfirmDiscard(true); return; }
    dispatch({ type: "DISCARD_WEEK" });
    setConfirmDiscard(false);
  }

  if (!ws || quests.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="text-5xl animate-flicker" aria-hidden style={{ filter: "drop-shadow(0 0 12px rgba(130,140,106,0.4))" }}>⚔️</div>
        <div>
          <h2 className="font-bold text-[var(--color-text)] mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "0.05em" }}>
            No Quests Selected
          </h2>
          <p className="text-sm italic max-w-xs mx-auto" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            {canSpin ? "Spin the wheel of fate to draw your quests for this week." : "Inscribe at least one quest to begin."}
          </p>
        </div>
        {canSpin ? <SpinButton size="lg" label="Fate" /> : (
          <Button variant="primary" onClick={onAddQuest} icon={<span aria-hidden>+</span>}>Add Quest</Button>
        )}
      </Card>
    );
  }

  if (ws.weekDone) {
    return (
      <Card highlight className="flex flex-col gap-4 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <Badge variant="done">✦ Week Complete</Badge>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", letterSpacing: "0.08em", color: "var(--color-text)", opacity: 0.6 }}>
              {formatWeekRange(ws.weekStartDate, ws.weekEndDate)}
            </h2>
          </div>
          <span className="text-3xl" aria-hidden>🏆</span>
        </div>
        <ul className="flex flex-col gap-2">
          {quests.map((q) => (
            <li key={q.id} className="flex items-center gap-3 px-4 py-2.5 border rounded-sm text-sm"
              style={{ background: "linear-gradient(135deg,#1a1416,#140f12)", borderColor: "var(--tea-rose)", opacity: 0.8 }}>
              <span className="w-6 h-6 shrink-0 rounded-sm flex items-center justify-center text-xs font-bold border"
                style={{ background: "var(--tea-dark)", borderColor: "var(--tea-rose)", color: "var(--blush)", fontFamily: "var(--font-display)" }}>✓</span>
              <span className="flex-1" style={{ fontFamily: "var(--font-body)", color: "var(--color-done-text)", textDecoration: "line-through" }}>{q.title}</span>
            </li>
          ))}
        </ul>
        {canSpin && <div className="mt-1"><SpinButton size="md" label="New Week" /></div>}
      </Card>
    );
  }

  const fullyDone = quests.filter((q) => getQuestStatus(q.id, q.shared).isFullyDone).length;
  const total = quests.length;
  const progress = total > 0 ? (fullyDone / total) * 100 : 0;

  return (
    <Card highlight={completing} className={["flex flex-col gap-4 transition-all", completing ? "animate-pop" : ""].join(" ")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
            ⚔ This Week&apos;s Quests
          </h2>
          <span className="text-xs italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            {formatWeekRange(ws.weekStartDate, ws.weekEndDate)}
          </span>
        </div>
        <SpinButton size="md" label="Fate" />
      </div>

      <div>
        <div className="flex justify-between text-[0.65rem] mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
          <span className="uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Progress</span>
          <span style={{ color: "var(--reseda-readable)" }}>{fullyDone}/{total}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-sm" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--color-border)" }}
          role="progressbar" aria-valuenow={fullyDone} aria-valuemin={0} aria-valuemax={total} aria-label={`${fullyDone} of ${total} quests complete`}>
          <div className="h-full transition-all duration-700" style={{
            width: `${progress}%`,
            background: fullyDone === total ? "linear-gradient(90deg,var(--tea-rose),var(--tea-dark))" : "linear-gradient(90deg,var(--reseda),var(--sage))",
          }} />
        </div>
        {fullyDone === total && total > 0 && (
          <p className="text-xs font-semibold mt-1.5 tracking-wide" style={{ color: "var(--tea-rose)", fontFamily: "var(--font-display)" }}>
            ✦ All quests fulfilled — mark the week complete.
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-2" aria-label="This week's quests">
        {quests.map((quest, index) => {
          const { done: doneByIds, currentUserDone, isFullyDone } = getQuestStatus(quest.id, quest.shared);
          const isSubQuest = quest.type === "subQuest";
          const fromMainTitle = "fromMainTaskTitle" in quest ? quest.fromMainTaskTitle : undefined;
          const isRecurring = "recurring" in quest ? quest.recurring : true;

          return (
            <li key={quest.id}>
              <button
                onClick={() => handleToggle(quest.id)}
                role="checkbox"
                aria-checked={currentUserDone}
                className="w-full flex items-center gap-3 px-4 py-3 border text-sm text-left transition-all rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--reseda-readable)] cursor-pointer"
                style={{
                  background: isFullyDone ? "linear-gradient(135deg,#1a1416,#140f12)" : currentUserDone ? "linear-gradient(135deg,#161a12,#121610)" : "linear-gradient(135deg,#1a1e16,#161a12)",
                  borderColor: isFullyDone ? "var(--tea-rose)" : currentUserDone ? "var(--reseda)" : "var(--color-border)",
                }}
              >
                <span className="w-7 h-7 shrink-0 rounded-sm flex items-center justify-center text-xs font-bold border" style={{
                  fontFamily: "var(--font-display)",
                  background: isFullyDone ? "var(--tea-dark)" : currentUserDone ? "var(--reseda-dark)" : "rgba(130,140,106,0.12)",
                  borderColor: isFullyDone ? "var(--tea-rose)" : "var(--reseda-dark)",
                  color: isFullyDone ? "var(--blush)" : currentUserDone ? "var(--blush)" : "var(--reseda-readable)",
                }}>
                  {isFullyDone ? "✓" : currentUserDone ? "½" : index + 1}
                </span>

                <span className="flex-1 flex flex-col gap-0.5" style={{
                  fontFamily: "var(--font-body)",
                  color: isFullyDone ? "var(--color-done-text)" : "var(--color-text)",
                  textDecoration: isFullyDone ? "line-through" : "none",
                  opacity: isFullyDone ? 0.7 : 1,
                }}>
                  {quest.title}
                  <span className="flex gap-2 items-center flex-wrap">
                    {quest.shared && <span className="text-[0.55rem] tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--sage)", textDecoration: "none", opacity: 1 }}>⚔ Group Task</span>}
                    {isSubQuest && fromMainTitle && <span className="text-[0.55rem] tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--tea-rose)", textDecoration: "none", opacity: 1 }}>✦ {fromMainTitle}</span>}
                    {!isRecurring && !isSubQuest && <span className="text-[0.55rem] tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)", textDecoration: "none", opacity: 1 }}>once</span>}
                    <span className="text-[0.55rem] tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)", textDecoration: "none", opacity: 1 }}>
                      +{isSubQuest ? POINTS.subtask : (isRecurring ? POINTS.recurringQuest : POINTS.oneTimeQuest)} pt
                    </span>
                  </span>
                </span>

                {/* Show who completed: avatars for shared, name for solo */}
                {quest.shared && users.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    {users.map((u) => (
                      <span key={u.id} className={["transition-all", doneByIds.includes(u.id) ? "opacity-100" : "opacity-25 grayscale"].join(" ")}
                        title={doneByIds.includes(u.id) ? `${u.displayName} ✓` : `${u.displayName} – not yet`}>
                        <UserAvatar displayName={u.displayName} avatarColor={u.avatarColor} size="xs" />
                      </span>
                    ))}
                  </div>
                )}
                {!quest.shared && isFullyDone && doneByIds[0] && (() => {
                  const completedBy = users.find((u) => u.id === doneByIds[0]);
                  return completedBy ? (
                    <div className="flex items-center gap-1 shrink-0" title={`Completed by ${completedBy.displayName}`}>
                      <UserAvatar displayName={completedBy.displayName} avatarColor={completedBy.avatarColor} size="xs" />
                    </div>
                  ) : null;
                })()}
              </button>
              {quest.shared && currentUserDone && !isFullyDone && users.length > 1 && (
                <p className="text-xs pl-14 mt-0.5 italic" style={{ color: "var(--reseda)", fontFamily: "var(--font-body)" }}>
                  Your deed is recorded — awaiting {users.filter((u) => !doneByIds.includes(u.id)).map((u) => u.displayName).join(" & ")}
                </p>
              )}
              {quest.shared && isFullyDone && (
                <p className="text-xs pl-14 mt-0.5 italic" style={{ color: "var(--tea-rose)", fontFamily: "var(--font-body)" }}>
                  ✦ Completed by {doneByIds.map((id) => users.find((u) => u.id === id)?.displayName ?? "Unknown").join(" & ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-2 pt-3 border-t" style={{ borderColor: "var(--color-border-gold)" }}>
        <Button variant="done" size="md" icon={<span aria-hidden>✦</span>} onClick={handleCompleteWeek} loading={completing}>Complete Week</Button>
        <Button variant={confirmDiscard ? "danger" : "ghost"} size="md" icon={<span aria-hidden>↩</span>} onClick={handleDiscard} onBlur={() => setConfirmDiscard(false)}>
          {confirmDiscard ? "Confirm" : "Abandon"}
        </Button>
        <Button variant="ghost" size="md" icon={<span aria-hidden>+</span>} onClick={onAddQuest} className="ml-auto">Add Quest</Button>
      </div>
    </Card>
  );
}

// ── Quest pool management section ──────────────────────────────────────────

export function QuestPoolSection({ onAddQuest }: { onAddQuest: () => void }) {
  const { state } = useStore();
  const [expanded, setExpanded] = useState(false);
  const pool = state.questPool.filter((q) => q.status === "active");

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 border rounded-sm text-xs transition-all"
        style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "rgba(0,0,0,0.2)" }}>
        <span className="uppercase tracking-widest">📜 Quest Pool ({pool.length})</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2 animate-fade-in">
          {pool.length === 0 ? (
            <p className="text-xs italic px-3 py-2" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
              No quests in the pool yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {pool.map((q) => <QuestPoolRow key={q.id} quest={q} />)}
            </ul>
          )}
          <button
            onClick={onAddQuest}
            className="self-start text-xs px-3 py-1.5 border rounded-sm transition-all"
            style={{ fontFamily: "var(--font-display)", borderColor: "var(--reseda-dark)", color: "var(--reseda-readable)", background: "rgba(130,140,106,0.08)" }}>
            + Add Quest to Pool
          </button>
        </div>
      )}
    </div>
  );
}
