"use client";

import { DayPicker } from "react-day-picker";
import type { ComponentProps } from "react";
import { ptBR } from "react-day-picker/locale";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";

export type { DateRange } from "react-day-picker";

type CalendarProps = ComponentProps<typeof DayPicker>;

/**
 * Calendário reutilizável (wrapper do react-day-picker v9).
 * Inline e sempre aberto, com visual estilo shadcn aplicado via a classe
 * `.vrg-calendar` em globals.css usando os design tokens do projeto.
 * Locale pt-BR por padrão; aceita override por prop.
 */
export function Calendar({ className, locale = ptBR, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("vrg-calendar", className)}
      locale={locale}
      {...props}
    />
  );
}
