from __future__ import annotations

from pathlib import Path
from typing import Any
from uuid import uuid4

import aiofiles
from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse

from app.core.config import get_settings
from app.models.project import (
    TranscriptionProject,
)
from app.schemas.project import (
    ProjectListResponse,
    ProjectResponse,
    UploadProjectResponse,
)
from app.services.processing_service import (
    process_project,
)
from app.services.project_service import (
    project_service,
)
from app.utils.files import (
    build_stored_file_name,
    validate_video_extension,
)


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)

settings = get_settings()


@router.post(
    "/upload",
    response_model=UploadProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_project(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str | None = Form(default=None),
    language: str = Form(default="ur"),
) -> UploadProjectResponse:
    original_file_name = (
        file.filename or "video.mp4"
    )

    try:
        validate_video_extension(
            original_file_name,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=str(error),
        ) from error

    project_id = uuid4().hex

    stored_file_name = (
        build_stored_file_name(
            original_file_name,
        )
    )

    target_path = (
        settings.uploads_dir
        / stored_file_name
    )

    total_bytes = 0

    maximum_bytes = (
        settings.max_upload_size_mb
        * 1024
        * 1024
    )

    try:
        async with aiofiles.open(
            target_path,
            "wb",
        ) as output_file:
            while True:
                chunk = await file.read(
                    1024 * 1024,
                )

                if not chunk:
                    break

                total_bytes += len(chunk)

                if total_bytes > maximum_bytes:
                    target_path.unlink(
                        missing_ok=True,
                    )

                    raise HTTPException(
                        status_code=(
                            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                        ),
                        detail=(
                            "Uploaded file exceeds "
                            f"{settings.max_upload_size_mb} MB."
                        ),
                    )

                await output_file.write(
                    chunk,
                )

    except HTTPException:
        raise
    except OSError as error:
        target_path.unlink(
            missing_ok=True,
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to save uploaded video."
            ),
        ) from error
    finally:
        await file.close()

    if total_bytes <= 0:
        target_path.unlink(
            missing_ok=True,
        )

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail="Uploaded video is empty.",
        )

    project_name = (
        name.strip()
        if name and name.strip()
        else Path(
            original_file_name,
        ).stem
    )

    project = TranscriptionProject(
        id=project_id,
        name=project_name,
        file_name=original_file_name,
        stored_file_name=(
            stored_file_name
        ),
        media_type=(
            file.content_type
            or "application/octet-stream"
        ),
        file_size=total_bytes,
        language=language,
        source_video_path=str(
            target_path,
        ),
    )

    project_service.save(
        project,
    )

    background_tasks.add_task(
        process_project,
        project_id,
    )

    return UploadProjectResponse(
        message=(
            "Video uploaded. Roman Urdu "
            "subtitle processing started."
        ),
        project=ProjectResponse(
            **project.to_dict(),
        ),
    )


@router.get(
    "",
    response_model=ProjectListResponse,
)
def list_projects() -> ProjectListResponse:
    projects = project_service.list_all()

    return ProjectListResponse(
        projects=[
            ProjectResponse(
                **project,
            )
            for project in projects
        ],
    )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: str,
) -> ProjectResponse:
    project = project_service.get(
        project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Project not found.",
        )

    return ProjectResponse(
        **project,
    )


def get_completed_project(
    project_id: str,
) -> dict[str, Any]:
    project = project_service.get(
        project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Project not found.",
        )

    if project.get("status") != "completed":
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                "Project processing "
                "is not completed."
            ),
        )

    return project


def resolve_roman_srt_path(
    project: dict[str, Any],
) -> Path:
    roman_path_value = (
        project.get(
            "roman_srt_path",
        )
        or project.get(
            "srt_path",
        )
    )

    if not roman_path_value:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Roman Urdu subtitle "
                "file is unavailable."
            ),
        )

    roman_path = Path(
        str(roman_path_value),
    )

    if not roman_path.exists():
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Roman Urdu subtitle "
                "file was not found."
            ),
        )

    if roman_path.stat().st_size <= 0:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Roman Urdu subtitle "
                "file is empty."
            ),
        )

    return roman_path


@router.get(
    "/{project_id}/download/srt",
)
def download_primary_srt(
    project_id: str,
) -> FileResponse:
    project = get_completed_project(
        project_id,
    )

    roman_srt_path = (
        resolve_roman_srt_path(
            project,
        )
    )

    return FileResponse(
        path=roman_srt_path,
        media_type=(
            "application/x-subrip"
        ),
        filename=(
            f"{project['name']}"
            "-roman-urdu.srt"
        ),
    )


@router.get(
    "/{project_id}/download/roman-urdu-srt",
)
def download_roman_urdu_srt(
    project_id: str,
) -> FileResponse:
    project = get_completed_project(
        project_id,
    )

    roman_srt_path = (
        resolve_roman_srt_path(
            project,
        )
    )

    return FileResponse(
        path=roman_srt_path,
        media_type=(
            "application/x-subrip"
        ),
        filename=(
            f"{project['name']}"
            "-roman-urdu.srt"
        ),
    )