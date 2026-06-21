"use client";

import { ErrorPageContent } from "@/components/layout/ErrorPageContent";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <ErrorPageContent onReset={reset} />
      </body>
    </html>
  );
}
