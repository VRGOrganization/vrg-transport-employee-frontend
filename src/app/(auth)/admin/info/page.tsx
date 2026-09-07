"use client";

import { Suspense } from "react";
import { ControlRoomPage } from "@/components/info/ControlRoomPage";
import { ControlRoomSkeleton } from "@/components/info/ControlRoomSkeleton";

export default function AdminInfoPage() {
  // A lente vive na URL (useSearchParams), então a página precisa de um limite
  // de Suspense para o Next conseguir renderizar o esqueleto no servidor.
  return (
    <Suspense fallback={<ControlRoomSkeleton />}>
      <ControlRoomPage />
    </Suspense>
  );
}
