"use client";

interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className = "w-80" }: SearchInputProps) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined text-base absolute left-3 top-1/2 -translate-y-1/2 leading-none inline-flex items-center justify-center text-on-surface-variant pointer-events-none">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-9 pl-9 pr-8 rounded-lg ring-1 ring-outline/40 bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary outline-none transition-all cursor-text ${className}`}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">close</span>
        </button>
      )}
    </div>
  );
}
