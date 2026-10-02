"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = "", ...rest }: InputProps) {
  const innerId = React.useId();
  const inputId = id ?? innerId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "w-full px-3 py-2.5 rounded-sm border text-sm transition-all",
          "text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]",
          error
            ? "border-[var(--crimson)] focus:outline-none focus:ring-1 focus:ring-[var(--crimson-light)]"
            : "border-[var(--color-border-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--reseda-readable)]",
          className,
        ].join(" ")}
        style={{
          background: "var(--surface-inset)",
          fontFamily: "var(--font-body)",
        }}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        aria-invalid={error ? "true" : undefined}
        {...rest}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--color-text-muted)] italic" style={{ fontFamily: "var(--font-body)" }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-[var(--color-discard-text)]" style={{ fontFamily: "var(--font-body)" }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
