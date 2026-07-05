"""Health check endpoint.

Deployment platforms ping this to confirm the service is alive, so it stays
cheap: it just checks the model files are on disk rather than loading them.
"""

from flask import Blueprint, jsonify

from ml import config

health_bp = Blueprint("health", __name__)

_ARTIFACTS = [
    config.PREPROCESSOR_PATH,
    config.CLUSTERER_PATH,
    config.CLUSTER_SCALER_PATH,
    config.REGRESSOR_PATH,
    config.CLASSIFIER_PATH,
    config.CLASSIFIER_BINARY_PATH,
]


@health_bp.get("/health")
def health():
    """Report service status and a few facts about what it was trained on."""
    models_present = all(path.exists() for path in _ARTIFACTS)
    return jsonify(
        {
            "status": "healthy" if models_present else "degraded",
            "models_loaded": models_present,
            "datasets_trained_on": config.DATASETS_TRAINED_ON,
            "total_training_records": config.TOTAL_TRAINING_RECORDS,
            "api_version": config.API_VERSION,
        }
    )
