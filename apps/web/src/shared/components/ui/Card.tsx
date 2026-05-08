"use client";

import { forwardRef } from "react";
import { cn } from "../../../utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outline" | "filled";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", hover = false, ...props }, ref) => {
    const baseStyles = "rounded-2xl transition-all duration-200";
    
    const variants = {
      default: "bg-white border border-slate-200 shadow-sm",
      elevated: "bg-white border border-slate-200 shadow-lg",
      outline: "border-2 border-slate-300 bg-transparent",
      filled: "bg-slate-50 border border-slate-200",
    };

    const paddings = {
      none: "",
      sm: "p-3",
      md: "p-6",
      lg: "p-8",
    };

    const hoverStyles = hover ? "hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5" : "";

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], hoverStyles, className)}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col space-y-1.5", className)} {...props}>
        <div className="flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>}
          {action}
        </div>
        {description && <p className="text-sm text-slate-500">{description}</p>}
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("pt-4", className)} {...props} />;
  }
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: "start" | "center" | "end" | "between";
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, justify = "start", ...props }, ref) => {
    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center pt-4", justifyClasses[justify], className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardContent, CardFooter };