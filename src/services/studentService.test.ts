import { beforeEach, describe, expect, it, vi } from "vitest";

import { http } from "./http";
import { studentService } from "./studentService";

vi.mock("./http", () => ({
  http: {
    get: vi.fn(),
    patch: vi.fn(),
    postForm: vi.fn(),
  },
}));

const postFormMock = vi.mocked(http.postForm);

describe("studentService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Regressão: POST /student sempre exige multipart no backend (FileFieldsInterceptor
  // incondicional). Enviar JSON faz o corpo chegar vazio na validação — por isso o
  // create() precisa sempre montar FormData, mesmo sem nenhum documento/flag.
  it("always sends multipart/FormData, even without documents or flags", async () => {
    postFormMock.mockResolvedValueOnce({ _id: "s1" });

    await studentService.create({
      name: "Joao Silva",
      email: "joao@email.com",
      telephone: "22997112261",
      cpf: "12345678909",
    });

    expect(postFormMock).toHaveBeenCalledTimes(1);
    const [path, form] = postFormMock.mock.calls[0];
    expect(path).toBe("/student");
    expect(form).toBeInstanceOf(FormData);
    const fd = form as FormData;
    expect(fd.get("name")).toBe("Joao Silva");
    expect(fd.get("email")).toBe("joao@email.com");
    expect(fd.get("telephone")).toBe("22997112261");
    expect(fd.get("cpf")).toBe("12345678909");
  });

  it("includes boolean flags and files when provided", async () => {
    postFormMock.mockResolvedValueOnce({ _id: "s1" });
    const file = new File(["x"], "id.png", { type: "image/png" });

    await studentService.create({
      name: "Joao Silva",
      email: "joao@email.com",
      telephone: "22997112261",
      cpf: "12345678909",
      alreadyUsesTransport: true,
      hasDisability: false,
      governmentIdFile: file,
    });

    const [, form] = postFormMock.mock.calls[0];
    const fd = form as FormData;
    expect(fd.get("alreadyUsesTransport")).toBe("true");
    expect(fd.get("hasDisability")).toBe("false");
    expect(fd.get("governmentIdFile")).toBeInstanceOf(File);
  });
});
