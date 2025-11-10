export interface DashboardStats {
  totalForms: number;
  totalLand: number;
  totalBuilding: number;
  totalMachinery: number;
  totalUsers: number;
  activeUsers: number;
}

export interface KindData {
  kind_id: number;
  count: number;
  percentage: number;
}

export interface ClassificationData {
  class_id: string;
  count: number;
  percentage: number;
}

export interface AdminActivityData {
  date: string;
  loginCount: number;
  systemActionCount: number;
}

export interface UserActivityData {
  date: string;
  loginCount: number;
}

export interface FormSubmissionData {
  date: string;
  totalCount: number;
  landCount: number;
  buildingCount: number;
  machineryCount: number;
}

export interface FormReviewData {
  date: string;
  reviewCount: number;
}

export type ViewType = 'overview' | 'kinds' | 'land' | 'building' | 'machinery';
export type TimeRangeType = '7days' | '30days';