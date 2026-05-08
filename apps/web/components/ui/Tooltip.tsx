"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  maxWidth?: number;
  className?: string;
  tooltipClassName?: string;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
  maxWidth = 250,
  className,
  tooltipClassName,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let x = 0;
    let y = 0;

    switch (position) {
      case "top":
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case "bottom":
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + 8;
        break;
      case "left":
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case "right":
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Adjust for viewport boundaries
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x < 8) x = 8;
    if (x + tooltipRect.width > viewportWidth - 8) {
      x = viewportWidth - tooltipRect.width - 8;
    }
    
    if (y < 8) y = 8;
    if (y + tooltipRect.height > viewportHeight - 8) {
      y = viewportHeight - tooltipRect.height - 8;
    }

    setCoords({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      className={cn("inline-block", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-50 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            tooltipClassName
          )}
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            maxWidth: `${maxWidth}px`,
          }}
        >
          {content}
          <div
            className={cn(
              "absolute h-2 w-2 rotate-45 bg-slate-900",
              position === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2",
              position === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2",
              position === "left" && "right-[-4px] top-1/2 -translate-y-1/2",
              position === "right" && "left-[-4px] top-1/2 -translate-y-1/2"
            )}
          />
        </div>
      )}
    </div>
  );
}

// Specialized tooltip for trading terms
export interface TradingTooltipProps extends Omit<TooltipProps, "content"> {
  term: keyof typeof tradingTerms;
}

const tradingTerms = {
  "BACK": "Betting that an outcome will happen. You win if the selection wins.",
  "LAY": "Betting that an outcome will NOT happen. You win if the selection loses.",
  "odds": "The price at which you can back or lay a selection.",
  "stake": "The amount of money you want to bet.",
  "liability": "The amount you could lose on a lay bet.",
  "matched": "When your bet has been fully or partially accepted by another user.",
  "in-play": "Bets placed after an event has started.",
  "suspended": "Temporarily unavailable for betting.",
  "cashout": "Settle your bet before the event finishes for a guaranteed return.",
} as const;

export function TradingTooltip({ term, ...props }: TradingTooltipProps) {
  return (
    <Tooltip
      content={
        <div className="space-y-1">
          <div className="font-semibold">{term}</div>
          <div className="text-slate-300">{tradingTerms[term]}</div>
        </div>
      }
      {...props}
    />
  );
}