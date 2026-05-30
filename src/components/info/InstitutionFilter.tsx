"use client";

const INSTITUTIONS = [
  "Todas as Instituições",
  "UNIFLU",
  "UFF",
  "IFF",
  "UENF",
  "ISECENSA",
  "FABERJ",
  "FMC",
  "ITCSAS/CENSA",
  "UCAM",


];

interface InstitutionFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function InstitutionFilter({ value, onChange }: InstitutionFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-primary uppercase tracking-widest ml-1">
        Instituição de Ensino
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-surface-container-lowest border border-on-surface-variant shadow-sm px-4 py-2.5 pr-10 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-primary cursor-pointer w-56 outline-none"
        >
          {INSTITUTIONS.map((inst) => (
            <option key={inst} value={inst}>
              {inst}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined text-xl absolute right-3 top-2.5 text-primary pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  );
}