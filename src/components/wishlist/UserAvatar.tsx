import React from "react";
import { getAvatarInitials } from "@/lib/utils";

interface UserAvatarProps {
  displayName: string;
  avatarColor: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const sizeClasses = {
  xs: "w-5 h-5 text-[0.5rem]",
  sm: "w-7 h-7 text-xs",
  md: "w-10 h-10 text-sm",
};

export function UserAvatar({ displayName, avatarColor, size = "sm", className = "" }: UserAvatarProps) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full font-bold shrink-0 border",
        sizeClasses[size],
        className,
      ].join(" ")}
      style={{
        background: avatarColor,
        color: "#e8e2d8",
        borderColor: "rgba(130,140,106,0.5)",
        fontFamily: "var(--font-display)",
        boxShadow: "0 0 6px rgba(130,140,106,0.2)",
      }}
      aria-label={displayName}
      title={displayName}
    >
      {getAvatarInitials(displayName)}
    </span>
  );
}
