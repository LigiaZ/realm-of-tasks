import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  highlight?: boolean;
}

export function Card({ children, className = "", as: Tag = "div", highlight = false }: CardProps) {
  return (
    <Tag
      className={[
        "relative rounded-sm border p-5 card-ornate",
        highlight
          ? "border-[var(--reseda-readable)] glow-gold"
          : "border-rune",
        className,
      ].join(" ")}
      style={{
        background: "var(--gradient-card)",
        borderColor: highlight ? "var(--reseda-readable)" : undefined,
      }}
    >
      {children}
    </Tag>
  );
}
