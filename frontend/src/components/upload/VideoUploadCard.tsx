import {
  AlertCircle,
  CheckCircle2,
  FileVideo2,
  LoaderCircle,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useDropzone,
} from "react-dropzone";

import {
  useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import {
  getProject,
  uploadProject,
} from "../../services/projectService";

import type {
  TranscriptionProject,
} from "../../types/project";

import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";


const MAX_FILE_SIZE =
  2 * 1024 * 1024 * 1024;

const POLL_INTERVAL_MS = 2000;


interface VideoUploadCardProps {
  variant?: "light" | "dark";
  className?: string;
}


function formatFileSize(
  sizeInBytes: number,
): string {
  if (sizeInBytes < 1024 * 1024) {
    return `${(
      sizeInBytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    sizeInBytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}


export function VideoUploadCard({
  variant = "light",
  className,
}: VideoUploadCardProps) {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [project, setProject] =
    useState<TranscriptionProject | null>(
      null,
    );

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [isUploading, setIsUploading] =
    useState(false);

  const pollingRef =
    useRef<number | null>(null);


  const isDark =
    variant === "dark";


  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      window.clearInterval(
        pollingRef.current,
      );

      pollingRef.current = null;
    }
  }, []);


  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);


  const resetSelection =
    useCallback(() => {
      stopPolling();

      setSelectedFile(null);
      setProject(null);
      setUploadProgress(0);
      setIsUploading(false);
    }, [stopPolling]);


  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (!file) {
        return;
      }

      stopPolling();

      setProject(null);
      setUploadProgress(0);
      setSelectedFile(file);
    },
    [stopPolling],
  );


  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open,
  } = useDropzone({
    onDrop,
    noClick: true,
    multiple: false,
    maxSize: MAX_FILE_SIZE,

    accept: {
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-matroska": [".mkv"],
      "video/webm": [".webm"],
      "video/x-msvideo": [".avi"],
      "video/x-m4v": [".m4v"],
    },

    onDropRejected: (rejections) => {
      const firstError =
        rejections[0]?.errors[0];

      toast.error(
        firstError?.message ??
          "Selected video format is not supported.",
      );
    },
  });


  const startPolling = useCallback(
    (projectId: string) => {
      stopPolling();

      pollingRef.current =
        window.setInterval(
          async () => {
            try {
              const latestProject =
                await getProject(projectId);

              setProject(latestProject);

              if (
                latestProject.status ===
                "completed"
              ) {
                stopPolling();

                toast.success(
                  "Roman Urdu subtitles completed.",
                );

                navigate(
                  `/projects/${projectId}`,
                );
              }

              if (
                latestProject.status ===
                "failed"
              ) {
                stopPolling();

                toast.error(
                  latestProject.error_message ??
                    "Video processing failed.",
                );
              }
            } catch (error) {
              console.error(
                "Project polling failed:",
                error,
              );

              stopPolling();

              toast.error(
                "Unable to read processing status.",
              );
            }
          },
          POLL_INTERVAL_MS,
        );
    },
    [
      navigate,
      stopPolling,
    ],
  );


  const handleStartTranscription =
    async () => {
      if (!selectedFile) {
        toast.error(
          "Please select a video first.",
        );

        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setProject(null);

      try {
        const response =
          await uploadProject({
            file: selectedFile,
            name: selectedFile.name,
            language: "ur",

            onProgress: (progress) => {
              setUploadProgress(progress);
            },
          });

        setProject(response.project);

        toast.success(
          "Video uploaded successfully.",
        );

        startPolling(
          response.project.id,
        );
      } catch (error) {
        console.error(
          "Video upload failed:",
          error,
        );

        toast.error(
          "Video upload failed. Backend verify karein.",
        );
      } finally {
        setIsUploading(false);
      }
    };


  const isProcessing =
    project !== null &&
    project.status !== "completed" &&
    project.status !== "failed";

  const activeProgress =
    isUploading
      ? uploadProgress
      : project?.progress ?? 0;

  const activeStep =
    isUploading
      ? "Uploading video"
      : project?.current_step ??
        "Preparing video";


  return (
    <div
      className={cn(
        "overflow-hidden",
        isDark
          ? "rounded-[32px] border border-white/10 bg-[#151517] p-4 shadow-dark sm:p-5"
          : "surface-card p-3 sm:p-4",
        className,
      )}
    >
      <div
        {...getRootProps()}
        className={cn(
          "relative flex min-h-[470px] flex-col items-center justify-center overflow-hidden rounded-[26px] border-2 border-dashed px-5 py-10 text-center transition-all duration-200",

          isDark
            ? (
                isDragActive
                  ? "border-brand-400 bg-brand-400/10"
                  : "border-white/15 bg-white/[0.025] hover:border-brand-400/60 hover:bg-brand-400/[0.04]"
              )
            : (
                isDragActive
                  ? "border-brand-500 bg-brand-100/70"
                  : "border-cream-300 bg-cream-gradient hover:border-brand-300"
              ),
        )}
      >
        <input {...getInputProps()} />

        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />

        {selectedFile ? (
          <div className="relative z-10 w-full max-w-lg">
            <div
              className={cn(
                "mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] shadow-gold",
                isDark
                  ? "bg-brand-gradient text-ink-950"
                  : "bg-ink-950 text-brand-300",
              )}
            >
              {isUploading || isProcessing ? (
                <LoaderCircle
                  size={34}
                  className="animate-spin"
                />
              ) : project?.status ===
                "failed" ? (
                <AlertCircle size={34} />
              ) : (
                <CheckCircle2 size={34} />
              )}
            </div>

            <p
              className={cn(
                "mt-6 text-[11px] font-black uppercase tracking-[0.18em]",
                isDark
                  ? "text-brand-300"
                  : "text-brand-700",
              )}
            >
              {isUploading
                ? "Uploading video"
                : isProcessing
                  ? "AI processing"
                  : "Video selected"}
            </p>

            <h3
              className={cn(
                "mt-3 truncate font-display text-xl font-black sm:text-2xl",
                isDark
                  ? "text-white"
                  : "text-ink-950",
              )}
            >
              {selectedFile.name}
            </h3>

            <p
              className={cn(
                "mt-2 text-sm font-semibold",
                isDark
                  ? "text-white/40"
                  : "text-ink-400",
              )}
            >
              {formatFileSize(
                selectedFile.size,
              )}
            </p>

            {(isUploading || project) && (
              <div className="mx-auto mt-7 max-w-md">
                <div className="mb-3 flex items-center justify-between gap-4 text-xs font-bold">
                  <span
                    className={cn(
                      "truncate",
                      isDark
                        ? "text-white/55"
                        : "text-ink-600",
                    )}
                  >
                    {activeStep}
                  </span>

                  <span className="shrink-0 text-brand-400">
                    {activeProgress}%
                  </span>
                </div>

                <div
                  className={cn(
                    "h-3 overflow-hidden rounded-full",
                    isDark
                      ? "bg-white/10"
                      : "bg-cream-300",
                  )}
                >
                  <div
                    className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                    style={{
                      width:
                        `${activeProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {project?.status === "failed" && (
              <p className="mx-auto mt-5 max-w-md rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                {project.error_message ??
                  "Processing failed."}
              </p>
            )}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={open}
                disabled={
                  isUploading ||
                  isProcessing
                }
                className={cn(
                  isDark &&
                    "border-white/10 bg-white/5 text-white hover:bg-white/10",
                )}
              >
                Choose another video
              </Button>

              <Button
                onClick={
                  handleStartTranscription
                }
                disabled={
                  isUploading ||
                  isProcessing
                }
              >
                {isUploading ||
                isProcessing ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Sparkles size={18} />
                )}

                {isUploading
                  ? "Uploading..."
                  : isProcessing
                    ? "Processing..."
                    : "Generate subtitles"}
              </Button>
            </div>

            {!isUploading &&
              !isProcessing && (
                <button
                  type="button"
                  onClick={resetSelection}
                  className={cn(
                    "mx-auto mt-5 inline-flex items-center gap-2 text-xs font-bold transition",
                    isDark
                      ? "text-white/35 hover:text-white"
                      : "text-ink-400 hover:text-ink-700",
                  )}
                >
                  <X size={14} />
                  Remove selected video
                </button>
              )}
          </div>
        ) : (
          <div className="relative z-10 w-full max-w-lg">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-brand-gradient text-ink-950 shadow-gold">
              {isDragActive ? (
                <FileVideo2 size={34} />
              ) : (
                <UploadCloud size={34} />
              )}
            </div>

            <p
              className={cn(
                "mt-6 text-[11px] font-black uppercase tracking-[0.18em]",
                isDark
                  ? "text-brand-300"
                  : "text-brand-700",
              )}
            >
              Roman Urdu Studio
            </p>

            <h3
              className={cn(
                "mt-3 font-display text-2xl font-black sm:text-3xl",
                isDark
                  ? "text-white"
                  : "text-ink-950",
              )}
            >
              Upload your video
            </h3>

            <p
              className={cn(
                "mx-auto mt-4 max-w-md text-sm leading-7",
                isDark
                  ? "text-white/45"
                  : "text-ink-500",
              )}
            >
              Video ko drag and drop karein ya
              apne computer se select karein.
            </p>

            <Button
              size="lg"
              className="mt-7"
              onClick={open}
            >
              <UploadCloud size={19} />
              Choose video
            </Button>

            <p
              className={cn(
                "mt-5 text-xs font-semibold",
                isDark
                  ? "text-white/30"
                  : "text-ink-400",
              )}
            >
              MP4, MOV, MKV, AVI, M4V or WebM
              · Maximum 2 GB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}