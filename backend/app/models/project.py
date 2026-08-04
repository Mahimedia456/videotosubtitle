from __future__ import annotations

from dataclasses import (
    asdict,
    dataclass,
    field,
)
from datetime import datetime, timezone
from typing import Any, Literal


ProjectStatus = Literal[
    "uploaded",
    "extracting_audio",
    "transcribing",
    "romanizing",
    "generating_subtitles",
    "completed",
    "failed",
]


def utc_now_iso() -> str:
    return datetime.now(
        timezone.utc,
    ).isoformat()


@dataclass
class SubtitleSegment:
    id: str
    start: float
    end: float

    original_text: str
    roman_urdu_text: str = ""

    confidence: float = 0.0

    words: list[
        dict[str, Any]
    ] = field(
        default_factory=list,
    )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return asdict(
            self,
        )


@dataclass
class TranscriptionProject:
    id: str
    name: str

    file_name: str
    stored_file_name: str

    media_type: str
    file_size: int

    status: ProjectStatus = "uploaded"
    progress: int = 0

    current_step: str = (
        "Video uploaded"
    )

    language: str = "ur"

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

    # Primary SRT is Roman Urdu.
    srt_path: str = ""
    roman_srt_path: str = ""

    error_message: (
        str | None
    ) = None

    segments: list[
        SubtitleSegment
    ] = field(
        default_factory=list,
    )

    created_at: str = field(
        default_factory=utc_now_iso,
    )

    updated_at: str = field(
        default_factory=utc_now_iso,
    )

    def touch(
        self,
    ) -> None:
        self.updated_at = (
            utc_now_iso()
        )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        result = asdict(
            self,
        )

        result["segments"] = [
            segment.to_dict()
            for segment
            in self.segments
        ]

        return result