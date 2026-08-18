export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  isPlatformAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
}

export interface AdminGroup {
  id: string;
  name: string;
  categoryName: string;
  ownerDisplayName: string;
  memberCount: number;
  createdAt: string;
}
