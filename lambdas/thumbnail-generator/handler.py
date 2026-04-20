"""Thumbnail Generator Lambda — stub scaffolded by story 1-7.

The real Pillow-based thumbnail pipeline lands in story 4-5 (KON-109).

Event shape contract: wired via EventBridge Rule (source `aws.s3`, detail-type
`Object Created`), NOT via direct `S3EventSource`. The real handler must read
`event['detail']['bucket']['name']` and `event['detail']['object']['key']`,
short-circuit on keys that do NOT match `*/originals/*` (the rule's prefix
filter is `users/` and cannot exclude `users/*/thumbnails/*` — filtering is
handler-side), write thumbnails to `users/{userId}/thumbnails/{uuid}.webp`
(IAM grant is scoped to that prefix), and MUST re-raise on failure so
EventBridge retries and the SQS DLQ captures exhausted attempts.
"""

from __future__ import annotations

from typing import Any


def lambda_handler(event: Any, context: Any) -> dict[str, Any]:
    """Stub handler — returns a success marker and no-ops until story 4-5 ships."""
    return {"ok": True}
