import { cn } from "@/lib/utils";
import { getInitials, deterministicAvatarColor } from "@/lib/utils/string";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-9 h-9 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-xl",
} as const;

export function Avatar({ name, size = "sm", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold flex-shrink-0",
        SIZE[size],
        deterministicAvatarColor(name),
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
