"""Flask application factory for the EduSense API.

create_app wires up CORS, the versioned routes, and structured JSON errors, then
warms the model pipeline so the first request isn't slow. Run it locally with
`python -m api.app`; in production gunicorn calls `api.app:create_app()`.
"""

import logging
import os

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from api.extensions import limiter
from api.routes.health import health_bp
from api.routes.predict import predict_bp
from api.schemas import ApiError

logger = logging.getLogger(__name__)

API_PREFIX = "/api/v1"

# Reject request bodies larger than this. The prediction payloads are a few
# kilobytes at most, so anything much bigger is either a mistake or abuse.
MAX_CONTENT_LENGTH = 64 * 1024  # 64 KB

# Localhost dev server default. In production set EDUSENSE_ALLOWED_ORIGINS to the
# real frontend origin(s), comma-separated, and CORS locks to exactly those.
DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]


def _allowed_origins() -> list[str]:
    raw = os.environ.get("EDUSENSE_ALLOWED_ORIGINS", "").strip()
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return DEFAULT_ALLOWED_ORIGINS


def create_app() -> Flask:
    """Build and configure the Flask app."""
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    # Lock CORS to the configured origins rather than allowing everything.
    CORS(app, resources={r"/api/*": {"origins": _allowed_origins()}})
    limiter.init_app(app)

    app.register_blueprint(health_bp, url_prefix=API_PREFIX)
    app.register_blueprint(predict_bp, url_prefix=API_PREFIX)
    _register_error_handlers(app)
    _register_security_headers(app)
    _warm_models()
    return app


def _register_security_headers(app: Flask) -> None:
    """Add conservative security headers to every response.

    The API only ever returns JSON, so the content policy can be locked right
    down. HSTS is included for when it is served over HTTPS (browsers ignore it
    on plain-HTTP localhost); the edge/CDN may also set it.
    """

    @app.after_request
    def _apply_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


def _warm_models() -> None:
    # Load the artifacts once now so the first prediction is fast, and so a
    # missing-model problem shows up at startup instead of on the first request.
    try:
        from ml.predict import get_predictor

        get_predictor()
        logger.info("Model pipeline warmed and ready.")
    except Exception as exc:  # noqa: BLE001 - only for startup diagnostics
        logger.warning("Could not warm the model pipeline: %s", exc)


def _register_error_handlers(app: Flask) -> None:
    """Return every error as the same JSON shape: error_code, message, field."""

    @app.errorhandler(ApiError)
    def _handle_api_error(err: ApiError):
        return jsonify(err.to_dict()), err.status_code

    @app.errorhandler(Exception)
    def _handle_unexpected(err: Exception):
        # Known HTTP errors (404, 405, ...) keep their status; anything else is
        # a real bug, logged and reported as a 500.
        if isinstance(err, HTTPException):
            return (
                jsonify(
                    {
                        "error_code": (err.name or "error").lower().replace(" ", "_"),
                        "message": err.description or "Request could not be processed.",
                        "field": None,
                    }
                ),
                err.code,
            )
        logger.exception("Unhandled error")
        return (
            jsonify(
                {
                    "error_code": "internal_error",
                    "message": "Something went wrong while handling the request.",
                    "field": None,
                }
            ),
            500,
        )


def main() -> None:
    """Run the development server."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    port = int(os.environ.get("PORT", 5001))
    create_app().run(host="0.0.0.0", port=port, debug=False)


if __name__ == "__main__":
    main()
