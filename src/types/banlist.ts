export interface BanlistEntry {
  _id: string;
  email: string;
  name: string;
  socialName?: string | null;
  studentId: string;
  reasons: string[];
  bannedByAdminId: string;
  active: boolean;
  unbanReasons?: string[];
  unbannedByAdminId?: string;
  unbannedAt?: string;
  createdAt: string;
  updatedAt: string;
}
