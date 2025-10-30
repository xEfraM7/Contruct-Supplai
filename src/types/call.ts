export interface Call {
  id: string;
  call_id: string;
  from_number: string;
  to_number: string;
  call_status: string;
  direction: string | null;
  duration_ms: number | null;
  transcript: string | null;
  call_summary: string | null;
  user_sentiment: string | null;
  call_successful: boolean | null;
  recording_url: string | null;
  start_timestamp: number | null;
  end_timestamp: number | null;
  disconnection_reason: string | null;
  created_at: string;
}
