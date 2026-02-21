export type ExportResourceType =
  | 'transactions'
  | 'settlements'
  | 'merchants'
  | 'revenue'
  | 'audit';

export interface ExportJobPayload {
  jobId: string;
  adminId: string;
  resourceType: ExportResourceType;
  filters: Record<string, unknown>;
  format: 'csv' | 'xlsx';
  notificationEmail: string;
  correlationId?: string;
}
