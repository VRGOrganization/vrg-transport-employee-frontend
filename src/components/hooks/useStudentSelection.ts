import { useCallback, useMemo, useState } from "react";
import { employeeApi } from "@/lib/employeeApi";
import {
  extractLicenseImage,
  normalizeMediaSource,
} from "@/lib/cardUtils";
import type {
  ImageRecord,
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
  const [selectedRequestDetails, setSelectedRequestDetails] =
    useState<LicenseRequestRecord | null>(null);

  const currentLicense = useMemo(() => {
    if (!selected) return null;
    return licenses.find((l) => l.studentId === selected._id) ?? null;
  }, [licenses, selected]);

  const latestRequestFromList = useMemo(() => {
    if (!selected) return null;
    return (
      licenseRequests
        .filter((r) => r.studentId === selected._id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ??
      null
    );
  }, [licenseRequests, selected]);

  const currentLicenseRequest = useMemo(() => {
    if (!selected) return null;
    if (selectedRequestDetails?.studentId === selected._id) {
      return selectedRequestDetails;
    }
    return latestRequestFromList;
  }, [selected, selectedRequestDetails, latestRequestFromList]);

  const pendingImagesByType = useMemo<Partial<Record<PhotoType, string>>>(() => {
    if (!currentLicenseRequest) {
      return {};
    }

    const parsePhotoType = (raw: string): PhotoType | null => {
      const normalized = raw.trim().toLowerCase();
      if (normalized === "profilephoto") return "ProfilePhoto";
      if (normalized === "enrollmentproof") return "EnrollmentProof";
      if (normalized === "courseschedule") return "CourseSchedule";
      if (normalized === "licenseimage") return "LicenseImage";
      return null;
    };

    return (currentLicenseRequest.pendingImages ?? []).reduce(
      (acc, item) => {
        const parsed = parsePhotoType(item.photoType);
        if (parsed && item.dataUrl) {
          acc[parsed] = item.dataUrl;
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

  const pendingLicensePreview = normalizeMediaSource(
    pendingImagesByType.LicenseImage ?? null,
  );

  const selectedLicensePreview = useMemo(
    () =>
      approvedLicensePreview ??
      extractLicenseImage(currentLicense ?? null) ??
      pendingLicensePreview ??
      licenseImageFromImages,
    [approvedLicensePreview, currentLicense, pendingLicensePreview, licenseImageFromImages],
  );

  const selectStudent = useCallback(async (student: StudentRecord) => {
    setSelected(student);
    setSelectedImages([]);
    setApprovedLicensePreview(null);
    setSelectedRequestDetails(null);
    setLoadingSelected(true);
    try {
      const [images, requestsByStudent] = await Promise.all([
        employeeApi.get<ImageRecord[]>(`/image/student/${student._id}`),
        employeeApi
          .get<LicenseRequestRecord[]>(`/license-request/student/${student._id}`)
          .catch(() => []),
      ]);

      const selectedLicense =
        licenses.find((license) => license.studentId === student._id) ?? null;

      const latestDetailedRequest =
        requestsByStudent
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ??
        null;

      setSelectedImages(images);
      setApprovedLicensePreview(extractLicenseImage(selectedLicense));
      setSelectedRequestDetails(latestDetailedRequest);
    } catch {
      setSelectedImages([]);
      setApprovedLicensePreview(null);
      setSelectedRequestDetails(null);
    } finally {
      setLoadingSelected(false);
    }
  }, [licenses]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setSelectedImages([]);
    setApprovedLicensePreview(null);
    setSelectedRequestDetails(null);
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