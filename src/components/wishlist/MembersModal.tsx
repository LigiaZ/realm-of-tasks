"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserAvatar } from "./UserAvatar";
import { SigilPicker } from "./WelcomeScreen";
import { useStore } from "@/lib/store";
import { AVATAR_COLORS } from "@/lib/utils";

/** Add or remove the people who share this realm (browser edition: names only, no accounts). */
export function MembersModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[state.users.length % AVATAR_COLORS.length]);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  function handleClose() {
    setName(""); setError(""); setConfirmRemove(null);
    onClose();
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Every adventurer needs a name."); return; }
    if (state.users.some((u) => u.displayName.toLowerCase() === trimmed.toLowerCase())) {
      setError("Someone in this realm already has that name."); return;
    }
    dispatch({ type: "ADD_MEMBER", payload: { displayName: trimmed, avatarColor: color } });
    setName("");
    setColor(AVATAR_COLORS[(state.users.length + 1) % AVATAR_COLORS.length]);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Adventurers of the Realm" size="sm">
      <div className="flex flex-col gap-5">
        <ul className="flex flex-col gap-2">
          {state.users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-3 py-2 border rounded-sm"
              style={{ borderColor: "var(--color-border)", background: "rgba(0,0,0,0.2)" }}>
              <UserAvatar displayName={u.displayName} avatarColor={u.avatarColor} size="sm" />
              <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
                {u.displayName}{u.id === state.currentUserId ? " (you)" : ""}
              </span>
              {u.id !== state.currentUserId && (
                confirmRemove === u.id ? (
                  <span className="ml-auto flex gap-1">
                    <Button size="sm" variant="danger" onClick={() => { dispatch({ type: "REMOVE_MEMBER", payload: { userId: u.id } }); setConfirmRemove(null); }}>Remove</Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmRemove(null)}>Keep</Button>
                  </span>
                ) : (
                  <button className="ml-auto text-xs px-2 py-1" aria-label={`Remove ${u.displayName}`}
                    style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}
                    onClick={() => setConfirmRemove(u.id)}>✕</button>
                )
              )}
            </li>
          ))}
        </ul>

        <form onSubmit={add} className="flex flex-col gap-4 pt-4" style={{ borderTop: "1px solid var(--color-border)" }} noValidate>
          <Input label="Add an adventurer" value={name} maxLength={30} placeholder="Name"
            onChange={(e) => { setName(e.target.value); setError(""); }} error={error} autoComplete="off" />
          <SigilPicker value={color} onChange={setColor} previewName={name} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={handleClose}>Done</Button>
            <Button type="submit" variant="primary">Add</Button>
          </div>
        </form>

        <p className="text-[0.7rem] italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
          Everyone takes turns on this device. Pick who&rsquo;s playing from the menu under your sigil.
        </p>
      </div>
    </Modal>
  );
}
