from __future__ import annotations

import traceback
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.services.audio_service import (
    ensure_ffmpeg_available,
    extract_clean_audio,
    get_media_duration,
)
from app.services.project_service import (
    project_service,
)
from app.services.roman_urdu_service import (
    roman_urdu_service,
)
from app.services.subtitle_service import (
    save_srt_file,
)
from app.services.transcription_service import (
    transcription_service,
)


def update_project_progress(
    project_id: str,
    progress: int,
    current_step: str,
    **additional_fields: Any,
) -> None:
    safe_progress = max(
        0,
        min(
            100,
            int(progress),
        ),
    )

    project_service.update_fields(
        project_id,
        progress=safe_progress,
        current_step=current_step,
        **additional_fields,
    )

    print(
        (
            f"[Project {project_id}] "
            f"{safe_progress}% - "
            f"{current_step}"
        ),
    )


def validate_roman_segments(
    segments: list[dict[str, Any]],
) -> None:
    if not segments:
        raise RuntimeError(
            "Roman Urdu segments are empty.",
        )

    missing_segment_ids: list[str] = []

    for segment in segments:
        roman_text = str(
            segment.get(
                "roman_urdu_text",
                "",
            )
            or ""
        ).strip()

        if not roman_text:
            missing_segment_ids.append(
                str(
                    segment.get(
                        "id",
                        "unknown",
                    ),
                ),
            )

    if missing_segment_ids:
        preview = ", ".join(
            missing_segment_ids[:10],
        )

        raise RuntimeError(
            (
                "Roman Urdu conversion is missing "
                f"for segments: {preview}"
            ),
        )


def build_roman_transcript(
    segments: list[dict[str, Any]],
) -> str:
    transcript_parts = [
        str(
            segment.get(
                "roman_urdu_text",
                "",
            )
            or ""
        ).strip()
        for segment in segments
    ]

    transcript_parts = [
        text
        for text in transcript_parts
        if text
    ]

    return " ".join(
        transcript_parts,
    ).strip()


def process_project(
    project_id: str,
) -> None:
    settings = get_settings()

    print(
        (
            f"[Project {project_id}] "
            "Processing started."
        ),
    )

    try:
        project = project_service.get(
            project_id,
        )

        if project is None:
            raise FileNotFoundError(
                (
                    f"Project {project_id} "
                    "does not exist."
                ),
            )

        source_video_path = project.get(
            "source_video_path",
        )

        if not source_video_path:
            raise FileNotFoundError(
                "Project source video path is missing.",
            )

        source_video = Path(
            source_video_path,
        )

        if not source_video.exists():
            raise FileNotFoundError(
                (
                    "Uploaded video was not found: "
                    f"{source_video}"
                ),
            )

        if source_video.stat().st_size <= 0:
            raise RuntimeError(
                "Uploaded video file is empty.",
            )

        update_project_progress(
            project_id=project_id,
            progress=4,
            current_step="Validating uploaded video",
            status="extracting_audio",
            error_message=None,
        )

        ffmpeg_path, ffprobe_path = (
            ensure_ffmpeg_available()
        )

        print(
            f"[Media] FFmpeg: {ffmpeg_path}",
        )

        print(
            f"[Media] FFprobe: {ffprobe_path}",
        )

        update_project_progress(
            project_id=project_id,
            progress=8,
            current_step=(
                "FFmpeg and FFprobe verified"
            ),
        )

        duration = get_media_duration(
            source_video,
        )

        update_project_progress(
            project_id=project_id,
            progress=14,
            current_step=(
                "Video validated. "
                f"Duration: {duration:.1f}s"
            ),
            duration_seconds=duration,
        )

        audio_path = (
            settings.audio_dir
            / f"{project_id}.wav"
        )

        update_project_progress(
            project_id=project_id,
            progress=20,
            current_step=(
                "Extracting clean speech audio"
            ),
            audio_path=str(audio_path),
        )

        extract_clean_audio(
            input_video=source_video,
            output_audio=audio_path,
        )

        if not audio_path.exists():
            raise RuntimeError(
                (
                    "Audio extraction completed, "
                    "but the WAV file was not created."
                ),
            )

        if audio_path.stat().st_size <= 0:
            raise RuntimeError(
                "Extracted audio file is empty.",
            )

        update_project_progress(
            project_id=project_id,
            progress=34,
            current_step=(
                "Clean speech audio extracted"
            ),
        )

        update_project_progress(
            project_id=project_id,
            progress=38,
            current_step=(
                f"Preparing "
                f"{settings.whisper_model}"
            ),
            status="transcribing",
        )

        def transcription_callback(
            progress: int,
            message: str,
        ) -> None:
            update_project_progress(
                project_id=project_id,
                progress=progress,
                current_step=message,
                status="transcribing",
            )

        transcription_result = (
            transcription_service.transcribe(
                audio_path=audio_path,
                progress_callback=(
                    transcription_callback
                ),
            )
        )

        original_segments = list(
            transcription_result.get(
                "segments",
                [],
            ),
        )

        if not original_segments:
            raise RuntimeError(
                (
                    "Whisper did not generate "
                    "transcription segments."
                ),
            )

        update_project_progress(
            project_id=project_id,
            progress=86,
            current_step=(
                "Original speech transcription completed"
            ),
            detected_language=(
                transcription_result.get(
                    "detected_language",
                )
            ),
            language_probability=(
                transcription_result.get(
                    "language_probability",
                )
            ),
            duration_seconds=(
                transcription_result.get(
                    "duration_seconds",
                    duration,
                )
            ),
            transcript_text=(
                transcription_result.get(
                    "transcript_text",
                    "",
                )
            ),
            segments=original_segments,
        )

        update_project_progress(
            project_id=project_id,
            progress=87,
            current_step=(
                "Converting transcript to Roman Urdu"
            ),
            status="romanizing",
        )

        def roman_urdu_callback(
            progress: int,
            message: str,
        ) -> None:
            update_project_progress(
                project_id=project_id,
                progress=progress,
                current_step=message,
                status="romanizing",
            )

        roman_segments = (
            roman_urdu_service.convert_segments(
                segments=original_segments,
                progress_callback=(
                    roman_urdu_callback
                ),
            )
        )

        validate_roman_segments(
            roman_segments,
        )

        roman_transcript = (
            build_roman_transcript(
                roman_segments,
            )
        )

        if not roman_transcript:
            raise RuntimeError(
                (
                    "Roman Urdu transcript "
                    "was generated empty."
                ),
            )

        update_project_progress(
            project_id=project_id,
            progress=94,
            current_step=(
                "Roman Urdu conversion completed"
            ),
            roman_urdu_transcript=(
                roman_transcript
            ),
            segments=roman_segments,
        )

        update_project_progress(
            project_id=project_id,
            progress=96,
            current_step=(
                "Generating Roman Urdu SRT file"
            ),
            status="generating_subtitles",
        )

        roman_srt_path = (
            settings.subtitles_dir
            / f"{project_id}-roman-urdu.srt"
        )

        save_srt_file(
            segments=roman_segments,
            output_path=roman_srt_path,
            output_type="roman_urdu",
        )

        update_project_progress(
            project_id=project_id,
            progress=98,
            current_step=(
                "Finalizing Roman Urdu subtitles"
            ),
            roman_srt_path=str(
                roman_srt_path,
            ),
            # Primary subtitle path is also Roman Urdu.
            srt_path=str(
                roman_srt_path,
            ),
        )

        update_project_progress(
            project_id=project_id,
            progress=100,
            current_step=(
                "Roman Urdu subtitles completed"
            ),
            status="completed",
            error_message=None,
        )

        print(
            (
                f"[Project {project_id}] "
                "Roman Urdu project completed."
            ),
        )

    except Exception as error:
        error_message = (
            str(error)
            or error.__class__.__name__
        )

        print(
            (
                f"[Project {project_id}] "
                f"Processing failed: "
                f"{error_message}"
            ),
        )

        traceback.print_exc()

        try:
            update_project_progress(
                project_id=project_id,
                progress=100,
                current_step="Processing failed",
                status="failed",
                error_message=error_message,
            )
        except Exception as update_error:
            print(
                (
                    f"[Project {project_id}] "
                    "Could not save failure state: "
                    f"{update_error}"
                ),
            )

            traceback.print_exc()