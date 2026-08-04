from __future__ import annotations

import json
import re
from collections.abc import Callable
from typing import Any

from openai import OpenAI

from app.core.config import get_settings


ProgressCallback = Callable[[int, str], None]


class RomanUrduConversionError(
    RuntimeError,
):
    pass


class RomanUrduService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client: OpenAI | None = None

    def get_client(self) -> OpenAI:
        api_key = (
            self.settings.openai_api_key.strip()
        )

        if not api_key:
            raise RomanUrduConversionError(
                (
                    "OPENAI_API_KEY is missing in "
                    "backend/.env."
                ),
            )

        if api_key == (
            "PASTE_YOUR_OPENAI_API_KEY_HERE"
        ):
            raise RomanUrduConversionError(
                (
                    "Replace the placeholder "
                    "OPENAI_API_KEY in backend/.env."
                ),
            )

        if self._client is None:
            self._client = OpenAI(
                api_key=api_key,
            )

        return self._client

    @staticmethod
    def _extract_json(
        raw_text: str,
    ) -> list[dict[str, Any]]:
        cleaned = raw_text.strip()

        cleaned = re.sub(
            r"^```(?:json)?\s*",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )

        cleaned = re.sub(
            r"\s*```$",
            "",
            cleaned,
        )

        first_bracket = cleaned.find("[")
        last_bracket = cleaned.rfind("]")

        if (
            first_bracket == -1
            or last_bracket == -1
            or last_bracket < first_bracket
        ):
            raise RomanUrduConversionError(
                (
                    "Roman Urdu model did not "
                    "return a JSON array."
                ),
            )

        json_text = cleaned[
            first_bracket:last_bracket + 1
        ]

        try:
            payload = json.loads(json_text)
        except json.JSONDecodeError as error:
            raise RomanUrduConversionError(
                (
                    "Roman Urdu model returned "
                    "invalid JSON."
                ),
            ) from error

        if not isinstance(payload, list):
            raise RomanUrduConversionError(
                (
                    "Roman Urdu model response "
                    "must be a JSON array."
                ),
            )

        return payload

    @staticmethod
    def _build_prompt(
        segments: list[dict[str, Any]],
    ) -> str:
        source_segments = [
            {
                "id": segment["id"],
                "text": segment[
                    "original_text"
                ],
            }
            for segment in segments
        ]

        source_json = json.dumps(
            source_segments,
            ensure_ascii=False,
        )

        return f"""
Convert the supplied Urdu or mixed Urdu-English subtitle
segments into natural Pakistani Roman Urdu.

The output must look like casual but clean messaging-style
Roman Urdu, similar to:

"Assalam o Alaikum, kesay hain ap sub? Aj hum forex market
ke baray mein baat karein ge."

Strict rules:

1. Preserve the exact segment IDs.
2. Preserve the original meaning.
3. Do not translate Urdu into English.
4. Convert Urdu script into natural Roman Urdu.
5. Keep existing English trading terms in English.
6. Use simple Pakistani spellings such as:
   آپ = ap
   سب = sub
   کیسے = kesay
   آج = aj
   ہے = hai
   ہیں = hain
   ہوں گے = hon ge
   کریں گے = karein ge
   کے بارے میں = ke baray mein
7. Prefer "Assalam o Alaikum" for السلام علیکم.
8. Preserve names, numbers, percentages and currencies.
9. Preserve terms such as:
   forex, liquidity, market, market structure, trading,
   trader, buy, sell, bullish, bearish, support,
   resistance, order block, entry, stop loss,
   take profit, gold, Bitcoin, BTC, USDT, session,
   chart, candle, breakout and trend.
10. Do not add explanations.
11. Do not combine, remove or reorder segments.
12. Return only a valid JSON array.

Required JSON format:

[
  {{
    "id": "segment-1",
    "roman_urdu_text": "Assalam o Alaikum..."
  }}
]

Input segments:

{source_json}
""".strip()

    def _convert_batch(
        self,
        segments: list[dict[str, Any]],
    ) -> dict[str, str]:
        client = self.get_client()

        prompt = self._build_prompt(
            segments,
        )

        try:
            response = client.responses.create(
                model=(
                    self.settings
                    .roman_urdu_model
                ),
                input=[
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                store=False,
            )
        except Exception as error:
            raise RomanUrduConversionError(
                (
                    "Roman Urdu AI request "
                    f"failed: {error}"
                ),
            ) from error

        raw_text = (
            response.output_text or ""
        ).strip()

        if not raw_text:
            raise RomanUrduConversionError(
                (
                    "Roman Urdu AI returned "
                    "an empty response."
                ),
            )

        converted_items = (
            self._extract_json(raw_text)
        )

        result: dict[str, str] = {}

        for item in converted_items:
            if not isinstance(item, dict):
                continue

            segment_id = str(
                item.get("id", ""),
            ).strip()

            roman_text = str(
                item.get(
                    "roman_urdu_text",
                    "",
                ),
            ).strip()

            if segment_id and roman_text:
                result[segment_id] = (
                    roman_text
                )

        expected_ids = {
            str(segment["id"])
            for segment in segments
        }

        missing_ids = (
            expected_ids - set(result)
        )

        if missing_ids:
            raise RomanUrduConversionError(
                (
                    "Roman Urdu AI omitted "
                    "segments: "
                    + ", ".join(
                        sorted(missing_ids),
                    )
                ),
            )

        return result

    def convert_segments(
        self,
        segments: list[dict[str, Any]],
        progress_callback: (
            ProgressCallback | None
        ) = None,
    ) -> list[dict[str, Any]]:
        if not segments:
            return []

        batch_size = max(
            1,
            min(
                30,
                self.settings
                .roman_urdu_batch_size,
            ),
        )

        total_segments = len(segments)
        converted_segments: list[
            dict[str, Any]
        ] = []

        for batch_start in range(
            0,
            total_segments,
            batch_size,
        ):
            batch = segments[
                batch_start:
                batch_start + batch_size
            ]

            batch_result = (
                self._convert_batch(batch)
            )

            for segment in batch:
                updated_segment = {
                    **segment,
                    "roman_urdu_text": (
                        batch_result[
                            segment["id"]
                        ]
                    ),
                }

                converted_segments.append(
                    updated_segment,
                )

            completed = min(
                batch_start + len(batch),
                total_segments,
            )

            ratio = (
                completed / total_segments
            )

            project_progress = (
                87 + int(ratio * 7)
            )

            if progress_callback:
                progress_callback(
                    min(
                        94,
                        project_progress,
                    ),
                    (
                        "Converting transcript "
                        "to natural Roman Urdu: "
                        f"{completed} of "
                        f"{total_segments} segments"
                    ),
                )

        return converted_segments


roman_urdu_service = RomanUrduService()