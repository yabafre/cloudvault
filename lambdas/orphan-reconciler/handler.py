"""Orphan Reconciler Lambda — weekly sweep for S3 objects without a matching DB row.

Story 1-7 scaffolds only this stub so `lambda-stack` synth can resolve the asset.
The real reconciliation logic (cross-check S3 against Postgres, mark FAILED, delete
objects older than 24h) lands in a dedicated follow-up story.
"""

from __future__ import annotations

from typing import Any


def lambda_handler(event: Any, context: Any) -> dict[str, Any]:
    """Stub handler — returns a success marker and no-ops until the real logic ships."""
    return {"ok": True}
