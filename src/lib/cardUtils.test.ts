import { afterEach, describe, expect, it, vi } from "vitest";
import {
  downloadMedia,
  isPdfDataUrl,
  isRemoteMediaSource,
  normalizeMediaSource,
  resolveToDataUrl,
} from "./cardUtils";

const BASE64_JPEG = "/9j/4AAQSkZJRg=="; // legado: base64 cru (sem prefixo)
const PRESIGNED_URL = "https://bucket.s3.amazonaws.com/cards/abc.jpg?X-Amz-Signature=xyz";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("normalizeMediaSource", () => {
  it("retorna a presigned URL https intacta (regressão)", () => {
    expect(normalizeMediaSource(PRESIGNED_URL)).toBe(PRESIGNED_URL);
  });

  it("prefixa base64 legado com data URL", () => {
    expect(normalizeMediaSource(BASE64_JPEG)).toBe(`data:image/jpeg;base64,${BASE64_JPEG}`);
  });
});

describe("isPdfDataUrl", () => {
  it("detecta PDF por data:application/pdf", () => {
    expect(isPdfDataUrl("data:application/pdf;base64,JVBERi0=")).toBe(true);
  });

  it("detecta PDF por URL terminando em .pdf", () => {
    expect(isPdfDataUrl("https://bucket.s3.amazonaws.com/docs/file.pdf?X-Amz-Signature=xyz")).toBe(true);
  });

  it("retorna false para URL de imagem", () => {
    expect(isPdfDataUrl(PRESIGNED_URL)).toBe(false);
  });
});

describe("isRemoteMediaSource", () => {
  it("true para http/https/blob, false para base64/data", () => {
    expect(isRemoteMediaSource(PRESIGNED_URL)).toBe(true);
    expect(isRemoteMediaSource("blob:https://x/abc")).toBe(true);
    expect(isRemoteMediaSource(BASE64_JPEG)).toBe(false);
    expect(isRemoteMediaSource("data:image/png;base64,iVBOR")).toBe(false);
    expect(isRemoteMediaSource(null)).toBe(false);
  });
});

describe("resolveToDataUrl", () => {
  it("base64 legado: NÃO chama fetch, devolve data URL", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await resolveToDataUrl(BASE64_JPEG);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toBe(`data:image/jpeg;base64,${BASE64_JPEG}`);
  });

  it("presigned URL: busca bytes via fetch e converte para data URL", async () => {
    const blob = new Blob(["png-bytes"], { type: "image/png" });
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await resolveToDataUrl(PRESIGNED_URL);

    expect(fetchSpy).toHaveBeenCalledWith(PRESIGNED_URL);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});

describe("downloadMedia", () => {
  it("base64/data URL legado: usa href direto, sem fetch nem objectURL", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const createObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await downloadMedia(BASE64_JPEG, "carteirinha.jpg");

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("presigned URL: busca via fetch, gera objectURL e dispara download", async () => {
    const blob = new Blob(["bytes"], { type: "image/jpeg" });
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob });
    vi.stubGlobal("fetch", fetchSpy);
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await downloadMedia(PRESIGNED_URL, "carteirinha.jpg");

    expect(fetchSpy).toHaveBeenCalledWith(PRESIGNED_URL);
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
