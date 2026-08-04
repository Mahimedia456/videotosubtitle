import {
  create,
} from "zustand";

import type {
  TranscriptionProject,
} from "../types/project";

interface ProjectState {
  projects: TranscriptionProject[];
  activeProject: TranscriptionProject | null;

  setProjects: (
    projects: TranscriptionProject[],
  ) => void;

  setActiveProject: (
    project: TranscriptionProject | null,
  ) => void;

  addProject: (
    project: TranscriptionProject,
  ) => void;

  updateProject: (
    projectId: string,
    updates: Partial<TranscriptionProject>,
  ) => void;
}

export const useProjectStore =
  create<ProjectState>((set) => ({
    projects: [],
    activeProject: null,

    setProjects: (projects) =>
      set({ projects }),

    setActiveProject: (activeProject) =>
      set({ activeProject }),

    addProject: (project) =>
      set((state) => ({
        projects: [
          project,
          ...state.projects,
        ],
      })),

    updateProject: (
      projectId,
      updates,
    ) =>
      set((state) => ({
        projects: state.projects.map(
          (project) =>
            project.id === projectId
              ? {
                  ...project,
                  ...updates,
                }
              : project,
        ),

        activeProject:
          state.activeProject?.id === projectId
            ? {
                ...state.activeProject,
                ...updates,
              }
            : state.activeProject,
      })),
  }));