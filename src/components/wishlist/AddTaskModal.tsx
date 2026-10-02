"use client";

import { AI_SUGGESTIONS } from "@/lib/edition";
import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";

type TaskKind = "quest" | "daily" | "mainTask";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultKind?: TaskKind;
}

const KIND_INFO: Record<TaskKind, { icon: string; label: string; desc: string; placeholder: string }> = {
  quest:    { icon: "⚔️",  label: "Quest",     desc: "Weekly task drawn by the wheel of fate", placeholder: "e.g. Clear the dungeon" },
  daily:    { icon: "🕯️",  label: "Daily",     desc: "Recurring daily habit or deed",          placeholder: "e.g. Sharpen the blade" },
  mainTask: { icon: "🏰",  label: "Main Task", desc: "Big ambitious goal with sub-quests",     placeholder: "e.g. Build a home" },
};

export function AddTaskModal({ open, onClose, defaultKind = "quest" }: AddTaskModalProps) {
  const { dispatch } = useStore();

  const [kind, setKind] = useState<TaskKind>(defaultKind);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shared, setShared] = useState(false);
  const [recurring, setRecurring] = useState(true); // for quests only
  const [category, setCategory] = useState<"personal" | "chore">("personal"); // for daily only
  const [weeklyGoal, setWeeklyGoal] = useState(""); // for daily only
  const [error, setError] = useState("");

  // AI subtask suggestions — main task only
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  function reset() {
    setTitle(""); setDescription(""); setShared(false); setRecurring(true);
    setCategory("personal"); setWeeklyGoal(""); setError(""); setKind(defaultKind);
    setSuggestions([]); setSelectedSuggestions(new Set()); setSuggestError("");
  }

  function handleClose() { reset(); onClose(); }

  async function handleSuggestSubtasks() {
    const trimmed = title.trim();
    if (!trimmed) { setError("Name the goal first."); return; }
    setSuggesting(true);
    setSuggestError("");
    try {
      const res = await fetch("/api/ai/suggest-subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: trimmed, description: description.trim() }),
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) { setError("The name must be inscribed."); return; }
    if (trimmed.length < 2) { setError("Title must be at least 2 characters."); return; }

    if (kind === "quest") {
      dispatch({ type: "ADD_QUEST", payload: { title: trimmed, recurring, shared } });
    } else if (kind === "daily") {
      const goal = Number(weeklyGoal);
      dispatch({ type: "ADD_DAILY", payload: { title: trimmed, shared, category, weeklyGoal: goal > 0 ? goal : undefined } });
    } else {
      const mainTaskId = generateId();
      dispatch({ type: "ADD_MAIN_TASK", payload: { title: trimmed, description: description.trim(), shared, id: mainTaskId } });
      for (const s of selectedSuggestions) {
        dispatch({ type: "ADD_SUB_QUEST", payload: { mainTaskId, title: s, shared: false, recurring: false } });
      }
    }
    handleClose();
  }

  const info = KIND_INFO[kind];

  return (
    <Modal open={open} onClose={handleClose} title="Inscribe New Quest">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

        {/* Kind selector */}
        <fieldset>
          <legend className="text-xs font-semibold tracking-widest uppercase mb-2.5" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
            What kind of task?
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {(["quest","daily","mainTask"] as TaskKind[]).map((k) => {
              const inf = KIND_INFO[k];
              const isSelected = kind === k;
              return (
                <button key={k} type="button" role="radio" aria-checked={isSelected}
                  onClick={() => { setKind(k); setError(""); }}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 border rounded-sm transition-all text-center"
                  style={{
                    background: isSelected ? "linear-gradient(180deg,var(--reseda) 0%,var(--reseda-dark) 100%)" : "rgba(0,0,0,0.3)",
                    borderColor: isSelected ? "var(--reseda-readable)" : "var(--color-border-gold)",
                    boxShadow: isSelected ? "0 0 8px rgba(130,140,106,0.3)" : "none",
                  }}>
                  <span className="text-xl">{inf.icon}</span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)", color: isSelected ? "var(--blush)" : "var(--color-text-muted)" }}>{inf.label}</span>
                  <span className="text-[0.55rem] leading-tight opacity-75" style={{ color: isSelected ? "var(--blush)" : "var(--color-text-muted)" }}>{inf.desc.split(" ").slice(0,4).join(" ")}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Title */}
        <Input label="Name" placeholder={info.placeholder} value={title}
          onChange={(e) => { setTitle(e.target.value); setError(""); }}
          error={error} autoFocus maxLength={120} />

        {/* Description — only for Main Task */}
        {kind === "mainTask" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
              Description (optional)
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What does achieving this mean to you?" rows={2} maxLength={300}
              className="w-full px-3 py-2.5 rounded-sm border text-sm resize-none transition-all"
              style={{ background: "var(--surface-inset)", borderColor: "var(--color-border-gold)", color: "var(--color-text)", fontFamily: "var(--font-body)" }} />
          </div>
        )}

        {/* AI subtask suggestions — main task only */}
        {kind === "mainTask" && (
          <div className="flex flex-col gap-2">
            {AI_SUGGESTIONS && (
            <Button type="button" variant="ghost" size="sm" onClick={handleSuggestSubtasks} loading={suggesting}
              icon={<span aria-hidden>✨</span>}>
              Suggest subtasks
            </Button>
            )}
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
              </div>
            )}
          </div>
        )}

        {/* Recurring toggle — quests only */}
        {kind === "quest" && (
          <fieldset>
            <legend className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
              After completion, this quest…
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: true,  icon: "🔄", label: "Returns", desc: "Goes back to the pool" },
                { val: false, icon: "💀", label: "Ends",    desc: "One-time only" },
              ].map(({ val, icon, label, desc }) => (
                <button key={String(val)} type="button" role="radio" aria-checked={recurring === val}
                  onClick={() => setRecurring(val)}
                  className="flex flex-col items-center gap-1 px-3 py-2.5 border rounded-sm transition-all"
                  style={{
                    background: recurring === val ? "linear-gradient(180deg,#1e2219 0%,#161a12 100%)" : "rgba(0,0,0,0.3)",
                    borderColor: recurring === val ? "var(--reseda-readable)" : "var(--color-border-gold)",
                  }}>
                  <span className="text-lg">{icon}</span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)", color: recurring === val ? "var(--reseda-readable)" : "var(--color-text-muted)" }}>{label}</span>
                  <span className="text-[0.55rem]" style={{ color: "var(--color-text-muted)" }}>{desc}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* Category + weekly goal — daily only */}
        {kind === "daily" && (
          <>
            <fieldset>
              <legend className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
                What kind of deed?
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "personal" as const, icon: "🧘", label: "Personal",    desc: "1 pt · goals & habits" },
                  { val: "chore" as const,    icon: "🧹", label: "House Chore", desc: "1.5 pt · upkeep" },
                ].map(({ val, icon, label, desc }) => (
                  <button key={val} type="button" role="radio" aria-checked={category === val}
                    onClick={() => setCategory(val)}
                    className="flex flex-col items-center gap-1 px-3 py-2.5 border rounded-sm transition-all"
                    style={{
                      background: category === val ? "linear-gradient(180deg,#1e2219 0%,#161a12 100%)" : "rgba(0,0,0,0.3)",
                      borderColor: category === val ? "var(--reseda-readable)" : "var(--color-border-gold)",
                    }}>
                    <span className="text-lg">{icon}</span>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)", color: category === val ? "var(--reseda-readable)" : "var(--color-text-muted)" }}>{label}</span>
                    <span className="text-[0.55rem]" style={{ color: "var(--color-text-muted)" }}>{desc}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <Input label="Weekly goal (optional)" type="number" min={1} max={14} placeholder="e.g. 5 times a week for a bonus"
              value={weeklyGoal} onChange={(e) => setWeeklyGoal(e.target.value)}
              hint="Hit this many completions in a week for a +5 point bonus" />
          </>
        )}

        {/* Solo / Group */}
        <fieldset>
          <legend className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
            Who must complete this?
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: false, icon: "🗡️", label: "Solo",       desc: "One adventurer" },
              { val: true,  icon: "⚔️", label: "Group Task", desc: "Both adventurers" },
            ].map(({ val, icon, label, desc }) => (
              <button key={String(val)} type="button" role="radio" aria-checked={shared === val}
                onClick={() => setShared(val)}
                className="flex flex-col items-center gap-1 px-3 py-2.5 border rounded-sm transition-all"
                style={{
                  background: shared === val ? "linear-gradient(180deg,#1e2219 0%,#161a12 100%)" : "rgba(0,0,0,0.3)",
                  borderColor: shared === val ? (val ? "var(--tea-rose)" : "var(--reseda-readable)") : "var(--color-border-gold)",
                  boxShadow: shared === val ? (val ? "0 0 8px rgba(239,192,188,0.2)" : "0 0 8px rgba(130,140,106,0.2)") : "none",
                }}>
                <span className="text-lg">{icon}</span>
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)", color: shared === val ? (val ? "var(--tea-rose)" : "var(--reseda-readable)") : "var(--color-text-muted)" }}>{label}</span>
                <span className="text-[0.55rem]" style={{ color: "var(--color-text-muted)" }}>{desc}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-2 justify-end pt-1" style={{ borderTop: "1px solid var(--color-border)" }}>
          <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="primary">Inscribe</Button>
        </div>
      </form>
    </Modal>
  );
}
