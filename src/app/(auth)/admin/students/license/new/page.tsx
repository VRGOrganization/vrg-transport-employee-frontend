"use client";

import { Suspense } from "react";
import { AdminLicenseRequestPage } from "@/components/students/AdminLicenseRequestPage";

export default function AdminStudentLicenseNewPage() {
  return (
    <Suspense fallback={null}>
      <AdminLicenseRequestPage role="admin" />
    </Suspense>
  );
}
