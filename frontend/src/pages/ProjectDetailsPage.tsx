import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileText,
  Languages,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import { toast } from "sonner";

import {
  getProject,
  getRomanUrduSrtUrl,
} from "../services/projectService";

import type {
  SubtitleSegment,
  TranscriptionProject,
} from "../types/project";

import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";


function formatTimestamp(
  totalSeconds: number,
): string {
  const safeSeconds =
    Number.isFinite(totalSeconds)
      ? Math.max(0, totalSeconds)
      : 0;

  const hours = Math.floor(
    safeSeconds / 3600,
  );

  const minutes = Math.floor(
    (safeSeconds % 3600) / 60,
  );

  const seconds = Math.floor(
    safeSeconds % 60,
  );

  const milliseconds = Math.floor(
    (safeSeconds % 1) * 1000,
  );

  const hourPart = hours
    .toString()
    .padStart(2, "0");

  const minutePart = minutes
    .toString()
    .padStart(2, "0");

  const secondPart = seconds
    .toString()
    .padStart(2, "0");

  const millisecondPart = milliseconds
    .toString()
    .padStart(3, "0");

  if (hours > 0) {
    return (
      `${hourPart}:` +
      `${minutePart}:` +
      `${secondPart}.` +
      `${millisecondPart}`
    );
  }

  return (
    `${minutePart}:` +
    `${secondPart}.` +
    `${millisecondPart}`
  );
}


function formatDuration(
  durationSeconds: number | null,
): string {
  if (
    durationSeconds === null ||
    !Number.isFinite(durationSeconds)
  ) {
    return "—";
  }

  const totalSeconds = Math.max(
    0,
    Math.floor(durationSeconds),
  );

  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes} min ${seconds} sec`;
  }

  return `${seconds} sec`;
}


function getRomanText(
  segment: SubtitleSegment,
): string {
  return (
    segment.roman_urdu_text?.trim() || ""
  );
}


function hasRomanText(
  project: TranscriptionProject,
): boolean {
  return project.segments.some(
    (segment) =>
      getRomanText(segment).length > 0,
  );
}


function getStatusLabel(
  status: TranscriptionProject["status"],
): string {
  const labels: Record<
    TranscriptionProject["status"],
    string
  > = {
    uploaded: "Uploaded",
    extracting_audio: "Extracting Audio",
    transcribing: "Transcribing Speech",
    romanizing: "Converting to Roman Urdu",
    generating_subtitles:
      "Generating Roman Urdu SRT",
    completed: "Completed",
    failed: "Failed",
  };

  return labels[status];
}


export default function ProjectDetailsPage() {
  const { projectId } = useParams();

  const [project, setProject] =
    useState<TranscriptionProject | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  const loadProject = useCallback(
    async (
      showRefresh = false,
    ): Promise<
      TranscriptionProject | null
    > => {
      if (!projectId) {
        setError(
          "Project ID is missing.",
        );

        setIsLoading(false);
        return null;
      }

      if (showRefresh) {
        setIsRefreshing(true);
      }

      try {
        const data =
          await getProject(projectId);

        setProject(data);
        setError(null);

        return data;
      } catch (requestError) {
        console.error(
          "Project loading failed:",
          requestError,
        );

        setError(
          "Project could not be loaded.",
        );

        return null;
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [projectId],
  );


  useEffect(() => {
    let pollingId:
      number | null = null;

    let mounted = true;

    async function initialize() {
      const initialProject =
        await loadProject();

      if (
        !mounted ||
        !initialProject
      ) {
        return;
      }

      const finished =
        initialProject.status === "completed" ||
        initialProject.status === "failed";

      if (finished) {
        return;
      }

      pollingId =
        window.setInterval(
          async () => {
            const latest =
              await loadProject();

            if (
              !mounted ||
              !latest
            ) {
              return;
            }

            const latestFinished =
              latest.status === "completed" ||
              latest.status === "failed";

            if (
              latestFinished &&
              pollingId !== null
            ) {
              window.clearInterval(
                pollingId,
              );

              pollingId = null;
            }
          },
          2000,
        );
    }

    void initialize();

    return () => {
      mounted = false;

      if (pollingId !== null) {
        window.clearInterval(
          pollingId,
        );
      }
    };
  }, [loadProject]);


  const romanAvailable = useMemo(
    () =>
      project
        ? hasRomanText(project)
        : false,
    [project],
  );


  const romanTranscript = useMemo(
    () => {
      if (!project) {
        return "";
      }

      const storedTranscript =
        project.roman_urdu_transcript?.trim();

      if (storedTranscript) {
        return storedTranscript;
      }

      return project.segments
        .map(getRomanText)
        .filter(Boolean)
        .join(" ");
    },
    [project],
  );


  async function handleCopyTranscript() {
    if (!romanTranscript) {
      toast.error(
        "Roman Urdu transcript is unavailable.",
      );

      return;
    }

    try {
      await navigator.clipboard.writeText(
        romanTranscript,
      );

      toast.success(
        "Roman Urdu transcript copied.",
      );
    } catch (copyError) {
      console.error(
        "Transcript copy failed:",
        copyError,
      );

      toast.error(
        "Transcript could not be copied.",
      );
    }
  }


  if (isLoading) {
    return (
      <div className="page-container flex min-h-[560px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={38}
            className="mx-auto animate-spin text-brand-600"
          />

          <p className="mt-4 text-sm font-bold text-ink-500">
            Loading Roman Urdu subtitles...
          </p>
        </div>
      </div>
    );
  }


  if (
    error ||
    !project
  ) {
    return (
      <div className="page-container py-16">
        <div className="mx-auto max-w-xl rounded-[30px] border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle
            size={38}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-5 font-display text-2xl font-black text-red-900">
            Project unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-700">
            {error ??
              "Project data is unavailable."}
          </p>

          <Link
            to="/projects"
            className="mt-6 inline-block"
          >
            <Button>
              <ArrowLeft size={18} />
              Back to projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }


  const completed =
    project.status === "completed";

  const failed =
    project.status === "failed";


  return (
    <>
      <section className="relative overflow-hidden bg-dark-gradient py-12 text-white lg:py-16">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-brand-400/20 blur-3xl" />

        <div className="page-container relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-brand-300"
            >
              <ArrowLeft size={17} />
              Back to projects
            </Link>

            <Button
              size="sm"
              variant="secondary"
              disabled={isRefreshing}
              onClick={() => {
                void loadProject(true);
              }}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <RefreshCw
                size={16}
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {isRefreshing
                ? "Refreshing..."
                : "Refresh"}
            </Button>
          </div>

          <div className="mt-10 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <Badge className="border-brand-300/20 bg-brand-300/10 text-brand-300">
                {completed ? (
                  <CheckCircle2 size={14} />
                ) : failed ? (
                  <AlertCircle size={14} />
                ) : (
                  <LoaderCircle
                    size={14}
                    className="animate-spin"
                  />
                )}

                {getStatusLabel(
                  project.status,
                )}
              </Badge>

              <h1 className="mt-5 max-w-4xl break-words font-display text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
                {project.name}
              </h1>

              <p className="mt-3 break-all text-sm text-white/45">
                {project.file_name}
              </p>
            </div>

            {completed &&
              romanAvailable && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => {
                      void handleCopyTranscript();
                    }}
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Copy size={18} />
                    Copy transcript
                  </Button>

                  <a
                    href={getRomanUrduSrtUrl(
                      project.id,
                    )}
                  >
                    <Button
                      size="lg"
                      className="w-full"
                    >
                      <Download size={18} />
                      Download Roman Urdu SRT
                    </Button>
                  </a>
                </div>
              )}
          </div>

          {!completed &&
            !failed && (
              <div className="mt-10">
                <div className="mb-3 flex items-center justify-between gap-4 text-xs font-bold">
                  <span className="truncate text-white/55">
                    {project.current_step}
                  </span>

                  <span className="shrink-0 text-brand-300">
                    {project.progress}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                    style={{
                      width:
                        `${project.progress}%`,
                    }}
                  />
                </div>
              </div>
            )}

          {failed && (
            <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
              {project.error_message ??
                "Project processing failed."}
            </div>
          )}
        </div>
      </section>

      <section className="page-container py-10 lg:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[26px] border border-cream-300 bg-white p-6 shadow-card">
            <Clock3 className="text-brand-600" />

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-400">
              Duration
            </p>

            <p className="mt-1 font-display text-xl font-black text-ink-950">
              {formatDuration(
                project.duration_seconds,
              )}
            </p>
          </article>

          <article className="rounded-[26px] border border-cream-300 bg-white p-6 shadow-card">
            <Languages className="text-brand-600" />

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-400">
              Subtitle output
            </p>

            <p className="mt-1 font-display text-xl font-black text-ink-950">
              Roman Urdu
            </p>
          </article>

          <article className="rounded-[26px] border border-cream-300 bg-white p-6 shadow-card">
            <FileText className="text-brand-600" />

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-400">
              Subtitle segments
            </p>

            <p className="mt-1 font-display text-xl font-black text-ink-950">
              {project.segments.length}
            </p>
          </article>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">
              Roman Urdu subtitles
            </p>

            <h2 className="brand-heading mt-2 text-3xl sm:text-4xl">
              Timestamped transcript
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-500">
              Har subtitle segment Roman Urdu mein show ho raha hai. Original Urdu sirf optional reference ke liye expandable section mein hai.
            </p>
          </div>

          {romanAvailable && (
            <Badge>
              <Sparkles size={14} />
              Roman Urdu SRT Ready
            </Badge>
          )}
        </div>

        {!completed ? (
          <div className="mt-7 flex min-h-[300px] items-center justify-center rounded-[30px] border border-cream-300 bg-white p-8 text-center shadow-card">
            <div>
              <LoaderCircle
                size={32}
                className="mx-auto animate-spin text-brand-600"
              />

              <p className="mt-4 text-sm font-bold text-ink-600">
                {project.current_step}
              </p>

              <p className="mt-2 text-xs text-ink-400">
                {project.progress}%
              </p>
            </div>
          </div>
        ) : !romanAvailable ? (
          <div className="mt-7 rounded-[28px] border border-amber-200 bg-amber-50 p-7">
            <div className="flex items-start gap-4">
              <AlertCircle
                size={24}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <h3 className="font-display text-lg font-extrabold text-amber-900">
                  Roman Urdu subtitles unavailable
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Is project mein Roman Urdu segments save nahi hui hain. Fresh video upload karke dobara process karein.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            {project.segments.map(
              (segment) => {
                const romanText =
                  getRomanText(segment);

                if (!romanText) {
                  return null;
                }

                return (
                  <article
                    key={segment.id}
                    className="grid gap-5 rounded-[26px] border border-cream-300 bg-white p-5 shadow-card transition hover:border-brand-300 md:grid-cols-[175px_minmax(0,1fr)_70px]"
                  >
                    <div className="text-xs font-black text-brand-700">
                      {formatTimestamp(
                        segment.start,
                      )}

                      <span className="mx-2 text-ink-300">
                        -
                      </span>

                      {formatTimestamp(
                        segment.end,
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="break-words text-base font-bold leading-7 text-ink-800">
                        {romanText}
                      </p>

                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-bold text-ink-400 transition hover:text-brand-700">
                          Show original Urdu
                        </summary>

                        <p
                          dir="rtl"
                          className="mt-3 rounded-xl bg-cream-100 p-4 text-right text-sm leading-8 text-ink-600"
                        >
                          {segment.original_text}
                        </p>
                      </details>
                    </div>

                    <div className="text-right text-xs font-black text-ink-400">
                      {Math.round(
                        segment.confidence *
                          100,
                      )}
                      %
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </>
  );
}