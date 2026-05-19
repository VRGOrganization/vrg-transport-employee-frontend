"use client";

import { ErrorPageContent } from "@/components/layout/ErrorPageContent";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPageContent onReset={reset} />;
}
