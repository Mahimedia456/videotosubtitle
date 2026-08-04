import json
import threading
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.models.project import TranscriptionProject


class ProjectService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._lock = threading.RLock()

    def _project_file(
        self,
        project_id: str,
    ) -> Path:
        return (
            self.settings.projects_dir
            / f"{project_id}.json"
        )

    def save(
        self,
        project: TranscriptionProject,
    ) -> TranscriptionProject:
        project.touch()

        output_path = self._project_file(project.id)

        with self._lock:
            output_path.write_text(
                json.dumps(
                    project.to_dict(),
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8",
            )

        return project

    def get(
        self,
        project_id: str,
    ) -> dict[str, Any] | None:
        project_file = self._project_file(project_id)

        if not project_file.exists():
            return None

        with self._lock:
            return json.loads(
                project_file.read_text(
                    encoding="utf-8",
                ),
            )

    def list_all(self) -> list[dict[str, Any]]:
        projects: list[dict[str, Any]] = []

        for project_file in (
            self.settings.projects_dir.glob("*.json")
        ):
            try:
                project_data = json.loads(
                    project_file.read_text(
                        encoding="utf-8",
                    ),
                )
                projects.append(project_data)
            except (
                OSError,
                json.JSONDecodeError,
            ):
                continue

        projects.sort(
            key=lambda item: item.get(
                "created_at",
                "",
            ),
            reverse=True,
        )

        return projects

    def update_fields(
        self,
        project_id: str,
        **updates: Any,
    ) -> dict[str, Any]:
        project_data = self.get(project_id)

        if project_data is None:
            raise FileNotFoundError(
                f"Project {project_id} was not found.",
            )

        project_data.update(updates)

        from datetime import datetime, timezone

        project_data["updated_at"] = (
            datetime.now(timezone.utc).isoformat()
        )

        project_file = self._project_file(project_id)

        with self._lock:
            project_file.write_text(
                json.dumps(
                    project_data,
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8",
            )

        return project_data


project_service = ProjectService()