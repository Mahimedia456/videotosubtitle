from __future__ import annotations

import inspect
import math
import threading
from collections.abc import Callable
from pathlib import Path
from typing import Any

from faster_whisper import WhisperModel

from app.core.config import get_settings


ProgressCallback = Callable[[int, str], None]


class TranscriptionService:
    """
    Faster-Whisper transcription service.

    The configured model is loaded once and reused.
    Only one transcription runs at a time to avoid excessive
    CPU and memory usage.
    """

    _model: WhisperModel | None = None

    _loaded_model_signature: (
        tuple[str, str, str] | None
    ) = None

    _model_lock = threading.Lock()
    _transcription_lock = threading.Lock()

    def __init__(self) -> None:
        self.settings = get_settings()

    def _current_model_signature(
        self,
    ) -> tuple[str, str, str]:
        return (
            self.settings.whisper_model,
            self.settings.whisper_device,
            self.settings.whisper_compute_type,
        )

    def get_model(
        self,
        progress_callback: (
            ProgressCallback | None
        ) = None,
    ) -> WhisperModel:
        requested_signature = (
            self._current_model_signature()
        )

        existing_model = self.__class__._model

        if (
            existing_model is not None
            and self.__class__._loaded_model_signature
            == requested_signature
        ):
            return existing_model

        with self.__class__._model_lock:
            existing_model = self.__class__._model

            if (
                existing_model is not None
                and self.__class__._loaded_model_signature
                == requested_signature
            ):
                return existing_model

            model_name = self.settings.whisper_model

            if progress_callback:
                progress_callback(
                    42,
                    (
                        f"Loading {model_name}. "
                        "The first run may download the model."
                    ),
                )

            print(
                f"[Whisper] Loading model: {model_name}",
            )
            print(
                "[Whisper] Device: "
                f"{self.settings.whisper_device}",
            )
            print(
                "[Whisper] Compute type: "
                f"{self.settings.whisper_compute_type}",
            )

            try:
                model = WhisperModel(
                    model_name,
                    device=self.settings.whisper_device,
                    compute_type=(
                        self.settings.whisper_compute_type
                    ),
                )
            except Exception as error:
                raise RuntimeError(
                    (
                        "Unable to load Whisper model "
                        f"'{model_name}': {error}"
                    ),
                ) from error

            self.__class__._model = model
            self.__class__._loaded_model_signature = (
                requested_signature
            )

            print(
                "[Whisper] Model loaded successfully: "
                f"{model_name}",
            )

            if progress_callback:
                progress_callback(
                    48,
                    (
                        f"{model_name} loaded. "
                        "Starting transcription."
                    ),
                )

            return model

    @staticmethod
    def _safe_probability(
        value: float | None,
    ) -> float:
        if value is None:
            return 0.0

        return max(
            0.0,
            min(
                1.0,
                float(value),
            ),
        )

    @classmethod
    def _segment_confidence(
        cls,
        words: list[dict[str, Any]],
        average_log_probability: float | None,
    ) -> float:
        word_probabilities = [
            float(word["probability"])
            for word in words
            if word.get("probability") is not None
        ]

        if word_probabilities:
            average_probability = (
                sum(word_probabilities)
                / len(word_probabilities)
            )

            return round(
                cls._safe_probability(
                    average_probability,
                ),
                4,
            )

        if average_log_probability is None:
            return 0.0

        estimated_probability = math.exp(
            float(average_log_probability),
        )

        return round(
            cls._safe_probability(
                estimated_probability,
            ),
            4,
        )

    @staticmethod
    def _calculate_progress(
        segment_end: float,
        total_duration: float,
    ) -> int:
        if total_duration <= 0:
            return 50

        completed_ratio = max(
            0.0,
            min(
                1.0,
                segment_end / total_duration,
            ),
        )

        return min(
            84,
            50 + int(completed_ratio * 34),
        )

    @staticmethod
    def _supports_transcribe_argument(
        model: WhisperModel,
        argument_name: str,
    ) -> bool:
        try:
            signature = inspect.signature(
                model.transcribe,
            )

            return (
                argument_name
                in signature.parameters
            )
        except (
            TypeError,
            ValueError,
        ):
            return False

    def _build_transcribe_options(
        self,
        model: WhisperModel,
    ) -> dict[str, Any]:
        options: dict[str, Any] = {
            "language": (
                self.settings.whisper_language
                or None
            ),
            "task": "transcribe",
            "beam_size": 3,
            "best_of": 3,
            "patience": 1.0,
            "temperature": 0.0,
            "condition_on_previous_text": True,
            "vad_filter": True,
            "vad_parameters": {
                "min_silence_duration_ms": 400,
                "speech_pad_ms": 200,
            },
            "word_timestamps": True,
            "without_timestamps": False,
        }

        optional_options: dict[str, Any] = {
            "repetition_penalty": 1.1,
            "no_repeat_ngram_size": 3,
            "log_progress": True,
        }

        for (
            argument_name,
            value,
        ) in optional_options.items():
            if self._supports_transcribe_argument(
                model,
                argument_name,
            ):
                options[argument_name] = value

        return options

    def transcribe(
        self,
        audio_path: Path,
        progress_callback: (
            ProgressCallback | None
        ) = None,
    ) -> dict[str, Any]:
        if not audio_path.exists():
            raise FileNotFoundError(
                f"Audio file was not found: {audio_path}",
            )

        if audio_path.stat().st_size <= 0:
            raise RuntimeError(
                "The extracted audio file is empty.",
            )

        model = self.get_model(
            progress_callback=progress_callback,
        )

        if progress_callback:
            progress_callback(
                50,
                (
                    "Analyzing speech and generating "
                    "timestamped transcript."
                ),
            )

        print(
            "[Whisper] Starting transcription: "
            f"{audio_path}",
        )

        transcribe_options = (
            self._build_transcribe_options(
                model,
            )
        )

        with self.__class__._transcription_lock:
            try:
                segments_generator, info = (
                    model.transcribe(
                        str(audio_path),
                        **transcribe_options,
                    )
                )
            except Exception as error:
                raise RuntimeError(
                    (
                        "Whisper could not start "
                        f"transcription: {error}"
                    ),
                ) from error

            total_duration = float(
                getattr(
                    info,
                    "duration",
                    0.0,
                )
                or 0.0
            )

            detected_language = str(
                getattr(
                    info,
                    "language",
                    "",
                )
                or self.settings.whisper_language
                or "unknown"
            )

            language_probability = float(
                getattr(
                    info,
                    "language_probability",
                    0.0,
                )
                or 0.0
            )

            result_segments: list[
                dict[str, Any]
            ] = []

            transcript_parts: list[str] = []
            last_reported_progress = 50

            try:
                for index, segment in enumerate(
                    segments_generator,
                    start=1,
                ):
                    text = (
                        segment.text.strip()
                        if segment.text
                        else ""
                    )

                    if not text:
                        continue

                    segment_start = round(
                        float(segment.start),
                        3,
                    )

                    segment_end = round(
                        float(segment.end),
                        3,
                    )

                    words: list[
                        dict[str, Any]
                    ] = []

                    for word in (
                        segment.words or []
                    ):
                        cleaned_word = (
                            word.word.strip()
                            if word.word
                            else ""
                        )

                        if not cleaned_word:
                            continue

                        word_start = (
                            round(
                                float(word.start),
                                3,
                            )
                            if word.start is not None
                            else None
                        )

                        word_end = (
                            round(
                                float(word.end),
                                3,
                            )
                            if word.end is not None
                            else None
                        )

                        word_probability = (
                            round(
                                self._safe_probability(
                                    word.probability,
                                ),
                                4,
                            )
                            if word.probability
                            is not None
                            else None
                        )

                        words.append(
                            {
                                "start": word_start,
                                "end": word_end,
                                "word": cleaned_word,
                                "probability": (
                                    word_probability
                                ),
                            },
                        )

                    confidence = (
                        self._segment_confidence(
                            words=words,
                            average_log_probability=(
                                getattr(
                                    segment,
                                    "avg_logprob",
                                    None,
                                )
                            ),
                        )
                    )

                    result_segments.append(
                        {
                            "id": f"segment-{index}",
                            "start": segment_start,
                            "end": segment_end,
                            "original_text": text,
                            "roman_urdu_text": "",
                            "confidence": confidence,
                            "words": words,
                        },
                    )

                    transcript_parts.append(text)

                    current_progress = (
                        self._calculate_progress(
                            segment_end=segment_end,
                            total_duration=(
                                total_duration
                            ),
                        )
                    )

                    if (
                        progress_callback
                        and current_progress
                        > last_reported_progress
                    ):
                        progress_callback(
                            current_progress,
                            (
                                "Transcribing speech: "
                                f"{segment_end:.1f}s of "
                                f"{total_duration:.1f}s"
                            ),
                        )

                        last_reported_progress = (
                            current_progress
                        )

                    # ASCII only to prevent Windows
                    # charmap encoding errors.
                    print(
                        (
                            f"[Whisper] Segment {index}: "
                            f"{segment_start:.2f}s -> "
                            f"{segment_end:.2f}s | {text}"
                        ),
                    )

            except Exception as error:
                raise RuntimeError(
                    (
                        "Whisper failed while reading "
                        f"transcription segments: {error}"
                    ),
                ) from error

        if not result_segments:
            raise RuntimeError(
                (
                    "No speech was detected in the video. "
                    "Check whether the video contains "
                    "clear audible speech."
                ),
            )

        transcript_text = " ".join(
            transcript_parts,
        ).strip()

        if progress_callback:
            progress_callback(
                85,
                (
                    "Speech transcription completed. "
                    "Preparing subtitle data."
                ),
            )

        print(
            "[Whisper] Transcription completed. "
            f"Segments: {len(result_segments)}",
        )
        print(
            "[Whisper] Detected language: "
            f"{detected_language}",
        )

        return {
            "detected_language": (
                detected_language
            ),
            "language_probability": round(
                self._safe_probability(
                    language_probability,
                ),
                4,
            ),
            "duration_seconds": round(
                total_duration,
                3,
            ),
            "transcript_text": transcript_text,
            "segments": result_segments,
        }


transcription_service = TranscriptionService()