import { NextRequest, NextResponse } from "next/server";

import { getBackendApiBaseUrl, getServiceSecret } from "@/lib/server/bff-auth";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/auth";

const SAFE_RESPONSE = {
  message: "Se o email estiver cadastrado, você receberá um link de recuperação em breve.",
};

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
    const xff = request.headers.get("x-forwarded-for") ?? "";
    const clientIp = xff.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(`forgot-password:${clientIp}`, 5, 900_000)) {
      return NextResponse.json(
        { message: "Muitas tentativas. Tente novamente em 15 minutos." },
        { status: 429 },
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const result = forgotPasswordSchema.safeParse(rawBody);

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Email inválido.";
      return NextResponse.json({ message }, { status: 400 });
    }

    const { email } = result.data;

    await fetch(`${getBackendApiBaseUrl()}/auth/employee/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-secret": getServiceSecret(),
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    // Sempre retorna 200 independente do resultado — previne enumeração de emails
    return NextResponse.json(SAFE_RESPONSE);
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
