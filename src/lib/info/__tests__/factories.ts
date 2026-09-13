import type { AllocationEntry, LicenseRequestRecord } from "@/types/cards.types";
import type { Student } from "@/types/student";
import type { Bus, Course, University } from "@/types/university.types";

const NOW = "2026-03-01T12:00:00.000Z";

export function alloc(over: Partial<AllocationEntry> = {}): AllocationEntry {
  return {
    day: "SEG",
    period: "Manhã",
    busIdentifier: "Ônibus 01",
    busId: "bus-1",
    status: "active",
    needsOutbound: true,
    needsReturn: true,
    ...over,
  };
}

export function request(
  over: Partial<LicenseRequestRecord> = {},
): LicenseRequestRecord {
  return {
    _id: "req-1",
    studentId: "stu-1",
    type: "initial",
    changedDocuments: [],
    status: "approved",
    rejectionReason: null,
    rejectedAt: null,
    licenseId: "lic-1",
    enrollmentCycleId: "cycle-1",
    universityId: "uni-1",
    allocationSummary: [alloc()],
    createdAt: NOW,
    ...over,
  };
}

export function student(over: Partial<Student> = {}): Student {
  return {
    _id: "stu-1",
    name: "Aluno Um",
    email: "um@example.com",
    telephone: "22999999999",
    degree: "Engenharia de Produção",
    shift: "Manhã",
    universityId: "uni-1",
    status: "ACTIVE",
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}

export function bus(over: Partial<Bus> = {}): Bus {
  return {
    _id: "bus-1",
    identifier: "Ônibus 01",
    capacity: 40,
    shift: "Manhã",
    active: true,
    universitySlots: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}

export function university(over: Partial<University> = {}): University {
  return {
    _id: "uni-1",
    name: "Universidade Alpha",
    acronym: "UA",
    address: "Rua A",
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}

export function course(over: Partial<Course> = {}): Course {
  return {
    _id: "course-1",
    name: "Engenharia de Produção",
    universityId: "uni-1",
    model: "Bacharel",
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}
