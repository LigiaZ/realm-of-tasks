"use client";

import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "spin" | "done";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { className: string; style?: React.CSSProperties }> = {
  primary: {
    className: "border border-[var(--reseda-dark)] text-[var(--color-text-on-accent)] hover:brightness-110 active:scale-95",
    style: { background: "linear-gradient(180deg, var(--sage) 0%, var(--reseda) 50%, var(--reseda-dark) 100%)" },
  },
  secondary: {
    className: "border border-[var(--color-border-gold)] text-[var(--color-text)] hover:border-[var(--reseda-dark)] active:scale-95",
    style: { background: "linear-gradient(180deg, #1e2219 0%, #161a12 100%)" },
  },
  ghost: {
    className: "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--reseda-dark)] hover:text-[var(--color-text)] active:scale-95",
    style: { background: "transparent" },
  },
  danger: {
    className: "border border-[var(--crimson)] text-[var(--color-discard-text)] hover:brightness-110 active:scale-95",
    style: { background: "linear-gradient(180deg, #3a1010 0%, #280808 100%)" },
  },
  spin: {
    className: "border-0 text-[var(--color-text-on-accent)] hover:brightness-110",
    style: { background: "var(--gradient-gold)" },
  },
  done: {
    className: "border border-[var(--emerald)] text-[var(--color-done-text)] hover:brightness-110 active:scale-95",
    style: { background: "linear-gradient(180deg, #1e3828 0%, #142818 100%)" },
  },
};

const sizeStyles: Record<Size, string> = {
  sm:  "px-3 py-1.5 text-xs rounded-sm gap-1.5",
  md:  "px-4 py-2 text-xs rounded-sm gap-2",
  lg:  "px-6 py-3 text-sm rounded-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = "",
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { className: varCls, style: varStyle } = variantStyles[variant];

  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={{ ...varStyle, ...style, fontFamily: "var(--font-display)" }}
      className={[
        "inline-flex items-center justify-center font-semibold tracking-widest uppercase transition-all duration-200 cursor-pointer",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--reseda-readable)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "select-none letter-spacing-wider",
        varCls,
        sizeStyles[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      aria-busy={loading}
    >
      {loading ? (
        <span aria-hidden="true" className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span aria-hidden="true" className="shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}
