"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: "default" | "outline" | "filled";
  inputSize?: "sm" | "md" | "lg";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      variant = "default",
      inputSize = "md",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseStyles = "flex items-center rounded-lg border transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-1";
    
    const variants = {
      default: "border-slate-300 bg-white focus-within:border-back focus-within:ring-back",
      outline: "border-2 border-slate-300 bg-transparent focus-within:border-back focus-within:ring-back",
      filled: "border-slate-200 bg-slate-50 focus-within:border-back focus-within:ring-back",
    };

    const sizes = {
      sm: "h-8 text-sm",
      md: "h-10 text-sm",
      lg: "h-12 text-base",
    };

    const inputSizes = {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-2",
      lg: "px-4 py-3 text-base",
    };

    const iconSizes = {
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return (
      <div className={cn("space-y-1.5", fullWidth ? "w-full" : "")}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        
        <div className={cn(baseStyles, variants[variant], sizes[inputSize], error ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500" : "")}>
          {leftIcon && (
            <span className={cn("ml-3 text-slate-400", iconSizes[inputSize])}>
              {leftIcon}
            </span>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-transparent outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
              inputSizes[inputSize],
              leftIcon ? "pl-2" : "",
              rightIcon ? "pr-2" : "",
              !leftIcon && !rightIcon ? "px-3" : "",
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <span className={cn("mr-3 text-slate-400", iconSizes[inputSize])}>
              {rightIcon}
            </span>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={cn("text-sm", error ? "text-red-600" : "text-slate-500")}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Specialized input components for trading
export interface CurrencyInputProps extends Omit<InputProps, "type" | "leftIcon" | "min" | "max" | "step"> {
  currency?: string;
  min?: number;
  max?: number;
  step?: number;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ currency = "₹", min = 0, max, step = 0.01, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="number"
        leftIcon={
          <span className="font-medium text-slate-700">{currency}</span>
        }
        min={min}
        max={max}
        step={step}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export interface OddsInputProps extends Omit<InputProps, "type" | "rightIcon"> {
  format?: "decimal" | "fractional";
  min?: number;
  max?: number;
  step?: number;
}

const OddsInput = forwardRef<HTMLInputElement, OddsInputProps>(
  ({ format = "decimal", min = 1.01, max = 1000, step = 0.01, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="number"
        rightIcon={
          <span className="text-xs font-medium text-slate-500">
            {format === "decimal" ? "Dec" : "Frac"}
          </span>
        }
        min={min}
        max={max}
        step={step}
        {...props}
      />
    );
  }
);

OddsInput.displayName = "OddsInput";

export interface StakeInputProps extends Omit<InputProps, "type" | "min" | "max" | "step"> {
  side?: "BACK" | "LAY";
  liability?: number;
  min?: number;
  max?: number;
  step?: number;
}

const StakeInput = forwardRef<HTMLInputElement, StakeInputProps>(
  ({ side, liability, min, max, step, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <CurrencyInput
          ref={ref}
          label={side === "LAY" ? "Liability" : "Stake"}
          min={min}
          max={max}
          step={step}
          {...props}
        />
        {side === "LAY" && liability !== undefined && (
          <div className="text-xs text-slate-500">
            Potential profit: <span className="font-medium">₹{(liability * 0.95).toFixed(2)}</span> (5% commission)
          </div>
        )}
        {side === "BACK" && props.value && typeof props.value === "number" && (
          <div className="text-xs text-slate-500">
            Potential profit: <span className="font-medium">₹{((props.value as number) * 0.95).toFixed(2)}</span> (5% commission)
          </div>
        )}
      </div>
    );
  }
);

StakeInput.displayName = "StakeInput";

export { Input, CurrencyInput, OddsInput, StakeInput };