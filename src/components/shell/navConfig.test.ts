import { describe, expect, it } from "vitest";
import { ADMIN_NAV_ITEMS, EMPLOYEE_NAV_ITEMS } from "./navConfig";

describe("navConfig notices", () => {
  it("inclui Avisos na navegação admin", () => {
    expect(ADMIN_NAV_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Avisos", href: "/admin/notices" }),
      ]),
    );
  });

  it("inclui Avisos na navegação employee", () => {
    expect(EMPLOYEE_NAV_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Avisos", href: "/employee/notices" }),
      ]),
    );
  });
});

describe("navConfig employee", () => {
  it.each([
    ["Mensagens de sistema", "/employee/system-notice-templates"],
    ["Passes de ônibus", "/employee/bus-pass"],
  ])("inclui %s na navegação employee", (label, href) => {
    expect(EMPLOYEE_NAV_ITEMS).toEqual(
      expect.arrayContaining([expect.objectContaining({ label, href })]),
    );
  });

  it("não inclui Frota na navegação employee", () => {
    expect(EMPLOYEE_NAV_ITEMS).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Frota" }),
      ]),
    );
  });
});
