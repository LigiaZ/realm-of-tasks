"use client";

import React, { useState } from "react";
import { useStore, useCanSpinPleasureWheel } from "@/lib/store";

interface PleasureSpinButtonProps {
  size?: "md" | "lg";
}

export function PleasureSpinButton({ size = "lg" }: PleasureSpinButtonProps) {
  const { dispatch } = useStore();
  const canSpin = useCanSpinPleasureWheel();
  const [spinning, setSpinning] = useState(false);

  function handleSpin() {
    if (!canSpin || spinning) return;
    setSpinning(true);
    setTimeout(() => {
      dispatch({ type: "SPIN_PLEASURE_WHEEL" });
      setSpinning(false);
    }, 900);
  }

  const isLg = size === "lg";
  const sizeClass = isLg ? "w-20 h-20 text-3xl" : "w-14 h-14 text-xl";

  return (
    <button
      onClick={handleSpin}
      disabled={!canSpin || spinning}
      aria-label={canSpin ? "Spin the wheel of pleasure" : "Not yet available"}
      aria-busy={spinning}
      title={canSpin ? "Claim your reward" : "Only the crowned victor of a closed month can spin"}
      className={[
        "relative flex flex-col items-center justify-center rounded-full font-semibold transition-all duration-300",
        "border-2 cursor-pointer select-none",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--tea-rose)]",
        spinning ? "animate-spinning" : "hover:scale-110 active:scale-95",
        sizeClass,
      ].join(" ")}
      style={{
        background: "radial-gradient(circle at 40% 35%, #f6e5e7 0%, #efc0bc 40%, #c4635f 100%)",
        borderColor: spinning ? "var(--blush)" : "var(--tea-dark)",
        boxShadow: spinning
          ? "0 0 24px rgba(239,192,188,0.7), 0 0 48px rgba(239,192,188,0.3)"
          : "0 0 10px rgba(239,192,188,0.3), inset 0 1px 0 rgba(246,229,231,0.3)",
      }}
    >
      <span aria-hidden="true" className="leading-none" style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.6))" }}>
        {spinning ? "✦" : "💖"}
      </span>
      <span
        className="text-[0.5rem] font-semibold tracking-widest uppercase mt-0.5"
        style={{ color: "#3a1210", fontFamily: "var(--font-display)" }}
      >
        {spinning ? "..." : "Claim"}
      </span>
    </button>
  );
}
