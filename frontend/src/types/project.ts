export type ProjectStatus =
  | "uploaded"
  | "extracting_audio"
  | "transcribing"
  | "romanizing"
  | "generating_subtitles"
  | "completed"
  | "failed";

export interface SubtitleWord {
  start: number | null;
  end: number | null;
  word: string;
  probability: number | null;
}

export interface SubtitleSegment {
  id: string;

  start: number;
  end: number;

  original_text: string;
  roman_urdu_text: string;

  confidence: number;

  words: SubtitleWord[];
}

export interface TranscriptionProject {
  id: string;
  name: string;

  file_name: string;
  stored_file_name: string;

  media_type: string;
  file_size: number;

  status: ProjectStatus;
  progress: number;
  current_step: string;

  language: string;

  detected_language: string | null;
  language_probability: number | null;

  duration_seconds: number | null;

  transcript_text: string;
  roman_urdu_transcript: string;

  source_video_path: string;
  audio_path: string;

  srt_path: string;
  roman_srt_path: string;

  error_message: string | null;

  segments: SubtitleSegment[];

  created_at: string;
  updated_at: string;
}

export interface UploadProjectResponse {
  ok: boolean;
  message: string;
  project: TranscriptionProject;
}

export interface ProjectListResponse {
  ok: boolean;
  projects: TranscriptionProject[];
}