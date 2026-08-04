import type {
  ProjectListResponse,
  TranscriptionProject,
  UploadProjectResponse,
} from "../types/project";

import { apiClient } from "./apiClient";

interface UploadProjectInput {
  file: File;
  name?: string;
  language?: string;
  onProgress?: (progress: number) => void;
}

export async function uploadProject({
  file,
  name,
  language = "ur",
  onProgress,
}: UploadProjectInput): Promise<UploadProjectResponse> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("name", name?.trim() || file.name);
  formData.append("language", language);

  const response =
    await apiClient.post<UploadProjectResponse>(
      "/projects/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },

        onUploadProgress: (event) => {
          if (!event.total || !onProgress) {
            return;
          }

          const progress = Math.round(
            (event.loaded / event.total) * 100,
          );

          onProgress(progress);
        },
      },
    );

  return response.data;
}

export async function getProject(
  projectId: string,
): Promise<TranscriptionProject> {
  const response =
    await apiClient.get<TranscriptionProject>(
      `/projects/${projectId}`,
    );

  return response.data;
}

export async function getProjects():
Promise<TranscriptionProject[]> {
  const response =
    await apiClient.get<ProjectListResponse>(
      "/projects",
    );

  return response.data.projects;
}

function getApiBaseUrl(): string {
  const baseUrl =
    apiClient.defaults.baseURL ??
    "http://127.0.0.1:8000/api";

  return baseUrl.replace(/\/$/, "");
}

export function getRomanUrduSrtUrl(
  projectId: string,
): string {
  return (
    `${getApiBaseUrl()}/projects/` +
    `${projectId}/download/roman-urdu-srt`
  );
}

export function getPrimarySrtUrl(
  projectId: string,
): string {
  return (
    `${getApiBaseUrl()}/projects/` +
    `${projectId}/download/srt`
  );
}