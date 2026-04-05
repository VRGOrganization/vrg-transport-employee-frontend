import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { InputHTMLAttributes, ReactNode, forwardRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightElement, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === "password" && showPassword ? "text" : type;

    const renderIcon = () => {
      if (!icon) return null;
      if (typeof icon === "string") {
        return <span className="material-symbols-outlined text-2xl">{icon}</span>;
      }
      return <span className="inline-flex items-center justify-center">{icon}</span>;
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
              {renderIcon()}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary rounded-xl text-on-surface placeholder:text-outline/50 transition-all outline-none",
              "h-14 text-base", // Altura fixa e fonte maior
              icon ? "pl-12" : "pl-4",
              (rightElement || type === "password") && "pr-12",
              error && "ring-error focus:ring-error",
              className
            )}
            {...props}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-outline hover:text-on-surface transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
          {rightElement && (
            <div className="absolute inset-y-0 right-4 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-error mt-1 ml-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";