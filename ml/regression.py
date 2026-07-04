"""Academic score regression (Layer 2).

AcademicScorePredictor trains and compares regressors on the DS3 exam-score data.
It adds a few interaction features, grid-tunes the random forest and XGBoost,
prints a metric table, and saves the best estimator. The estimator is stored bare
(it expects the interaction-augmented features), so inference just rebuilds the
interactions first. The DS2/DS4 transfer is handled separately in further stage...probably in the cross dataset validation stage.
"""

import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import GridSearchCV, learning_curve
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor

from ml import config
from ml.preprocessing import prepare_regression_data

logger = logging.getLogger(__name__)


def add_interaction_features(features: pd.DataFrame) -> pd.DataFrame:
    """Add the configured pairwise interaction features.

    Reorders the base columns to config.DS3_FEATURES first, so the output layout
    is identical at train and inference time whatever order the caller passed in.
    """
    engineered = features[config.DS3_FEATURES].copy()
    for left, right in config.DS3_INTERACTION_PAIRS:
        engineered[f"{left}_x_{right}"] = engineered[left] * engineered[right]
    return engineered


class AcademicScorePredictor:
    """Trains, tunes, and compares regressors for the exam score."""

    def __init__(self) -> None:
        self.models_: dict[str, object] = {}
        self.metrics_: Optional[pd.DataFrame] = None
        self.best_name_: Optional[str] = None
        self.best_estimator_: Optional[object] = None
        self.rf_best_params_: Optional[dict] = None
        self.xgb_best_params_: Optional[dict] = None
        self.base_feature_names_: list[str] = list(config.DS3_FEATURES)

    def _candidate_models(self) -> dict[str, object]:
        """The untrained candidates (RF and XGB get tuned afterwards)."""
        return {
            "linear_regression": Pipeline(
                [("scaler", StandardScaler()), ("model", LinearRegression())]
            ),
            "random_forest": RandomForestRegressor(**config.RF_REGRESSOR_PARAMS),
            "xgboost": XGBRegressor(**config.XGB_REGRESSOR_PARAMS),
        }

    @staticmethod
    def _grid_search(estimator, grid: dict, x_train, y_train):
        """Run a CV grid search and return (best_estimator, best_params)."""
        search = GridSearchCV(
            estimator,
            grid,
            cv=config.CV_FOLDS,
            scoring="neg_root_mean_squared_error",
            n_jobs=-1,
        )
        search.fit(x_train, y_train)
        return search.best_estimator_, search.best_params_

    @staticmethod
    def _score(name, model, x_train, y_train, x_test, y_test) -> dict:
        """Train/test metrics for one fitted model."""
        train_pred = model.predict(x_train)
        test_pred = model.predict(x_test)
        return {
            "model": name,
            "train_rmse": round(root_mean_squared_error(y_train, train_pred), 3),
            "test_rmse": round(root_mean_squared_error(y_test, test_pred), 3),
            "test_mae": round(mean_absolute_error(y_test, test_pred), 3),
            "test_r2": round(r2_score(y_test, test_pred), 3),
        }

    def fit(self, x_train, y_train, x_test, y_test) -> "AcademicScorePredictor":
        """Add interactions, tune RF and XGBoost, and keep the best by test RMSE."""
        train_features = add_interaction_features(x_train)
        test_features = add_interaction_features(x_test)

        models = self._candidate_models()
        models["random_forest"], self.rf_best_params_ = self._grid_search(
            RandomForestRegressor(random_state=config.RANDOM_SEED),
            config.RF_REGRESSOR_PARAM_GRID,
            train_features,
            y_train,
        )
        models["xgboost"], self.xgb_best_params_ = self._grid_search(
            XGBRegressor(random_state=config.RANDOM_SEED),
            config.XGB_REGRESSOR_PARAM_GRID,
            train_features,
            y_train,
        )
        logger.info("RF best params: %s", self.rf_best_params_)
        logger.info("XGBoost best params: %s", self.xgb_best_params_)

        rows = []
        for name, model in models.items():
            model.fit(train_features, y_train)
            self.models_[name] = model
            rows.append(self._score(name, model, train_features, y_train, test_features, y_test))

        self.metrics_ = pd.DataFrame(rows).set_index("model")
        self.best_name_ = self.metrics_["test_rmse"].idxmin()
        self.best_estimator_ = self.models_[self.best_name_]
        logger.info("Best regressor: %s", self.best_name_)
        return self

    def predict(self, base_features: pd.DataFrame) -> np.ndarray:
        """Predict exam scores from the six base features (interactions added here)."""
        if self.best_estimator_ is None:
            raise RuntimeError("AcademicScorePredictor must be fitted before use.")
        return self.best_estimator_.predict(add_interaction_features(base_features))

    def plot_actual_vs_predicted(self, x_test, y_test, save_path: Optional[Path] = None):
        """Actual vs predicted scatter for the best model."""
        import matplotlib.pyplot as plt

        predicted = self.predict(x_test)
        fig, ax = plt.subplots(figsize=(6, 6))
        ax.scatter(y_test, predicted, s=12, alpha=0.4, color=config.BRAND_PRIMARY)
        limits = [min(y_test.min(), predicted.min()), max(y_test.max(), predicted.max())]
        ax.plot(limits, limits, color=config.RISK_PALETTE["High Risk"], linestyle="--")
        ax.set_xlabel("Actual exam score")
        ax.set_ylabel("Predicted exam score")
        ax.set_title(f"Actual vs predicted ({self.best_name_})")
        fig.tight_layout()
        if save_path:
            fig.savefig(save_path, dpi=120, bbox_inches="tight")
        return fig

    def plot_residuals(self, x_test, y_test, save_path: Optional[Path] = None):
        """Residuals against predictions for the best model."""
        import matplotlib.pyplot as plt

        predicted = self.predict(x_test)
        residuals = y_test - predicted
        fig, ax = plt.subplots(figsize=(7, 4.5))
        ax.scatter(predicted, residuals, s=12, alpha=0.4, color=config.BRAND_PRIMARY)
        ax.axhline(0, color=config.RISK_PALETTE["High Risk"], linestyle="--")
        ax.set_xlabel("Predicted exam score")
        ax.set_ylabel("Residual (actual - predicted)")
        ax.set_title(f"Residuals ({self.best_name_})")
        fig.tight_layout()
        if save_path:
            fig.savefig(save_path, dpi=120, bbox_inches="tight")
        return fig

    def plot_learning_curve(self, x_train, y_train, save_path: Optional[Path] = None):
        """Learning curve (train vs cross-validated RMSE) for the best model."""
        import matplotlib.pyplot as plt

        sizes, train_scores, val_scores = learning_curve(
            self.best_estimator_,
            add_interaction_features(x_train),
            y_train,
            cv=config.CV_FOLDS,
            scoring="neg_root_mean_squared_error",
            train_sizes=np.linspace(0.1, 1.0, 5),
            n_jobs=-1,
        )
        fig, ax = plt.subplots(figsize=(7, 4.5))
        ax.plot(sizes, -train_scores.mean(axis=1), marker="o", label="Train RMSE", color=config.BRAND_PRIMARY)
        ax.plot(sizes, -val_scores.mean(axis=1), marker="o", label="CV RMSE", color=config.RISK_PALETTE["High Risk"])
        ax.set_xlabel("Training examples")
        ax.set_ylabel("RMSE")
        ax.set_title(f"Learning curve ({self.best_name_})")
        ax.legend()
        fig.tight_layout()
        if save_path:
            fig.savefig(save_path, dpi=120, bbox_inches="tight")
        return fig

    def save(self, path: Path = config.REGRESSOR_PATH) -> None:
        """Save the best estimator.

        Saved bare (it expects the interaction-augmented matrix); inference calls
        add_interaction_features on the six base features first. Keeping it bare
        avoids pickling a function reference, which tends to break across
        processes.
        """
        if self.best_estimator_ is None:
            raise RuntimeError("Nothing to save; fit the predictor first.")
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.best_estimator_, path)
        logger.info("Saved regressor (%s) -> %s", self.best_name_, path)

    @classmethod
    def load(cls, path: Path = config.REGRESSOR_PATH):
        """Load the saved estimator (expects interaction-augmented input)."""
        return joblib.load(path)


def main() -> None:
    """Train on DS3, print the metrics, and save the best estimator."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    data = prepare_regression_data(save=False)
    predictor = AcademicScorePredictor().fit(
        data["X_train"], data["y_train"], data["X_test"], data["y_test"]
    )
    logger.info("\n%s", predictor.metrics_.to_string())
    predictor.save()


if __name__ == "__main__":
    main()
