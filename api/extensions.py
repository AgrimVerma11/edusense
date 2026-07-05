"""Shared Flask extensions.

The rate limiter lives here (not in app.py) so the route modules can import it to
decorate individual endpoints without a circular import back to the app factory.
"""

import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Per-client rate limiter. The store defaults to in-memory, which is fine for a
# single instance; in production set RATE_LIMIT_STORAGE_URI to a shared backend
# (for example a Redis URL) so limits hold across multiple workers. Limits are
# opt-in per route, so anything undecorated (like the health check) is unlimited.
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.environ.get("RATE_LIMIT_STORAGE_URI", "memory://"),
    headers_enabled=True,
)
