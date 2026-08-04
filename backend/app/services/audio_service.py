from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from app.core.config import get_settings


class AudioProcessingError(RuntimeError):
    pass


settings = get_settings()


def resolve_executable(
    configured_path: str,
    executable_name: str,
) -> str:
    """
    Resolve FFmpeg or FFprobe from:

    1. Configured absolute path in .env
    2. Configured executable available in PATH
    3. Default executable name available in PATH
    """

    cleaned_path = configured_path.strip().strip('"')

    configured_file = Path(cleaned_path)

    if configured_file.is_file():
        return str(configured_file.resolve())

    configured_from_path = shutil.which(
        cleaned_path,
    )

    if configured_from_path:
        return configured_from_path

    default_from_path = shutil.which(
        executable_name,
    )

    if default_from_path:
        return default_from_path

    raise AudioProcessingError(
        (
            f"{executable_name} was not found. "
            f"Configured value: {configured_path}. "
            "Add the correct executable path in backend/.env."
        ),
    )


def get_ffmpeg_path() -> str:
    return resolve_executable(
        configured_path=settings.ffmpeg_path,
        executable_name="ffmpeg",
    )


def get_ffprobe_path() -> str:
    return resolve_executable(
        configured_path=settings.ffprobe_path,
        executable_name="ffprobe",
    )


def ensure_ffmpeg_available() -> tuple[str, str]:
    """
    Validate both executables and return their resolved paths.
    """

    ffmpeg_path = get_ffmpeg_path()
    ffprobe_path = get_ffprobe_path()

    return ffmpeg_path, ffprobe_path


def run_media_command(
    command: list[str],
    operation_name: str,
) -> subprocess.CompletedProcess[str]:
    """
    Run an FFmpeg/FFprobe command with safe Windows UTF-8 decoding.
    """

    try:
        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
    except OSError as error:
        raise AudioProcessingError(
            f"{operation_name} could not start: {error}",
        ) from error

    if process.returncode != 0:
        error_output = (
            process.stderr.strip()
            or process.stdout.strip()
            or f"{operation_name} failed."
        )

        raise AudioProcessingError(
            error_output,
        )

    return process


def get_media_duration(
    input_path: Path,
) -> float:
    if not input_path.exists():
        raise AudioProcessingError(
            f"Input video was not found: {input_path}",
        )

    _, ffprobe_path = ensure_ffmpeg_available()

    command = [
        ffprobe_path,
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "json",
        str(input_path),
    ]

    process = run_media_command(
        command=command,
        operation_name="Reading video duration",
    )

    try:
        payload = json.loads(
            process.stdout,
        )

        duration = float(
            payload["format"]["duration"],
        )
    except (
        KeyError,
        TypeError,
        ValueError,
        json.JSONDecodeError,
    ) as error:
        raise AudioProcessingError(
            "FFprobe returned an invalid video duration.",
        ) from error

    if duration <= 0:
        raise AudioProcessingError(
            "The uploaded video has an invalid duration.",
        )

    return round(duration, 3)


def extract_clean_audio(
    input_video: Path,
    output_audio: Path,
) -> Path:
    if not input_video.exists():
        raise AudioProcessingError(
            f"Input video was not found: {input_video}",
        )

    ffmpeg_path, _ = ensure_ffmpeg_available()

    output_audio.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_audio.unlink(
        missing_ok=True,
    )

    command = [
        ffmpeg_path,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(input_video),
        "-map",
        "0:a:0",
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
        "-af",
        (
            "highpass=f=80,"
            "lowpass=f=7800,"
            "loudnorm=I=-16:LRA=11:TP=-1.5"
        ),
        str(output_audio),
    ]

    run_media_command(
        command=command,
        operation_name="Audio extraction",
    )

    if not output_audio.exists():
        raise AudioProcessingError(
            (
                "FFmpeg completed successfully, "
                "but the audio file was not created."
            ),
        )

    if output_audio.stat().st_size <= 0:
        output_audio.unlink(
            missing_ok=True,
        )

        raise AudioProcessingError(
            "FFmpeg created an empty audio file.",
        )

    return output_audio