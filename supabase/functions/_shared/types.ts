export type ProcessingStatus = "success" | "failed" | "partial";

export interface ProcessingResult {
  status: ProcessingStatus;
  visitId?: string;
  warnings: string[];
  error?: string;
}

export interface KoboPayload {
  _uuid?: string;
  outreach_date?: string;
  outreach_type?: string;
  data_capturer?: string;
  // etc.
  [key: string]: unknown; // allows arbitrary Kobo fields
}