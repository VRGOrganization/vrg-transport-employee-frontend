import type { PhotoType } from "@/types/cards.types";

export type AllPhotoType = PhotoType;

export type UpdatablePhotoType = Exclude<PhotoType, "LicenseImage">;
