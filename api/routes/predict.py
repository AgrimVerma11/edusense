"""Prediction, what-if, and cluster-profile endpoints."""

from flask import Blueprint, jsonify, request

from api.extensions import limiter
from api.schemas import validate_student_payload, validate_what_if_payload
from ml import config
from ml.predict import get_predictor, predict_student, what_if_student

predict_bp = Blueprint("predict", __name__)


# Limits are deliberately generous: students on the same campus network share one
# public IP, so tight per-IP limits would lock out a whole lab. This is a floor
# against a single client hammering the model, not fine-grained fairness (the CDN
# handles that at the edge).
@predict_bp.post("/predict")
@limiter.limit("60 per minute;1000 per hour")
def predict():
    """Full four-layer prediction for one student profile."""
    payload = validate_student_payload(request.get_json(silent=True))
    return jsonify(predict_student(payload))


@predict_bp.post("/what-if")
@limiter.limit("120 per minute;2000 per hour")
def what_if():
    """Re-score a student after changing one or more inputs together."""
    student, modifications = validate_what_if_payload(request.get_json(silent=True))
    return jsonify(what_if_student(student, modifications))


# Cluster profiles don't change between requests, so build them once and reuse.
_profiles_cache: list | None = None


@predict_bp.get("/cluster-profiles")
def cluster_profiles():
    """Per-cluster feature means and labels, for the insights dashboard."""
    global _profiles_cache
    if _profiles_cache is None:
        _profiles_cache = _build_cluster_profiles()
    return jsonify({"clusters": _profiles_cache})


def _build_cluster_profiles() -> list:
    """Recompute the cluster feature means from the training features.

    The saved clusterer drops its cached training data to stay small, so we
    reload the training cluster matrix, label it with the fitted model, and
    average per cluster.
    """
    from ml.clustering import load_cluster_training_features

    clusterer = get_predictor().clusterer
    features = load_cluster_training_features()
    scaled = clusterer.scaler_.transform(features[clusterer.feature_names])
    labels = clusterer.kmeans_.predict(scaled)

    frame = features.copy()
    frame["cluster"] = labels
    means = frame.groupby("cluster").mean().round(3)

    profiles = []
    for cluster_id, row in means.iterrows():
        cid = int(cluster_id)
        profiles.append(
            {
                "id": cid,
                "name": clusterer.cluster_name(cid),
                "display_name": config.CLUSTER_DISPLAY_NAMES.get(cid, clusterer.cluster_name(cid)),
                "description": clusterer.cluster_description(cid),
                "size": int((labels == cid).sum()),
                "feature_means": row.to_dict(),
            }
        )
    return profiles
