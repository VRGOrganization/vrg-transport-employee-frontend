import { NextRequest, NextResponse } from "next/server";

import { getBackendApiBaseUrl, getServiceSecret } from "@/lib/server/bff-auth";
import { getClientIp, forwardedFor } from "@/lib/server/client-ip";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/auth";

function isConnectivityError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  const message = (error.message ?? "").toLowerCase();
  if (!message.includes("fetch failed")) return false;
  const cause = error.cause as { code?: string; errors?: Array<{ code?: string }> } | undefined;
  const code = cause?.code?.toUpperCase();
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT") return true;
  if (Array.isArray(cause?.errors)) {
    return cause.errors.some((e) => {
      const c = e?.code?.toUpperCase();
      return c === "ECONNREFUSED" || c === "ETIMEDOUT";
    });
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);

    if (!checkRateLimit(`reset-password:${clientIp}`, 10, 3600_000)) {
      return NextResponse.json(
        { message: "Muitas tentativas. Tente novamente em 1 hora." },
        { status: 429 },
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const result = resetPasswordSchema.safeParse(rawBody);

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Dados inválidos.";
      const field = result.error.issues[0]?.path[0] as string | undefined;
      return NextResponse.json({ message, field }, { status: 400 });
    }

    const { token, password } = result.data;

    const backendRes = await fetch(
      `${getBackendApiBaseUrl()}/auth/employee/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-service-secret": getServiceSecret(),
          ...forwardedFor(clientIp),
        },
        body: JSON.stringify({ token, password }),
        cache: "no-store",
      },
    );

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Não foi possível redefinir a senha." },
        { status: backendRes.status },
      );
    }

    return NextResponse.json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    if (isConnectivityError(error)) {
      return NextResponse.json(
        { message: "Serviço temporariamente indisponível. Tente novamente em instantes." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { message: "Erro ao processar a solicitação. Tente novamente." },
      { status: 500 },
    );
  }
}
