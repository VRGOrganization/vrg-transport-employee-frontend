"use client";

import { Suspense } from "react";
import { AdminLicenseRequestPage } from "@/components/students/AdminLicenseRequestPage";

export default function EmployeeStudentLicenseNewPage() {
  return (
    <Suspense fallback={null}>
      <AdminLicenseRequestPage role="employee" />
    </Suspense>
  );
}
