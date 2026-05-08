"use client";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "success" | "danger" | "warning" | "back" | "lay";
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

const sizeClasses = {
  xs: "h-4 w-4",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const colorClasses = {
  primary: "text-back",
  secondary: "text-slate-400",
  success: "text-emerald-500",
  danger: "text-red-500",
  warning: "text-amber-500",
  back: "text-back",
  lay: "text-lay",
};

export function LoadingSpinner({
  size = "md",
  color = "primary",
  className,
  fullScreen = false,
  text,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          sizeClasses[size],
          colorClasses[color]
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && (
        <p className="mt-3 text-sm text-slate-400">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

interface LoadingSkeletonProps {
  type?: "text" | "card" | "table" | "circle" | "custom";
  count?: number;
  className?: string;
  height?: string;
  width?: string;
}

export function LoadingSkeleton({
  type = "card",
  count = 1,
  className,
  height,
  width,
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => {
    switch (type) {
      case "text":
        return (
          <div
            key={i}
            className={cn("h-4 skeleton rounded", className)}
            style={{ height, width }}
          />
        );
      case "card":
        return (
          <div
            key={i}
            className={cn("skeleton rounded-2xl", className)}
            style={{ height: height || "200px", width }}
          />
        );
      case "table":
        return (
          <div
            key={i}
            className={cn("skeleton rounded-lg", className)}
            style={{ height: height || "60px", width }}
          />
        );
      case "circle":
        return (
          <div
            key={i}
            className={cn("skeleton rounded-full", className)}
            style={{ height: height || "60px", width: width || height || "60px" }}
          />
        );
      case "custom":
        return (
          <div
            key={i}
            className={cn("skeleton", className)}
            style={{ height, width }}
          />
        );
    }
  });

  return <>{skeletons}</>;
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  spinnerSize?: LoadingSpinnerProps["size"];
  overlayClassName?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  spinnerSize = "md",
  overlayClassName,
}: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center bg-ink/70 backdrop-blur-sm rounded-2xl z-10",
        overlayClassName
      )}>
        <LoadingSpinner size={spinnerSize} />
      </div>
    </div>
  );
}

// Hook for managing loading states
export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const withLoading = async <T,>(promise: Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await promise;
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
  };

  return {
    isLoading,
    error,
    withLoading,
    reset,
    setIsLoading,
    setError,
  };
}

// Import useState for the hook
import { useState } from "react";