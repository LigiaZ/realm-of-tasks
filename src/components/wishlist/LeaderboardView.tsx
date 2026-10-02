"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserAvatar } from "./UserAvatar";
import { PleasureSpinButton } from "./PleasureSpinButton";
import {
  useStore, useMonthlyPoints, useCanCloseMonth, useLatestMonthlyReward, useCanSpinPleasureWheel,
} from "@/lib/store";

function monthLabel(monthId: string): string {
  const [y, m] = monthId.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── Prize pool management ──────────────────────────────────────────────────

function PleasurePool() {
  const { state, dispatch } = useStore();
  const [title, setTitle] = useState("");
  const [expanded, setExpanded] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    dispatch({ type: "ADD_PLEASURE_REWARD", payload: { title: title.trim() } });
    setTitle("");
  }

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 border rounded-sm text-xs transition-all"
        style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "rgba(0,0,0,0.2)" }}>
        <span className="uppercase tracking-widest">💖 Prize Pool ({state.pleasurePool.length})</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2 animate-fade-in">
          {state.pleasurePool.length === 0 ? (
            <p className="text-xs italic px-3 py-2" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
              No prizes yet — add a few small pleasures to spin for.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {state.pleasurePool.map((r) => (
                <li key={r.id} className="flex items-center gap-2 px-3 py-2 border rounded-sm text-sm"
                  style={{ background: "rgba(0,0,0,0.2)", borderColor: "var(--color-border)" }}>
                  <span className="flex-1" style={{ fontFamily: "var(--font-body)", color: "var(--color-text)" }}>{r.title}</span>
                  <button
                    onClick={() => dispatch({ type: "DELETE_PLEASURE_REWARD", payload: { id: r.id } })}
                    className="shrink-0 text-xs text-[var(--color-text-muted)] hover:text-[var(--coral)] transition-colors"
                    aria-label="Delete prize">✕</button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleAdd} className="flex gap-2 items-center">
            <div className="flex-1">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. A massage, pick the next trip…" maxLength={120} />
            </div>
            <Button type="submit" variant="ghost" size="sm">Add</Button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

export function LeaderboardView() {
  const { state, dispatch } = useStore();
  const monthly = useMonthlyPoints();
  const canClose = useCanCloseMonth();
  const latest = useLatestMonthlyReward();
  const canSpin = useCanSpinPleasureWheel();
  const [confirmClose, setConfirmClose] = useState(false);

  function handleClose() {
    if (!confirmClose) { setConfirmClose(true); return; }
    dispatch({ type: "CLOSE_MONTH" });
    setConfirmClose(false);
  }

  const topPoints = monthly[0]?.points ?? 0;
  const hasAnyPoints = monthly.some((m) => m.points > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
            🏆 Glory
          </h2>
          <p className="text-xs italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            This month&apos;s points — the leader wins the Wheel of Pleasure
          </p>
        </div>
      </div>

      <Card>
        <h3 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
          {monthLabel(new Date().toISOString().slice(0, 7))} Standings
        </h3>
        {!hasAnyPoints ? (
          <p className="text-sm italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            No points earned yet this month — complete some quests and deeds!
          </p>
        ) : (
          monthly.map(({ user, points }) => {
            const pct = topPoints > 0 ? (points / topPoints) * 100 : 0;
            return (
              <div key={user.id} className="flex items-center gap-2 mb-2">
                <UserAvatar displayName={user.displayName} avatarColor={user.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-[0.65rem] mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
                    <span style={{ color: "var(--color-text)" }}>{user.displayName}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>{points} pt</span>
                  </div>
                  <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: user.avatarColor }} />
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
          <Button
            variant={confirmClose ? "danger" : "done"} size="sm"
            onClick={handleClose} onBlur={() => setConfirmClose(false)}
            disabled={!canClose}>
            {!canClose ? "Month already closed" : confirmClose ? "Confirm — lock in this month?" : "✦ Close Month"}
          </Button>
        </div>
      </Card>

      {latest && (
        <Card highlight className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>👑</span>
            <div>
              <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--tea-rose)" }}>
                {monthLabel(latest.monthId)} Champion{latest.wonByUserId.length > 1 ? "s" : ""}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {latest.wonByUserId.length === 0 ? (
                  <span className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>No points earned that month.</span>
                ) : (
                  latest.wonByUserId.map((uid) => {
                    const u = state.users.find((x) => x.id === uid);
                    if (!u) return null;
                    return (
                      <span key={uid} className="flex items-center gap-1.5">
                        <UserAvatar displayName={u.displayName} avatarColor={u.avatarColor} size="xs" />
                        <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--color-text)" }}>{u.displayName}</span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {latest.claimedAt ? (
            <p className="text-sm italic" style={{ fontFamily: "var(--font-body)", color: "var(--tea-rose)" }}>
              🎁 Claimed: <strong style={{ fontStyle: "normal" }}>{latest.prizeTitle}</strong>
            </p>
          ) : canSpin ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <PleasureSpinButton size="md" />
              <p className="text-xs italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>Spin the Wheel of Pleasure!</p>
            </div>
          ) : latest.wonByUserId.length > 0 ? (
            <p className="text-xs italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
              {state.pleasurePool.length === 0 ? "Add a prize below so the wheel has something to spin." : "Awaiting the champion to spin."}
            </p>
          ) : null}

          <PleasurePool />
        </Card>
      )}

      {state.monthlyRewards.length > 1 && (
        <Card>
          <h3 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
            📖 Hall of Fame
          </h3>
          <ul className="flex flex-col gap-2">
            {state.monthlyRewards.slice(1).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                <span style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>{monthLabel(r.monthId)}</span>
                <span className="flex items-center gap-2 flex-wrap justify-end">
                  {r.wonByUserId.map((uid) => {
                    const u = state.users.find((x) => x.id === uid);
                    return u ? <UserAvatar key={uid} displayName={u.displayName} avatarColor={u.avatarColor} size="xs" /> : null;
                  })}
                  {r.prizeTitle && <span className="text-xs italic" style={{ color: "var(--tea-rose)" }}>{r.prizeTitle}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
