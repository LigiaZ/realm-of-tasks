"use client";

import React, { useState } from "react";
import { useStore, useCanSpin } from "@/lib/store";

interface SpinButtonProps {
  size?: "md" | "lg";
  label?: string;
}

export function SpinButton({ size = "lg", label = "Fate" }: SpinButtonProps) {
  const { dispatch } = useStore();
  const canSpin = useCanSpin();
  const [spinning, setSpinning] = useState(false);

  function handleSpin() {
    if (!canSpin || spinning) return;
    setSpinning(true);
    setTimeout(() => {
      dispatch({ type: "SPIN" });
      setSpinning(false);
    }, 900);
  }

  const isLg = size === "lg";
  const sizeClass = isLg ? "w-20 h-20 text-3xl" : "w-14 h-14 text-xl";

  return (
    <button
      onClick={handleSpin}
      disabled={!canSpin || spinning}
      aria-label={canSpin ? "Spin the wheel of fate" : "Add at least 4 weekly quests first"}
      aria-busy={spinning}
      title={canSpin ? "Let fate decide your quests" : "Need at least 4 quests in the pool"}
      className={[
        "relative flex flex-col items-center justify-center rounded-full font-semibold transition-all duration-300",
        "border-2 cursor-pointer select-none",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--reseda-readable)]",
        spinning ? "animate-spinning" : "hover:scale-110 active:scale-95",
        sizeClass,
      ].join(" ")}
      style={{
        background: "radial-gradient(circle at 40% 35%, #bcc4a6 0%, #a0ab89 40%, #5c6449 100%)",
        borderColor: spinning ? "var(--sage-light)" : "var(--reseda-dark)",
        boxShadow: spinning
          ? "0 0 24px rgba(130,140,106,0.7), 0 0 48px rgba(130,140,106,0.3)"
          : "0 0 10px rgba(130,140,106,0.3), inset 0 1px 0 rgba(160,171,137,0.3)",
      }}
    >
      {/* Rune symbol */}
      <span aria-hidden="true" className="leading-none" style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.6))" }}>
        {spinning ? "✦" : "⚔"}
      </span>
      <span
        className="text-[0.5rem] font-semibold tracking-widest uppercase mt-0.5"
        style={{ color: "var(--color-text-on-accent)", fontFamily: "var(--font-display)" }}
      >
        {spinning ? "..." : label}
      </span>
    </button>
  );
}
