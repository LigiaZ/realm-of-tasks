"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = React.useId();

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onCloseRef.current(); return; }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const sizeClass = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--color-overlay)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onCloseRef.current(); }}
      aria-modal="true"
      role="dialog"
      aria-labelledby={headingId}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={[
          "w-full rounded-sm outline-none animate-fade-in card-ornate border-rune",
          sizeClass,
        ].join(" ")}
        style={{ background: "var(--gradient-card)", maxHeight: "90dvh", overflowY: "auto" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{
            borderColor: "var(--color-border-gold)",
            background: "linear-gradient(180deg, #1e2219 0%, #161a12 100%)",
          }}
        >
          <h2
            id={headingId}
            className="text-sm font-semibold tracking-widest uppercase text-[var(--reseda-readable)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <button
            onClick={() => onCloseRef.current()}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-sm border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--reseda-dark)] hover:text-[var(--reseda-readable)] transition-colors text-sm"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
