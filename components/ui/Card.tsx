import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  selected?: boolean;
}

export function Card({ hover, selected, className, children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={clsx(
        "bg-white rounded-xl border border-gray-100 shadow-sm",
        hover && "transition-all hover:shadow-md hover:border-navy-200 cursor-pointer",
        selected && "ring-2 ring-navy-500 border-navy-300",
        className
      )}
    >
      {children}
    </div>
  );
}
