from __future__ import annotations

from typing import Any, Literal

from pydantic import (
    BaseModel,
    Field,
)


class WordResponse(BaseModel):
    start: float | None = None
    end: float | None = None
    word: str = ""
    probability: float | None = None


class SubtitleSegmentResponse(
    BaseModel,
):
    id: str
    start: float
    end: float

    original_text: str
    roman_urdu_text: str = ""

    confidence: float = Field(
        default=0,
        ge=0,
        le=1,
    )

    words: list[
        dict[str, Any]
    ] = Field(
        default_factory=list,
    )


class ProjectResponse(
    BaseModel,
):
    id: str
    name: str

    file_name: str
    stored_file_name: str

    media_type: str
    file_size: int

    status: Literal[
        "uploaded",
        "extracting_audio",
        "transcribing",
        "romanizing",
        "generating_subtitles",
        "completed",
        "failed",
    ]

    progress: int
    current_step: str

    language: str

    detected_language: (
        str | None
    ) = None

    language_probability: (
        float | None
    ) = None

    duration_seconds: (
        float | None
    ) = None

    transcript_text: str = ""
    roman_urdu_transcript: str = ""

    source_video_path: str = ""
    audio_path: str = ""

    srt_path: str = ""
    roman_srt_path: str = ""

    error_message: (
        str | None
    ) = None

    segments: list[
        SubtitleSegmentResponse
    ] = Field(
        default_factory=list,
    )

    created_at: str
    updated_at: str


class UploadProjectResponse(
    BaseModel,
):
    ok: bool = True
    message: str
    project: ProjectResponse


class ProjectListResponse(
    BaseModel,
):
    ok: bool = True

    projects: list[
        ProjectResponse
    ]


class HealthResponse(
    BaseModel,
):
    ok: bool = True
    service: str
    environment: str