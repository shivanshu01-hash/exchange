"use client";

import { forwardRef } from "react";
import { cn } from "../../../utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "back" | "lay";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-back text-white hover:bg-back/90 focus:ring-back active:bg-back/80",
      secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-300 active:bg-slate-300",
      outline: "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 focus:ring-slate-300 active:bg-slate-100",
      ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300 active:bg-slate-200",
      danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 active:bg-red-700",
      success: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 active:bg-emerald-700",
      back: "bg-back text-white hover:bg-back/90 focus:ring-back active:bg-back/80",
      lay: "bg-lay text-white hover:bg-lay/90 focus:ring-lay active:bg-lay/80",
    };

    const sizes = {
      xs: "px-2 py-1 text-xs h-7",
      sm: "px-3 py-1.5 text-sm h-8",
      md: "px-4 py-2 text-sm h-10",
      lg: "px-6 py-3 text-base h-12",
      xl: "px-8 py-4 text-lg h-14",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          isLoading && "relative !text-transparent",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };