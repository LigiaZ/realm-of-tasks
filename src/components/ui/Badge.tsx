import React from "react";

type BadgeVariant = "weekly" | "recurring" | "daily" | "done" | "pending" | "discard";

const styles: Record<BadgeVariant, string> = {
  weekly:    "border-[var(--reseda-dark)] text-[var(--reseda-readable)]",
  recurring: "border-[#6a4a20] text-[#c09050]",
  daily:     "border-[#304a38] text-[var(--color-done-text)]",
  done:      "border-[var(--emerald)] text-[var(--color-done-text)]",
  pending:   "border-[var(--color-border)] text-[var(--color-text-muted)]",
  discard:   "border-[var(--crimson)] text-[var(--color-discard-text)]",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "pending", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-sm text-[0.65rem] font-semibold border tracking-wide uppercase",
        "font-display",
        styles[variant],
        className,
      ].join(" ")}
      style={{ background: "rgba(0,0,0,0.35)", fontFamily: "var(--font-display)" }}
    >
      {children}
    </span>
  );
}
