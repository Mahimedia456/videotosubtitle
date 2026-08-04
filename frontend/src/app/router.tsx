import {
  createBrowserRouter,
} from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";

import DashboardPage from "../pages/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProjectDetailsPage from "../pages/ProjectDetailsPage";
import ProjectsPage from "../pages/ProjectsPage";
import UploadPage from "../pages/UploadPage";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,

    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "upload",
        element: <UploadPage />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "projects/:projectId",
        element: <ProjectDetailsPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);