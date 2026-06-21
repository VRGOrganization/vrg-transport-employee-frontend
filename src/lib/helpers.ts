// src/lib/helpers.ts
// Utilitários compartilhados — fonte única de verdade para helpers de UI.
// Os utilitários de string e data vivem em lib/utils/ e são re-exportados aqui
// para que código novo possa usar um único ponto de importação estável.

export { getInitials, deterministicAvatarColor } from "@/lib/utils/string";
export { formatDateBR, formatDateTimeBR, formatDateLongBR, getGreeting } from "@/lib/utils/date";

/**
 * Paleta canônica de cores para avatares gerados dinamicamente.
 * Usa tokens do design system (CSS vars via Tailwind) para suporte a dark mode.
 * Uso: avatarColors[index % avatarColors.length]
 */
export const avatarColors: string[] = [
  "bg-primary/15 text-primary",
  "bg-secondary/15 text-secondary",
  "bg-tertiary/15 text-tertiary",
  "bg-success/15 text-success",
  "bg-warning/15 text-on-warning",
];
