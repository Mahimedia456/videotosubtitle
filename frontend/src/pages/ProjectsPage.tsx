import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileVideo2,
  FolderOpen,
  LoaderCircle,
  Plus,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getProjects,
} from "../services/projectService";

import type {
  TranscriptionProject,
} from "../types/project";

import { Button } from "../components/ui/Button";


function getStatusIcon(
  status: TranscriptionProject["status"],
) {
  if (status === "completed") {
    return (
      <CheckCircle2
        size={18}
        className="text-emerald-600"
      />
    );
  }

  if (status === "failed") {
    return (
      <AlertCircle
        size={18}
        className="text-red-500"
      />
    );
  }

  return (
    <LoaderCircle
      size={18}
      className="animate-spin text-brand-600"
    />
  );
}


function getStatusLabel(
  status: TranscriptionProject["status"],
): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


export default function ProjectsPage() {
  const [projects, setProjects] =
    useState<TranscriptionProject[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {
    async function loadProjects() {
      try {
        const data =
          await getProjects();

        setProjects(data);
        setError(null);
      } catch (requestError) {
        console.error(
          "Projects loading failed:",
          requestError,
        );

        setError(
          "Projects could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadProjects();
  }, []);


  return (
    <>
      <section className="bg-cream-gradient py-14 lg:py-16">
        <div className="page-container flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">
              Subtitle Library
            </p>

            <h1 className="brand-heading mt-3 text-4xl sm:text-5xl">
              Your Roman Urdu projects
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-500">
              Processed videos, Roman Urdu transcripts aur downloadable SRT files yahan available hongi.
            </p>
          </div>

          <Link to="/upload">
            <Button size="lg">
              <Plus size={19} />
              New project
            </Button>
          </Link>
        </div>
      </section>

      <section className="page-container py-12 lg:py-16">
        {isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="text-center">
              <LoaderCircle
                size={34}
                className="mx-auto animate-spin text-brand-600"
              />

              <p className="mt-4 text-sm font-bold text-ink-500">
                Loading projects...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle
              size={34}
              className="mx-auto text-red-500"
            />

            <h2 className="mt-4 font-display text-xl font-black text-red-900">
              Projects unavailable
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-[32px] border border-cream-300 bg-white px-6 py-16 text-center shadow-card">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-brand-100 text-brand-700">
              <FolderOpen size={35} />
            </div>

            <h2 className="brand-heading mt-6 text-2xl">
              No projects yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-500">
              Apni pehli video upload karein aur Roman Urdu subtitles generate karein.
            </p>

            <Link
              to="/upload"
              className="mt-6 inline-block"
            >
              <Button>
                <Plus size={18} />
                Create first project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group overflow-hidden rounded-[28px] border border-cream-300 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-soft"
              >
                <div className="relative flex min-h-[180px] items-center justify-center overflow-hidden bg-dark-gradient">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(251,191,36,0.22),transparent_38%)]" />

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] bg-brand-gradient text-ink-950 shadow-gold">
                    <FileVideo2 size={34} />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(
                        project.status,
                      )}

                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-ink-400">
                        {getStatusLabel(
                          project.status,
                        )}
                      </span>
                    </div>

                    <ArrowRight
                      size={18}
                      className="text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand-600"
                    />
                  </div>

                  <h2 className="mt-4 line-clamp-2 font-display text-xl font-black text-ink-950">
                    {project.name}
                  </h2>

                  <p className="mt-2 truncate text-xs font-semibold text-ink-400">
                    {project.file_name}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-cream-300 pt-4 text-xs font-semibold text-ink-400">
                    <span className="flex items-center gap-2">
                      <Clock3 size={14} />
                      {formatDate(
                        project.created_at,
                      )}
                    </span>

                    <span>
                      {project.segments.length} segments
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}