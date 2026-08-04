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
    Configure stdout and stderr as UTF-8 where supported.
    This avoids Windows console encoding errors during local development.
    """

    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(
            stream,
            "reconfigure",
            None,
        )

        if not callable(reconfigure):
            continue

        reconfigure_function: Callable[..., Any] = reconfigure

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
            continue


def normalize_origin(
    origin: str,
) -> str:
    return origin.strip().rstrip("/")


configure_console_encoding()

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.5.0",
    description=(
        "AI video transcription and Roman Urdu "
        "subtitle generation backend."
    ),
)

production_frontend_origin = normalize_origin(
    settings.frontend_origin,
)

allowed_origins = list(
    dict.fromkeys(
        [
            production_frontend_origin,
            "https://videotosubtitle-theta.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
    ),
)

app.add_middleware(
    CORSMiddleware,

    # Exact production and local frontend origins.
    allow_origins=allowed_origins,

    # Allows Vercel preview deployments and Cloudflare quick tunnels.
    allow_origin_regex=(
        r"^https://"
        r"[a-zA-Z0-9-]+"
        r"\.(vercel\.app|trycloudflare\.com)$"
    ),

    allow_credentials=True,

    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],

    allow_headers=["*"],

    expose_headers=[
        "Content-Disposition",
        "Content-Length",
    ],

    max_age=86400,
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
    "/cors-debug",
    tags=["Health"],
)
def cors_debug() -> dict[str, Any]:
    return {
        "frontend_origin": production_frontend_origin,
        "allowed_origins": allowed_origins,
        "vercel_preview_allowed": True,
        "cloudflare_tunnel_allowed": True,
    }


@app.get(
    "/",
    tags=["Root"],
)
def root() -> dict[str, str]:
    return {
        "message": settings.app_name,
        "documentation": "/docs",
        "health": "/health",
        "cors_debug": "/cors-debug",
    }