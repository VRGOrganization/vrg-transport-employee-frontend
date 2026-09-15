import {
  LayoutDashboard,
  Info,
  Bell,
  CalendarDays,
  Users,
  GraduationCap,
  IdCard,
  Building2,
  Bus,
  User,
  SlidersHorizontal,
  MessageSquareText,
  ScrollText,
  TicketCheck,
} from "lucide-react";
import type { NavItem, SideNavBrand } from "./SideNav";

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { icon: LayoutDashboard,   label: "Painel",               href: "/admin/dashboard"          },
  { icon: Info,              label: "Informações",           href: "/admin/info"               },
  { icon: Users,             label: "Funcionários",          href: "/admin/employees"          },
  { icon: GraduationCap,     label: "Estudantes",            href: "/admin/students"           },
  { icon: Building2,         label: "Instituições",          href: "/admin/universities"       },
  { icon: Bus,               label: "Frota",                 href: "/admin/buses"              },
  { icon: CalendarDays,      label: "Período de Inscrição",  href: "/admin/enrollment-period"  },
  { icon: IdCard,            label: "Carteirinhas",          href: "/admin/cards"              },
  { icon: TicketCheck,       label: "Passes de ônibus",      href: "/admin/bus-pass"           },
  { icon: Bell,              label: "Avisos",                href: "/admin/notices"            },
  { icon: MessageSquareText, label: "Mensagens de sistema",  href: "/admin/system-notice-templates" },
  { icon: SlidersHorizontal, label: "Prioridades",           href: "/admin/priority-rules"     },
  { icon: ScrollText,        label: "Auditoria",             href: "/admin/audit"              },
];

export const EMPLOYEE_NAV_ITEMS: readonly NavItem[] = [
  { icon: LayoutDashboard, label: "Painel do Funcionário",  href: "/employee/dashboard"    },
  { icon: GraduationCap,   label: "Gerenciar Estudantes",   href: "/employee/students"     },
  { icon: Building2,       label: "Instituições",           href: "/employee/universities" },
  { icon: Bus,             label: "Frota",                  href: "/employee/buses"        },
  { icon: IdCard,          label: "Gerenciar Carteirinhas", href: "/employee/cards"        },
  { icon: TicketCheck,     label: "Passes de ônibus",       href: "/employee/bus-pass"     },
  { icon: Bell,            label: "Avisos",                 href: "/employee/notices"      },
  { icon: MessageSquareText, label: "Mensagens de sistema", href: "/employee/system-notice-templates" },
];

export const ADMIN_BRAND: SideNavBrand = {
  icon: Bus,
  title: "Transporte",
  subtitle: "São Fidélis · RJ",
};

export const EMPLOYEE_BRAND: SideNavBrand = {
  icon: User,
  title: "Área do Funcionário",
  subtitle: "São Fidélis - RJ",
};
