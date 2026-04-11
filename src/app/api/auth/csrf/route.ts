import { NextResponse } from "next/server";

import { getCsrfHeaderName, setCsrfCookie } from "@/lib/server/csrf";

export async function GET() {
  const csrfToken = await setCsrfCookie();

  return NextResponse.json(
    {
      ok: true,
      csrfToken,
      csrfHeaderName: getCsrfHeaderName(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
