import { useCallback, useMemo, useState } from "react";
import { employeeApi } from "@/lib/employeeApi";
import {
  extractLicenseImage,
  normalizeMediaSource,
} from "@/lib/cardUtils";
import type {
  ImageRecord,
  LicenseApiResponse,
  LicenseRecord,
  LicenseRequestRecord,
  PhotoType,
  StudentRecord,
} from "@/types/cards.types";

interface UseStudentSelectionReturn {
  selected: StudentRecord | null;
  selectedImages: ImageRecord[];
  loadingSelected: boolean;
  approvedLicensePreview: string | null;
  currentLicense: LicenseRecord | null;
  currentLicenseRequest: LicenseRequestRecord | null;
  pendingImagesByType: Partial<Record<PhotoType, string>>;
  profileImage: string | null;
  enrollmentImage: string | null;
  scheduleImage: string | null;
  selectedLicensePreview: string | null;
  selectStudent: (student: StudentRecord) => Promise<void>;
  clearSelection: () => void;
}

export function useStudentSelection(
licenses: LicenseRecord[], 
licenseRequests: LicenseRequestRecord[], 

): UseStudentSelectionReturn {
  const [selected, setSelected] = useState<StudentRecord | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImageRecord[]>([]);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [approvedLicensePreview, setApprovedLicensePreview] = useState<string | null>(null);

  const currentLicense = useMemo(() => {
    if (!selected) return null;
    return licenses.find((l) => l.studentId === selected._id) ?? null;
  }, [licenses, selected]);

  const currentLicenseRequest = useMemo(() => {
    if (!selected) return null;
    return (
      licenseRequests
        .filter((r) => r.studentId === selected._id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ??
      null
    );
  }, [licenseRequests, selected]);

  const pendingImagesByType = useMemo<Partial<Record<PhotoType, string>>>(() => {
    if (
      currentLicenseRequest?.type !== "update" ||
      currentLicenseRequest?.status !== "pending"
    ) {
      return {};
    }
    return (currentLicenseRequest.pendingImages ?? []).reduce(
      (acc, item) => {
        const validTypes: PhotoType[] = [
          "ProfilePhoto",
          "EnrollmentProof",
          "CourseSchedule",
          "LicenseImage",
        ];
        if (validTypes.includes(item.photoType as PhotoType)) {
          acc[item.photoType as PhotoType] = item.dataUrl;
        }
        return acc;
      },
      {} as Partial<Record<PhotoType, string>>,
    );
  }, [currentLicenseRequest]);

  const profileImage = normalizeMediaSource(
    pendingImagesByType.ProfilePhoto ??
      selectedImages.find((img) => img.photoType === "ProfilePhoto")?.photo3x4 ??
      null,
  );

  const enrollmentImage = normalizeMediaSource(
    pendingImagesByType.EnrollmentProof ??
      selectedImages.find((img) => img.photoType === "EnrollmentProof")?.documentImage ??
      null,
  );

  const scheduleImage = normalizeMediaSource(
    pendingImagesByType.CourseSchedule ??
      selectedImages.find((img) => img.photoType === "CourseSchedule")?.documentImage ??
      null,
  );

  const licenseImageFromImages = normalizeMediaSource(
    selectedImages.find((img) => img.photoType === "LicenseImage")?.studentCard ?? null,
  );

  const selectedLicensePreview = useMemo(
    () =>
      approvedLicensePreview ??
      extractLicenseImage((currentLicense as unknown as LicenseApiResponse) ?? null) ??
      licenseImageFromImages,
    [approvedLicensePreview, currentLicense, licenseImageFromImages],
  );

  const selectStudent = useCallback(async (student: StudentRecord) => {
    setSelected(student);
    setSelectedImages([]);
    setApprovedLicensePreview(null);
    setLoadingSelected(true);
    try {
      const [images, license] = await Promise.all([
        employeeApi.get<ImageRecord[]>(`/image/student/${student._id}`),
        employeeApi
          .get<LicenseApiResponse>(`/license/searchByStudent/${student._id}`)
          .catch(() => null),
      ]);
      setSelectedImages(images);
      setApprovedLicensePreview(extractLicenseImage(license));
    } catch {
      setSelectedImages([]);
      setApprovedLicensePreview(null);
    } finally {
      setLoadingSelected(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setSelectedImages([]);
    setApprovedLicensePreview(null);
  }, []);

  return {
    selected,
    selectedImages,
    loadingSelected,
    approvedLicensePreview,
    currentLicense,
    currentLicenseRequest,
    pendingImagesByType,
    profileImage,
    enrollmentImage,
    scheduleImage,
    selectedLicensePreview,
    selectStudent,
    clearSelection,
  };
}