from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parents[2]
STORAGE_ROOT = BACKEND_ROOT / "storage"


class Settings(BaseSettings):
    app_name: str = (
        "Liquidity by Murshid AI Subtitle Studio"
    )
    app_env: str = "development"
    api_prefix: str = "/api"

    frontend_origin: str = (
        "http://localhost:5173"
    )

    # Whisper
    whisper_model: str = "large-v3-turbo"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    whisper_language: str = "ur"

    # Roman Urdu AI conversion
    roman_urdu_provider: str = "openai"
    roman_urdu_model: str = "gpt-5-mini"
    roman_urdu_batch_size: int = 15
    openai_api_key: str = ""

    # FFmpeg
    ffmpeg_path: str = "ffmpeg"
    ffprobe_path: str = "ffprobe"

    max_upload_size_mb: int = 2048

    backend_root: Path = BACKEND_ROOT
    storage_root: Path = STORAGE_ROOT

    uploads_dir: Path = (
        STORAGE_ROOT / "uploads"
    )
    audio_dir: Path = (
        STORAGE_ROOT / "audio"
    )
    projects_dir: Path = (
        STORAGE_ROOT / "projects"
    )
    subtitles_dir: Path = (
        STORAGE_ROOT / "subtitles"
    )
    exports_dir: Path = (
        STORAGE_ROOT / "exports"
    )

    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    def ensure_directories(self) -> None:
        directories = [
            self.storage_root,
            self.uploads_dir,
            self.audio_dir,
            self.projects_dir,
            self.subtitles_dir,
            self.exports_dir,
        ]

        for directory in directories:
            directory.mkdir(
                parents=True,
                exist_ok=True,
            )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_directories()
    return settings