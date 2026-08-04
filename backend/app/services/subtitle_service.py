from __future__ import annotations

from pathlib import Path
from typing import Any


class SubtitleGenerationError(RuntimeError):
    pass


def seconds_to_srt_timestamp(
    total_seconds: float,
) -> str:
    safe_seconds = max(
        0.0,
        float(total_seconds),
    )

    total_milliseconds = int(
        round(safe_seconds * 1000),
    )

    hours = (
        total_milliseconds // 3_600_000
    )

    remaining = (
        total_milliseconds % 3_600_000
    )

    minutes = remaining // 60_000
    remaining %= 60_000

    seconds = remaining // 1_000
    milliseconds = remaining % 1_000

    return (
        f"{hours:02d}:"
        f"{minutes:02d}:"
        f"{seconds:02d},"
        f"{milliseconds:03d}"
    )


def clean_subtitle_text(
    value: Any,
) -> str:
    text = str(
        value or "",
    ).strip()

    if not text:
        return ""

    return " ".join(
        text.split(),
    )


def get_segment_text(
    segment: dict[str, Any],
    output_type: str = "roman_urdu",
) -> str:
    if output_type == "roman_urdu":
        return clean_subtitle_text(
            segment.get(
                "roman_urdu_text",
                "",
            ),
        )

    if output_type == "original":
        return clean_subtitle_text(
            segment.get(
                "original_text",
                "",
            ),
        )

    raise SubtitleGenerationError(
        f"Unsupported subtitle output type: {output_type}",
    )


def generate_srt_content(
    segments: list[dict[str, Any]],
    output_type: str = "roman_urdu",
) -> str:
    blocks: list[str] = []
    subtitle_index = 1

    for segment in segments:
        text = get_segment_text(
            segment=segment,
            output_type=output_type,
        )

        if not text:
            continue

        start_value = segment.get(
            "start",
        )

        end_value = segment.get(
            "end",
        )

        if (
            start_value is None
            or end_value is None
        ):
            continue

        start_seconds = float(
            start_value,
        )

        end_seconds = float(
            end_value,
        )

        if end_seconds <= start_seconds:
            continue

        start_timestamp = (
            seconds_to_srt_timestamp(
                start_seconds,
            )
        )

        end_timestamp = (
            seconds_to_srt_timestamp(
                end_seconds,
            )
        )

        blocks.append(
            "\n".join(
                [
                    str(subtitle_index),
                    (
                        f"{start_timestamp} --> "
                        f"{end_timestamp}"
                    ),
                    text,
                ],
            ),
        )

        subtitle_index += 1

    if not blocks:
        raise SubtitleGenerationError(
            (
                "No valid subtitle segments were "
                f"available for {output_type} export."
            ),
        )

    return "\n\n".join(blocks) + "\n"


def save_srt_file(
    segments: list[dict[str, Any]],
    output_path: Path,
    output_type: str = "roman_urdu",
) -> Path:
    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    content = generate_srt_content(
        segments=segments,
        output_type=output_type,
    )

    output_path.write_text(
        content,
        encoding="utf-8",
        newline="\n",
    )

    if not output_path.exists():
        raise SubtitleGenerationError(
            (
                "Subtitle file was not created: "
                f"{output_path}"
            ),
        )

    if output_path.stat().st_size <= 0:
        output_path.unlink(
            missing_ok=True,
        )

        raise SubtitleGenerationError(
            "Generated subtitle file is empty.",
        )

    return output_path