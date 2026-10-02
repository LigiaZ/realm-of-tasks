"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserAvatar } from "./UserAvatar";
import { useStore } from "@/lib/store";
import { AVATAR_COLORS, getAvatarInitials } from "@/lib/utils";

export function SigilPicker({ value, onChange, previewName }: { value: string; onChange: (c: string) => void; previewName?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest uppercase mb-2.5 flex items-center gap-2"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
        Choose a sigil colour
        {previewName && (
          <span className="inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold border"
            style={{ background: value, color: "#e8e2d8", borderColor: "var(--reseda-dark)", fontFamily: "var(--font-display)" }}>
            {getAvatarInitials(previewName) || "?"}
          </span>
        )}
      </p>
      <div className="flex gap-3 flex-wrap">
        {AVATAR_COLORS.map((color) => (
          <button key={color} type="button" aria-label={`Sigil colour ${color}`} aria-pressed={value === color}
            onClick={() => onChange(color)}
            className="w-10 h-10 rounded-full transition-all border-2 flex items-center justify-center"
            style={{
              background: color,
              borderColor: value === color ? "var(--reseda-readable)" : "transparent",
              transform: value === color ? "scale(1.15)" : "scale(1)",
              boxShadow: value === color ? "0 0 10px rgba(130,140,106,0.5)" : "none",
            }}>
            {value === color && <span style={{ color: "#e8e2d8", fontSize: "0.8rem" }}>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** First screen of the browser edition: pick who's playing, add someone, or load a sample household. */
export function WelcomeScreen() {
  const { state, dispatch } = useStore();
  const hasMembers = state.users.length > 0;
  const [adding, setAdding] = useState(!hasMembers);
  const [name, setName] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[state.users.length % AVATAR_COLORS.length]);
  const [error, setError] = useState("");

  function addMember(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Every adventurer needs a name."); return; }
    if (state.users.some((u) => u.displayName.toLowerCase() === trimmed.toLowerCase())) {
      setError("Someone in this realm already has that name."); return;
    }
    dispatch({ type: "ADD_MEMBER", payload: { displayName: trimmed, avatarColor: color, select: true } });
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: "var(--color-bg)" }}>
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(130,140,106,0.08) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(230,155,151,0.06) 0%, transparent 50%)" }} />
      </div>

      <div className="w-full max-w-sm animate-fade-in relative"
        style={{
          background: "linear-gradient(180deg, #222819 0%, #1a1f15 60%, #161a12 100%)",
          border: "1px solid var(--reseda-dark)", borderRadius: "4px",
          boxShadow: "0 0 0 1px rgba(130,140,106,0.1), 0 8px 60px rgba(0,0,0,0.8)",
        }}>

        <div className="relative px-8 pt-8 pb-6 text-center overflow-hidden"
          style={{ borderBottom: "1px solid var(--color-border-gold)", background: "linear-gradient(180deg, #1e2219 0%, #181d14 100%)" }}>
          <span className="absolute top-3 left-4 text-lg opacity-50 animate-flicker" style={{ color: "var(--reseda-dark)" }} aria-hidden>᛭</span>
          <span className="absolute top-3 right-4 text-lg opacity-50 animate-flicker" style={{ color: "var(--reseda-dark)", animationDelay: "1.5s" }} aria-hidden>᛭</span>
          <div className="text-5xl mb-3 animate-flicker" aria-hidden style={{ filter: "drop-shadow(0 0 12px rgba(130,140,106,0.5))" }}>⚔️</div>
          <h1 className="text-2xl font-bold tracking-widest text-gold-gradient" style={{ fontFamily: "var(--font-display)" }}>
            The Realm of Tasks
          </h1>
          <p className="text-xs tracking-widest mt-1 uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
            A Household Quest Board
          </p>
          <div className="divider-rune mt-4" style={{ color: "var(--reseda-dark)" }}><span>✦</span></div>
        </div>

        <div className="px-8 py-7 flex flex-col gap-5">
          {hasMembers && !adding && (
            <>
              <div className="text-center">
                <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
                  Who&rsquo;s playing?
                </h2>
                <p className="text-sm italic mt-1" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
                  Adventurers share this realm
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {state.users.map((user) => (
                  <button key={user.id} onClick={() => dispatch({ type: "SET_CURRENT_USER", payload: { userId: user.id } })}
                    className="flex items-center gap-3 px-4 py-3 border transition-all text-left"
                    style={{ background: "rgba(0,0,0,0.3)", borderColor: "var(--color-border-gold)", borderRadius: "2px" }}>
                    <UserAvatar displayName={user.displayName} avatarColor={user.avatarColor} size="md" />
                    <p className="font-semibold text-sm" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>{user.displayName}</p>
                    <span className="ml-auto text-lg" style={{ color: "var(--reseda-dark)" }} aria-hidden>›</span>
                  </button>
                ))}
              </div>
              <Button variant="ghost" fullWidth onClick={() => { setAdding(true); setError(""); }}>+ Add an adventurer</Button>
            </>
          )}

          {adding && (
            <form onSubmit={addMember} className="flex flex-col gap-5" noValidate>
              <div className="text-center">
                <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
                  {hasMembers ? "A new adventurer" : "Found your realm"}
                </h2>
                <p className="text-sm italic mt-1" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
                  {hasMembers ? "Who else lives here?" : "Start with your name. Add the rest of the household after."}
                </p>
              </div>
              <Input label="Name" value={name} autoFocus maxLength={30} placeholder="e.g. Ana"
                onChange={(e) => { setName(e.target.value); setError(""); }} error={error} autoComplete="off" />
              <SigilPicker value={color} onChange={setColor} previewName={name} />
              <Button type="submit" variant="primary" fullWidth>Enter the realm</Button>
              {hasMembers && <Button type="button" variant="ghost" fullWidth onClick={() => setAdding(false)}>Back</Button>}
            </form>
          )}

          {!hasMembers && (
            <>
              <div className="divider-rune" style={{ color: "var(--reseda-dark)" }}><span>or</span></div>
              <Button variant="ghost" fullWidth onClick={() => dispatch({ type: "LOAD_SAMPLE" })}>
                ✨ Explore a sample household
              </Button>
            </>
          )}

          <p className="text-[0.7rem] italic text-center leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
            No account needed. Your realm is saved in this browser, on this device.
          </p>
        </div>
      </div>
    </div>
  );
}
