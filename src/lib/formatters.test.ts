import { describe, expect, it } from "vitest";
import { digitsOnly, formatCpf, formatPhone } from "./formatters";

describe("digitsOnly", () => {
  it("strips non-digit characters", () => {
    expect(digitsOnly("(22) 99999-9999")).toBe("22999999999");
  });

  it("truncates to max when provided", () => {
    expect(digitsOnly("123456789012345", 11)).toBe("12345678901");
  });
});

describe("formatCpf", () => {
  it("formats a complete CPF", () => {
    expect(formatCpf("12345678909")).toBe("123.456.789-09");
  });

  it("progressively formats partial input", () => {
    expect(formatCpf("123")).toBe("123");
    expect(formatCpf("123456")).toBe("123.456");
    expect(formatCpf("123456789")).toBe("123.456.789");
  });
});

describe("formatPhone", () => {
  it("returns empty string for empty input", () => {
    expect(formatPhone("")).toBe("");
  });

  it("opens parenthesis while DDD is incomplete", () => {
    expect(formatPhone("2")).toBe("(2");
  });

  it("closes parenthesis right after the DDD (2 digits)", () => {
    expect(formatPhone("22")).toBe("(22)");
  });

  it("formats a full number as (DD)999999999 without space or hyphen", () => {
    expect(formatPhone("22997112261")).toBe("(22)997112261");
  });

  it("ignores non-digit characters in the input", () => {
    expect(formatPhone("(22) 99711-2261")).toBe("(22)997112261");
  });

  it("truncates to 11 digits, ignoring excess input", () => {
    expect(formatPhone("2299711226111111111111")).toBe("(22)997112261");
  });
});
