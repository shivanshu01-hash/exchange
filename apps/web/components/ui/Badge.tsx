"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info" | "back" | "lay";
  size?: "sm" | "md" | "lg";
  rounded?: "full" | "lg" | "md";
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", rounded = "full", dot = false, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center font-medium whitespace-nowrap";
    
    const variants = {
      default: "bg-slate-100 text-slate-800",
      secondary: "bg-slate-200 text-slate-800",
      outline: "border border-slate-300 text-slate-700",
      success: "bg-emerald-100 text-emerald-800",
      warning: "bg-amber-100 text-amber-800",
      danger: "bg-red-100 text-red-800",
      info: "bg-blue-100 text-blue-800",
      back: "bg-back/10 text-back",
      lay: "bg-lay/10 text-lay",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-xs",
      lg: "px-3 py-1.5 text-sm",
    };

    const roundedStyles = {
      full: "rounded-full",
      lg: "rounded-lg",
      md: "rounded-md",
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], roundedStyles[rounded], className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "mr-1.5 h-1.5 w-1.5 rounded-full",
              (variant === "default" || variant === "secondary" || variant === "outline") && "bg-slate-800",
              variant === "success" && "bg-emerald-800",
              variant === "warning" && "bg-amber-800",
              variant === "danger" && "bg-red-800",
              variant === "info" && "bg-blue-800",
              variant === "back" && "bg-back",
              variant === "lay" && "bg-lay"
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

// Specialized badge components for trading
export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: "open" | "matched" | "cancelled" | "settled" | "voided" | "in-play" | "suspended" | "closed";
}

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const variantMap = {
      open: "info",
      matched: "success",
      cancelled: "warning",
      settled: "success",
      voided: "danger",
      "in-play": "back",
      suspended: "warning",
      closed: "secondary",
    } as const;

    const labelMap = {
      open: "Open",
      matched: "Matched",
      cancelled: "Cancelled",
      settled: "Settled",
      voided: "Voided",
      "in-play": "In Play",
      suspended: "Suspended",
      closed: "Closed",
    };

    return (
      <Badge
        ref={ref}
        variant={variantMap[status]}
        dot
        {...props}
      >
        {labelMap[status]}
      </Badge>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export interface SideBadgeProps extends Omit<BadgeProps, "variant"> {
  side: "BACK" | "LAY";
}

const SideBadge = forwardRef<HTMLSpanElement, SideBadgeProps>(
  ({ side, ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        variant={side === "BACK" ? "back" : "lay"}
        dot
        {...props}
      >
        {side}
      </Badge>
    );
  }
);

SideBadge.displayName = "SideBadge";

export { Badge, StatusBadge, SideBadge };