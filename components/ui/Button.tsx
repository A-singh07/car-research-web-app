"use client";

import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center font-medium rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        size === "sm" && "px-4 py-1.5 text-sm",
        size === "md" && "px-6 py-2.5 text-sm",
        size === "lg" && "px-8 py-3.5 text-base",
        variant === "primary" && [
          "bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950",
          "focus-visible:ring-navy-600",
          disabled && "opacity-40 cursor-not-allowed",
        ],
        variant === "secondary" && [
          "bg-white text-navy-900 border border-navy-200 hover:border-navy-400 hover:bg-navy-50 active:bg-navy-100",
          "focus-visible:ring-navy-400",
          disabled && "opacity-40 cursor-not-allowed",
        ],
        variant === "ghost" && [
          "text-navy-600 hover:bg-navy-50 active:bg-navy-100",
          "focus-visible:ring-navy-400",
          disabled && "opacity-40 cursor-not-allowed",
        ],
        className
      )}
    >
      {children}
    </button>
  );
}
