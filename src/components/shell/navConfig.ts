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
  { icon: Bell,              label: "Avisos",                href: "/admin/notices"            },
  { icon: MessageSquareText, label: "Mensagens de sistema",  href: "/admin/system-notice-templates" },
  { icon: SlidersHorizontal, label: "Prioridades",           href: "/admin/priority-rules"     },
];

export const EMPLOYEE_NAV_ITEMS: readonly NavItem[] = [
  { icon: LayoutDashboard, label: "Painel do Funcionário",  href: "/employee/dashboard" },
  { icon: GraduationCap,   label: "Gerenciar Estudantes",   href: "/employee/students"  },
  { icon: IdCard,          label: "Gerenciar Carteirinhas", href: "/employee/cards"     },
  { icon: Bell,            label: "Avisos",                 href: "/employee/notices"   },
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
