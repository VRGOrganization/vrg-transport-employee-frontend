import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/auth/session", () => {
    return HttpResponse.json({ message: "Sessao nao encontrada." }, { status: 401 });
  }),
];
