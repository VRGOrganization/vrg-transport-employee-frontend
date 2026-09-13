import { http } from "./http";
import type { PhotoType } from "@/types/cards.types";

export interface ImageResponse {
  _id: string | null;
  studentId: string;
  photoType: PhotoType;
  photo3x4: string | null;
  documentImage: string | null;
  studentCard: string | null;
  active: boolean;
  licenseRequestId: string | null;
}

export const imageService = {
  getByStudent: (studentId: string) =>
    http.get<ImageResponse[]>(`/image/student/${studentId}`),
};
