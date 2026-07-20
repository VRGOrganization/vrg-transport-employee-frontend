import { http } from "./http";

export interface SectorContactInfo {
  address: string;
}

export const sectorContactInfoService = {
  get: () => http.get<SectorContactInfo>("/sector-contact-info"),

  update: (address: string) =>
    http.patch<SectorContactInfo>("/sector-contact-info", { address }),
};
