import { NextRequest, NextResponse } from "next/server";

import { getBackendApiBaseUrl, getServiceSecret } from "@/lib/server/bff-auth";
import { getClientIp, forwardedFor } from "@/lib/server/client-ip";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/auth";

const SAFE_RESPONSE = {
  message: "Se o email estiver cadastrado, você receberá um link de recuperação em breve.",
};

const RATE_LIMITED_FALLBACK = "Muitas tentativas. Tente novamente mais tarde.";

// Teto anti-flood, não limite por pessoa: este balde é por IP, e uma rede
// compartilhada junta muita gente num endereço só. Se ele ficar apertado,
// uma pessoa bloqueia as outras antes mesmo de o backend ser chamado. Quem
// de fato limita é o balde por e-mail do backend, que é por pessoa.
const IP_FLOOD_POINTS = 100;
const IP_FLOOD_WINDOW_MS = 3_600_000;

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

    if (!checkRateLimit(`forgot-password:${clientIp}`, IP_FLOOD_POINTS, IP_FLOOD_WINDOW_MS)) {
      return NextResponse.json(
        { message: "Muitas tentativas. Tente novamente mais tarde." },
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

    const upstream = await fetch(`${getBackendApiBaseUrl()}/auth/employee/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-secret": getServiceSecret(),
        ...forwardedFor(clientIp),
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    // 429 é o único status que vaza. Ele não diz se a conta existe (o balde
    // é consumido antes de qualquer consulta ao banco), e esconder isso só
    // fazia o modal mentir "Email enviado!" quando nada foi despachado.
    if (upstream.status === 429) {
      const payload = (await upstream.json().catch(() => ({}))) as {
        message?: string;
      };
      const responseHeaders = new Headers();
      const retryAfter = upstream.headers.get("retry-after");
      if (retryAfter) responseHeaders.set("Retry-After", retryAfter);

      return NextResponse.json(
        {
          message:
            typeof payload?.message === "string"
              ? payload.message
              : RATE_LIMITED_FALLBACK,
        },
        { status: 429, headers: responseHeaders },
      );
    }

    // Demais erros seguem mascarados para não permitir enumeração de emails.
    // Mascarar a resposta, porém, não é motivo pra sumir com o erro do log.
    if (!upstream.ok) {
      console.error(
        `[BFF][auth/forgot-password] upstream respondeu ${upstream.status}`,
      );
    }

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
