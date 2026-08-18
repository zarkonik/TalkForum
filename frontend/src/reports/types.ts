export const REPORT_TARGET_TYPE = {
  POST: 0,
  COMMENT: 1,
  GROUP: 2,
} as const;

export const REPORT_STATUS = {
  PENDING: 0,
  RESOLVED: 1,
  DISMISSED: 2,
} as const;

export interface Report {
  id: string;
  targetType: number;
  targetId: string;
  targetPreview: string;
  reporterUserId: string;
  reporterDisplayName: string;
  reason: string | null;
  status: number;
  createdAt: string;
}
