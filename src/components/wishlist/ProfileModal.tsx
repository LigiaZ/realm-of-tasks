"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserAvatar } from "./UserAvatar";
import { useStore, useCurrentUser } from "@/lib/store";
import { AVATAR_COLORS, getAvatarInitials } from "@/lib/utils";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { dispatch } = useStore();
  const currentUser = useCurrentUser();

  const [activeTab, setActiveTab] = useState<"sigil" | "realm">("sigil");
  const [selectedColor, setSelectedColor] = useState(currentUser?.avatarColor ?? AVATAR_COLORS[0]);
  const [name, setName] = useState(currentUser?.displayName ?? "");
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");

  function handleClose() {
    setSelectedColor(currentUser?.avatarColor ?? AVATAR_COLORS[0]);
    setName(currentUser?.displayName ?? "");
    setSaved(false);
    setResetConfirm("");
    setActiveTab("sigil");
    onClose();
  }

  if (!currentUser) return null;
  const changed = selectedColor !== currentUser.avatarColor || (name.trim() && name.trim() !== currentUser.displayName);

  function save() {
    if (!currentUser) return;
    dispatch({ type: "UPDATE_MEMBER", payload: { userId: currentUser.id, avatarColor: selectedColor, displayName: name } });
    setSaved(true);
    setTimeout(() => { setSaved(false); handleClose(); }, 1000);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Adventurer Profile" size="sm">
      <div className="flex flex-col gap-5">

        <div className="flex items-center gap-4">
          <div style={{ filter: `drop-shadow(0 0 8px ${selectedColor}55)` }}>
            <UserAvatar displayName={name || currentUser.displayName} avatarColor={selectedColor} size="md" />
          </div>
          <p className="font-semibold text-sm" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
            {currentUser.displayName}
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-sm" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--color-border)" }}>
          {([
            { id: "sigil", label: "🎨 Sigil" },
            { id: "realm", label: "⚠ Realm" },
          ] as const).map(({ id, label }) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className="flex-1 py-1.5 rounded-sm text-xs font-semibold transition-all uppercase tracking-wider"
              style={{
                fontFamily: "var(--font-display)",
                background: activeTab === id
                  ? id === "realm"
                    ? "linear-gradient(180deg,var(--coral-dark),var(--crimson))"
                    : "linear-gradient(180deg,var(--reseda),var(--reseda-dark))"
                  : "transparent",
                color: activeTab === id ? "var(--blush)" : id === "realm" ? "var(--color-discard-text)" : "var(--color-text-muted)",
              }}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "sigil" && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <Input label="Name" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            <p className="text-xs uppercase tracking-widest" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
              Choose your sigil colour
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              {AVATAR_COLORS.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button key={color} type="button" aria-label={`Sigil colour ${color}`} aria-pressed={isSelected}
                    onClick={() => setSelectedColor(color)}
                    className="relative w-14 h-14 rounded-full transition-all border-2 flex items-center justify-center"
                    style={{
                      background: color,
                      borderColor: isSelected ? "var(--reseda-readable)" : "transparent",
                      transform: isSelected ? "scale(1.15)" : "scale(1)",
                      boxShadow: isSelected ? `0 0 16px ${color}88, 0 0 6px rgba(130,140,106,0.4)` : `0 2px 8px rgba(0,0,0,0.4)`,
                    }}>
                    {isSelected && (
                      <span className="text-sm font-bold" style={{ color: "#e8e2d8", fontFamily: "var(--font-display)" }}>
                        {getAvatarInitials(name || currentUser.displayName)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {saved ? (
              <p className="text-center text-sm font-semibold animate-fade-in" style={{ fontFamily: "var(--font-display)", color: "var(--reseda-readable)" }}>
                ✦ Sigil reforged!
              </p>
            ) : (
              <div className="flex gap-2 justify-end pt-1" style={{ borderTop: "1px solid var(--color-border)" }}>
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button type="button" variant="primary" onClick={save} disabled={!changed}>Save</Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "realm" && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="px-4 py-3 rounded-sm border" style={{ background: "rgba(139,26,26,0.1)", borderColor: "var(--crimson)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-discard-text)" }}>
                ⚠ Start a new realm
              </p>
              <p className="text-sm italic" style={{ fontFamily: "var(--font-body)", color: "var(--color-text-muted)" }}>
                Clears every adventurer, quest, deed and annal saved in this browser. This can&rsquo;t be undone.
              </p>
            </div>
            <Input label='Type "start over" to confirm' value={resetConfirm} placeholder="start over"
              onChange={(e) => setResetConfirm(e.target.value)} autoComplete="off" />
            <Button type="button" variant="danger" fullWidth disabled={resetConfirm.trim().toLowerCase() !== "start over"}
              onClick={() => { dispatch({ type: "RESET_REALM" }); handleClose(); }}>
              Start over
            </Button>
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
