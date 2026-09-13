import { describe, expect, it } from "vitest";
import {
  categorizeAction,
  actionLabel,
  eventCategory,
  roleLabel,
} from "./audit";

describe("categorizeAction", () => {
  it("falls back to Outro for student.* (category removed, no dedicated filter)", () => {
    expect(categorizeAction("student.ban").key).toBe("other");
    expect(categorizeAction("student.verify").key).toBe("other");
  });

  it("maps license.* and license_request.* to Carteirinha", () => {
    expect(categorizeAction("license.reject").key).toBe("license");
    expect(categorizeAction("license_request.approve").key).toBe("license");
  });

  it("maps auth-ish actions to Acesso", () => {
    expect(categorizeAction("admin.login").key).toBe("auth");
    expect(categorizeAction("logout").key).toBe("auth");
    expect(categorizeAction("password.reset").key).toBe("auth");
  });

  it("maps university/course to Instituição", () => {
    expect(categorizeAction("university.create").key).toBe("university");
    expect(categorizeAction("course.update").key).toBe("university");
  });

  it("maps enrollment actions to Inscrição", () => {
    expect(categorizeAction("enrollment_period.close").key).toBe("enrollment");
    expect(categorizeAction("enrollment_cycle.reset").key).toBe("enrollment");
  });

  it("falls back to 'other' for unknown actions", () => {
    expect(categorizeAction("totally.unknown").key).toBe("other");
  });

  it("gives every category a distinct color dot class", () => {
    const dots = new Set<string>();
    ["license.x", "admin.login", "employee.x", "university.x", "bus.x", "enrollment_period.x", "priority_rule.x"].forEach(
      (a) => dots.add(categorizeAction(a).dot),
    );
    expect(dots.size).toBeGreaterThanOrEqual(6);
  });
});

describe("roleLabel", () => {
  it("translates staff roles to PT-BR", () => {
    expect(roleLabel("admin")).toBe("Administrador");
    expect(roleLabel("employee")).toBe("Funcionário");
  });
  it("handles null/unknown gracefully, including 'student' (no dedicated label)", () => {
    expect(roleLabel(null)).toBe("-");
    expect(roleLabel("weird")).toBe("weird");
    expect(roleLabel("student")).toBe("student");
  });
});

describe("actionLabel", () => {
  it("returns a PT-BR label for known actions", () => {
    expect(actionLabel("university.create")).toBe("Criação de instituição");
  });

  it("humanizes student.* actions instead of showing a dedicated label (no more student.* labels)", () => {
    expect(actionLabel("student.ban")).toBe("Student ban");
  });

  it("maps the previously-raw actions flagged by the user", () => {
    expect(actionLabel("image.access")).toBe("Acesso a imagem");
    expect(actionLabel("bus.update_university_slots")).toBe(
      "Atualização de vagas por instituição",
    );
  });

  it("humanizes unknown actions instead of showing raw code", () => {
    const label = actionLabel("weird.action_thing");
    // sem ponto/underscore cru, capitalizado
    expect(label).toBe("Weird action thing");
    expect(label).not.toContain(".");
    expect(label).not.toContain("_");
  });

  it("never leaks raw dotted/underscored code for ANY backend action", () => {
    const backendActions = [
      "image.access",
      "bus.update_university_slots",
      "bus.release_slots_promote",
      "license.update_existing",
      "license_request.approve_reissue_batch",
      "priority_rule.evaluate",
      "sector_contact_info.update",
      "system_notice_template.update",
      "employee.create.password_reset_failed",
      "student.login.pending_reissue_otp",
      "register.student.conflict",
      "resend_verification_code",
      "some.brand_new_action",
    ];
    for (const a of backendActions) {
      const label = actionLabel(a);
      expect(label).not.toBe(a);
      expect(label).not.toMatch(/[._]/);
    }
  });

  it("translates enrollment job names to plain PT-BR (no underscores)", () => {
    const label = actionLabel("enrollment_cycle_reset_warning_job.run");
    expect(label).toBe("Aviso de reinício do ciclo de inscrição");
    expect(label).not.toContain("_");
  });
});

describe("eventCategory", () => {
  it("categorizes from an event's action", () => {
    expect(eventCategory({ action: "bus.create" }).key).toBe("bus");
  });
});
