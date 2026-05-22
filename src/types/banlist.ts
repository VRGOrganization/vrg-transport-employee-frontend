export interface BanlistEntry {
  _id: string;
  email: string;
  name: string;
  studentId?: string;
  reasons: string[];
  bannedByAdminId: string;
  active: boolean;
  unbanReasons?: string[];
  unbannedByAdminId?: string;
  unbannedAt?: string;
  createdAt: string;
  updatedAt: string;
}
