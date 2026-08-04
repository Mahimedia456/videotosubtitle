from __future__ import annotations

import sys
from collections.abc import Callable
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.projects import router as projects_router
from app.core.config import get_settings
from app.schemas.project import HealthResponse


def configure_console_encoding() -> None:
    """
    Configure Windows console output as UTF-8 where supported.

    getattr is used instead of direct sys.stdout.reconfigure()
    so Pylance does not report an unknown TextIO attribute.
    """

    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(
            stream,
            "reconfigure",
            None,
        )

        if not callable(reconfigure):
            continue

        reconfigure_function: Callable[..., Any] = (
            reconfigure
        )

        try:
            reconfigure_function(
                encoding="utf-8",
                errors="replace",
            )
        except (
            OSError,
            ValueError,
            TypeError,
        ):
            # Some terminals or redirected streams do not
            # allow runtime reconfiguration.
            continue


configure_console_encoding()

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.3.0",
    description=(
        "AI video transcription and Roman Urdu "
        "subtitle generation backend."
    ),
)

allowed_origins = [
    settings.frontend_origin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(
        dict.fromkeys(allowed_origins),
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    projects_router,
    prefix=settings.api_prefix,
)


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
)
def health_check() -> HealthResponse:
    return HealthResponse(
        service=settings.app_name,
        environment=settings.app_env,
    )


@app.get(
    "/",
    tags=["Root"],
)
def root() -> dict[str, str]:
    return {
        "message": settings.app_name,
        "documentation": "/docs",
        "health": "/health",
    }