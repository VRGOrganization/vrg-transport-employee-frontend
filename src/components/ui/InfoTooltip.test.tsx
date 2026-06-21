import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InfoTooltip } from "./InfoTooltip";

const CONTENT = "Vagas em vaga-dia: 1 vaga de ônibus equivale a 5 (segunda a sexta). O total é a soma das vagas dos ônibus ativos × 5.";

describe("InfoTooltip", () => {
  it("tooltip is hidden by default", () => {
    render(<InfoTooltip content={CONTENT} />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("opens on click", () => {
    render(<InfoTooltip content={CONTENT} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent(CONTENT);
  });

  it("opens on focus", () => {
    render(<InfoTooltip content={CONTENT} />);
    fireEvent.focus(screen.getByRole("button"));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("closes on Escape keydown", () => {
    render(<InfoTooltip content={CONTENT} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("has role=tooltip on content element", () => {
    render(<InfoTooltip content={CONTENT} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("aria-describedby on button points to tooltip id when open", () => {
    render(<InfoTooltip content={CONTENT} />);
    fireEvent.click(screen.getByRole("button"));
    const button = screen.getByRole("button");
    const tooltip = screen.getByRole("tooltip");
    expect(button).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("aria-describedby absent when closed", () => {
    render(<InfoTooltip content={CONTENT} />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-describedby");
  });

  it("closes on blur", () => {
    render(<InfoTooltip content={CONTENT} />);
    const button = screen.getByRole("button");
    fireEvent.focus(button);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.blur(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("uses provided ariaLabel on the button", () => {
    render(<InfoTooltip content={CONTENT} ariaLabel="O que é vaga-dia?" />);
    expect(screen.getByRole("button", { name: "O que é vaga-dia?" })).toBeInTheDocument();
  });
});
