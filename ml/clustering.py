"""K-Means clustering of students into behavioral profiles (Layer 1).

StudentProfileClusterer scales the behavioral features, sweeps k over a range,
and fits K-Means. The silhouette curve suggests a k, but the final count is a
deliberate product choice (see config); the elbow and silhouette are both kept
so the notebook can show the trade-off. A 2D PCA is fitted just for plotting.
The scaler is learned on the training split only and saved on its own.
"""

import logging
from pathlib import Path
from typing import Optional, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from data.data_loader import load_dataset
from ml import config
from ml.preprocessing import BehavioralPreprocessor

logger = logging.getLogger(__name__)


def load_cluster_training_features() -> pd.DataFrame:
    """Build the clustering features from the DS1 training split.

    Uses the same stratified split as the classification pipeline so the test
    rows stay unseen, then leans on the saved preprocessor to engineer and
    impute the configured cluster features.
    """
    raw = load_dataset("behavioral_analytics")
    train_raw, _ = train_test_split(
        raw,
        test_size=config.TEST_SIZE,
        random_state=config.RANDOM_SEED,
        stratify=raw[config.DS1_TARGET],
    )
    preprocessor = BehavioralPreprocessor.load()
    return preprocessor.cluster_matrix(train_raw)


class StudentProfileClusterer:
    """K-Means over the behavioral feature space."""

    def __init__(self, k_min: int = config.CLUSTER_K_MIN, k_max: int = config.CLUSTER_K_MAX) -> None:
        self.k_min = k_min
        self.k_max = k_max
        self.feature_names = list(config.DS1_CLUSTER_FEATURES)

        self.scaler_: Optional[StandardScaler] = None
        self.kmeans_: Optional[KMeans] = None
        self.pca_: Optional[PCA] = None
        self.optimal_k_: Optional[int] = None
        self.silhouette_optimal_k_: Optional[int] = None
        self.inertias_: dict[int, float] = {}
        self.silhouette_scores_: dict[int, float] = {}
        self.labels_: Optional[np.ndarray] = None
        self._training_features: Optional[pd.DataFrame] = None

    def _evaluate_k(self, scaled: np.ndarray) -> None:
        """Record inertia and silhouette for every candidate k."""
        for k in range(self.k_min, self.k_max + 1):
            model = KMeans(n_clusters=k, random_state=config.RANDOM_SEED, n_init=10)
            labels = model.fit_predict(scaled)
            self.inertias_[k] = float(model.inertia_)
            self.silhouette_scores_[k] = float(silhouette_score(scaled, labels))

    def fit(self, features: pd.DataFrame, n_clusters: Optional[int] = None) -> "StudentProfileClusterer":
        """Fit on the imputed, unscaled cluster features.

        Pass n_clusters to force a specific k; otherwise the count comes from
        config (CLUSTER_COUNT). Either way the silhouette-optimal k is recorded
        alongside so the chosen value can be compared against it.
        """
        features = features[self.feature_names]
        self._training_features = features.reset_index(drop=True)

        self.scaler_ = StandardScaler().fit(features)
        scaled = self.scaler_.transform(features)

        self._evaluate_k(scaled)
        self.silhouette_optimal_k_ = max(self.silhouette_scores_, key=self.silhouette_scores_.get)
        self.optimal_k_ = n_clusters or config.CLUSTER_COUNT
        logger.info(
            "Silhouette by k: %s",
            {k: round(v, 3) for k, v in self.silhouette_scores_.items()},
        )
        logger.info(
            "Silhouette-optimal k = %d (%.3f); using k = %d (product choice).",
            self.silhouette_optimal_k_,
            self.silhouette_scores_[self.silhouette_optimal_k_],
            self.optimal_k_,
        )

        self.kmeans_ = KMeans(
            n_clusters=self.optimal_k_, random_state=config.RANDOM_SEED, n_init=10
        ).fit(scaled)
        self.labels_ = self.kmeans_.labels_
        self.pca_ = PCA(n_components=config.PCA_N_COMPONENTS, random_state=config.RANDOM_SEED).fit(scaled)
        return self

    def _check_fitted(self) -> None:
        if self.kmeans_ is None:
            raise RuntimeError("StudentProfileClusterer must be fitted before use.")

    def get_cluster_profiles(self) -> pd.DataFrame:
        """Mean of each feature within each cluster, plus a size column."""
        self._check_fitted()
        profiles = self._training_features.copy()
        profiles["cluster"] = self.labels_
        summary = profiles.groupby("cluster").mean().round(3)
        summary["size"] = profiles.groupby("cluster").size()
        return summary

    def cluster_name(self, cluster_id: int) -> str:
        """Name for a cluster id (falls back to 'Cluster N')."""
        return config.CLUSTER_NAMES.get(cluster_id, f"Cluster {cluster_id}")

    def cluster_description(self, cluster_id: int) -> str:
        """Description for a cluster id."""
        return config.CLUSTER_DESCRIPTIONS.get(cluster_id, "")

    def predict_cluster(self, student_features: Union[dict, pd.Series]) -> dict:
        """Assign one student to a cluster.

        Takes the engineered cluster-feature values (as the preprocessor
        produces them) and returns the cluster id, its name and description, and
        the distance to the assigned centroid in scaled space.
        """
        self._check_fitted()
        vector = pd.DataFrame([{name: student_features[name] for name in self.feature_names}])
        scaled = self.scaler_.transform(vector)
        cluster_id = int(self.kmeans_.predict(scaled)[0])
        distance = float(np.linalg.norm(scaled[0] - self.kmeans_.cluster_centers_[cluster_id]))
        return {
            "cluster_id": cluster_id,
            "cluster_name": self.cluster_name(cluster_id),
            "cluster_description": self.cluster_description(cluster_id),
            "nearest_centroid_distance": round(distance, 4),
        }

    def pca_coordinates(self, features: Optional[pd.DataFrame] = None) -> np.ndarray:
        """Project features into the fitted 2D PCA space (training data by default)."""
        self._check_fitted()
        if features is None:
            features = self._training_features
        scaled = self.scaler_.transform(features[self.feature_names])
        return self.pca_.transform(scaled)

    def plot_elbow(self, save_path: Optional[Path] = None):
        """Inertia (elbow) curve across the candidate k values."""
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(7, 4))
        ks = list(self.inertias_)
        ax.plot(ks, [self.inertias_[k] for k in ks], marker="o", color=config.BRAND_PRIMARY)
        ax.axvline(self.optimal_k_, color=config.RISK_PALETTE["High Risk"], linestyle="--", label=f"k = {self.optimal_k_}")
        ax.set_xlabel("Number of clusters (k)")
        ax.set_ylabel("Inertia")
        ax.set_title("Elbow method")
        ax.legend()
        fig.tight_layout()
        if save_path:
            fig.savefig(save_path, dpi=120, bbox_inches="tight")
        return fig

    def plot_silhouette(self, save_path: Optional[Path] = None):
        """Silhouette curve, marking both the peak and the chosen k."""
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(7, 4))
        ks = list(self.silhouette_scores_)
        ax.plot(ks, [self.silhouette_scores_[k] for k in ks], marker="o", color=config.BRAND_PRIMARY)
        ax.axvline(self.silhouette_optimal_k_, color=config.RISK_PALETTE["Low Risk"], linestyle=":", label=f"silhouette peak (k = {self.silhouette_optimal_k_})")
        ax.axvline(self.optimal_k_, color=config.RISK_PALETTE["High Risk"], linestyle="--", label=f"chosen k = {self.optimal_k_}")
        ax.set_xlabel("Number of clusters (k)")
        ax.set_ylabel("Silhouette score")
        ax.set_title("Silhouette analysis")
        ax.legend()
        fig.tight_layout()
        if save_path:
            fig.savefig(save_path, dpi=120, bbox_inches="tight")
        return fig

    def plot_pca_scatter(self, save_path: Optional[Path] = None):
        """Training data in 2D PCA space, coloured by cluster."""
        import matplotlib.pyplot as plt

        coords = self.pca_coordinates()
        fig, ax = plt.subplots(figsize=(8, 6))
        for cluster_id in sorted(set(self.labels_)):
            mask = self.labels_ == cluster_id
            ax.scatter(
                coords[mask, 0], coords[mask, 1], s=18, alpha=0.6,
                label=f"{cluster_id}: {self.cluster_name(cluster_id)}",
            )
        variance = self.pca_.explained_variance_ratio_
        ax.set_xlabel(f"PC1 ({variance[0] * 100:.1f}% var)")
        ax.set_ylabel(f"PC2 ({variance[1] * 100:.1f}% var)")
        ax.set_title("Student behavioral clusters (PCA projection)")
        ax.legend(fontsize=8)
        fig.tight_layout()
        if save_path:
            fig.savefig(save_path, dpi=120, bbox_inches="tight")
        return fig

    def save(self, path: Path = config.CLUSTERER_PATH) -> None:
        """Save the fitted clusterer and its scaler (cached training data stripped out)."""
        self._check_fitted()
        path.parent.mkdir(parents=True, exist_ok=True)
        cached = self._training_features
        self._training_features = None
        try:
            joblib.dump(self.scaler_, config.CLUSTER_SCALER_PATH)
            joblib.dump(self, path)
        finally:
            self._training_features = cached
        logger.info("Saved clusterer -> %s (scaler -> %s)", path, config.CLUSTER_SCALER_PATH)

    @classmethod
    def load(cls, path: Path = config.CLUSTERER_PATH) -> "StudentProfileClusterer":
        """Load a saved clusterer."""
        return joblib.load(path)


def main() -> None:
    """Fit on the training split and log the chosen k and cluster sizes."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    features = load_cluster_training_features()
    clusterer = StudentProfileClusterer().fit(features)
    logger.info("Cluster sizes: %s", clusterer.get_cluster_profiles()["size"].to_dict())


if __name__ == "__main__":
    main()
