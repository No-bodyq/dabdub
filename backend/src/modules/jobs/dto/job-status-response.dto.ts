export interface JobStatusResponseDto {
  jobId: string;
  queue: string;
  jobName: string;
  status: string;
  progress: number;
  attemptsMade: number;
  data: Record<string, unknown>;
  result: unknown;
  failedReason: string | null;
  createdAt: string;
  processedAt: string | null;
  finishedAt: string | null;
}
