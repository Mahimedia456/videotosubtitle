import re
from pathlib import Path
from uuid import uuid4


ALLOWED_VIDEO_EXTENSIONS = {
    ".mp4",
    ".mov",
    ".mkv",
    ".webm",
    ".avi",
    ".m4v",
}


def sanitize_file_name(file_name: str) -> str:
    original_path = Path(file_name)
    suffix = original_path.suffix.lower()

    safe_stem = re.sub(
        r"[^a-zA-Z0-9_-]+",
        "-",
        original_path.stem,
    )

    safe_stem = safe_stem.strip("-_") or "video"

    return f"{safe_stem[:80]}{suffix}"


def build_stored_file_name(
    original_name: str,
) -> str:
    safe_name = sanitize_file_name(original_name)
    suffix = Path(safe_name).suffix.lower()
    stem = Path(safe_name).stem

    return f"{stem}-{uuid4().hex}{suffix}"


def validate_video_extension(
    file_name: str,
) -> None:
    suffix = Path(file_name).suffix.lower()

    if suffix not in ALLOWED_VIDEO_EXTENSIONS:
        allowed = ", ".join(
            sorted(ALLOWED_VIDEO_EXTENSIONS),
        )

        raise ValueError(
            f"Unsupported video format. Allowed: {allowed}",
        )