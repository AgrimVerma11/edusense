"""Preprocessing for EduSense.

BehavioralPreprocessor turns the DS1 behavioural survey into a model-ready
matrix: it builds the procrastination proxy, fills the gaps, encodes the ordinal
and nominal columns, and scales the numeric block. Everything it learns
(medians, scaler, one-hot categories) comes from the training split only and is
saved for inference. The functions after it prep the DS3 regression data and the
DS2/DS4 validation sets for the cross-dataset step.
"""

import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from data.data_loader import load_dataset
from ml import config

logger = logging.getLogger(__name__)


def derive_procrastination_level(frame: pd.DataFrame) -> pd.Series:
    """Build the ordinal procrastination_level proxy.

    Adds up the per-feature component scores from config and bins the total into
    Low/Medium/High. Returns a categorical series lined up with the frame.
    """
    score = pd.Series(0.0, index=frame.index)
    for column, mapping in config.PROCRASTINATION_COMPONENT_SCORES.items():
        score = score + frame[column].map(mapping).fillna(0)
    return pd.cut(
        score,
        bins=config.PROCRASTINATION_SCORE_BINS,
        labels=config.PROCRASTINATION_LEVELS,
    )


class BehavioralPreprocessor:
    """Fit/transform pipeline for the DS1 behavioural dataset.

    The output is fully numeric: the continuous block (numerics + ordinal codes +
    the procrastination level) is median-imputed and scaled, and the nominal
    columns are one-hot encoded. Everything learned is fit on training data only.
    """

    def __init__(self) -> None:
        self.numeric_features = list(config.DS1_NUMERIC_FEATURES)
        self.ordinal_features = list(config.DS1_ORDINAL_FEATURES)
        self.nominal_features = list(config.DS1_NOMINAL_FEATURES)
        self.derived_features = list(config.DS1_DERIVED_FEATURES)
        # The continuous block: numerics, ordinal codes, and procrastination.
        self.continuous_features = (
            self.numeric_features + self.ordinal_features + self.derived_features
        )

        self.medians_: Optional[pd.Series] = None
        self.scaler_: Optional[StandardScaler] = None
        self.encoder_: Optional[OneHotEncoder] = None
        self.ohe_feature_names_: list[str] = []
        self.feature_names_: list[str] = []

    def _engineer(self, frame: pd.DataFrame) -> pd.DataFrame:
        """Derive procrastination and turn the ordinals into integer codes.

        Nominal columns are left as raw labels for the one-hot step.
        """
        work = frame.copy()
        work[config.PROCRASTINATION_FEATURE] = derive_procrastination_level(work)

        for column, order in config.DS1_ORDINAL_FEATURES.items():
            code_map = {category: rank for rank, category in enumerate(order)}
            work[column] = work[column].map(code_map)

        proc_map = {level: rank for rank, level in enumerate(config.PROCRASTINATION_LEVELS)}
        work[config.PROCRASTINATION_FEATURE] = pd.to_numeric(
            work[config.PROCRASTINATION_FEATURE].astype(object).map(proc_map)
        )
        return work

    def fit(self, frame: pd.DataFrame) -> "BehavioralPreprocessor":
        """Learn the medians, scaler, and encoder from the training split."""
        work = self._engineer(frame)

        self.medians_ = work[self.continuous_features].median()
        imputed = work[self.continuous_features].fillna(self.medians_)

        self.scaler_ = StandardScaler().fit(imputed)
        self.encoder_ = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
        self.encoder_.fit(work[self.nominal_features])

        self.ohe_feature_names_ = list(
            self.encoder_.get_feature_names_out(self.nominal_features)
        )
        self.feature_names_ = self.continuous_features + self.ohe_feature_names_
        logger.info(
            "Fitted BehavioralPreprocessor: %d continuous + %d one-hot = %d features",
            len(self.continuous_features),
            len(self.ohe_feature_names_),
            len(self.feature_names_),
        )
        return self

    def _check_fitted(self) -> None:
        if self.scaler_ is None or self.encoder_ is None:
            raise RuntimeError("BehavioralPreprocessor must be fitted before use.")

    def transform(self, frame: pd.DataFrame) -> tuple[pd.DataFrame, Optional[pd.Series]]:
        """Turn raw DS1 rows into the model-ready matrix.

        Returns the feature matrix and the encoded target, or None for the target
        when its column isn't present (as at inference time).
        """
        self._check_fitted()
        work = self._engineer(frame)
        imputed = work[self.continuous_features].fillna(self.medians_)

        scaled = self.scaler_.transform(imputed)
        encoded = self.encoder_.transform(work[self.nominal_features])
        features = pd.DataFrame(
            np.hstack([scaled, encoded]),
            columns=self.feature_names_,
            index=frame.index,
        )

        target = None
        if config.DS1_TARGET in frame.columns:
            target = frame[config.DS1_TARGET].map(config.RISK_LABEL_MAP)
        return features, target

    def fit_transform(self, frame: pd.DataFrame) -> tuple[pd.DataFrame, Optional[pd.Series]]:
        """Fit on the frame, then return its transformed matrix."""
        return self.fit(frame).transform(frame)

    def cluster_matrix(self, frame: pd.DataFrame) -> pd.DataFrame:
        """The imputed, unscaled clustering features.

        Clustering scales these itself, so they come back engineered and
        median-imputed but not standardised.
        """
        self._check_fitted()
        work = self._engineer(frame)
        imputed = work[self.continuous_features].fillna(self.medians_)
        return imputed[config.DS1_CLUSTER_FEATURES].copy()

    def save(self, path: Path = config.PREPROCESSOR_PATH) -> None:
        """Save the fitted preprocessor."""
        self._check_fitted()
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)
        logger.info("Saved preprocessor -> %s", path)

    @classmethod
    def load(cls, path: Path = config.PREPROCESSOR_PATH) -> "BehavioralPreprocessor":
        """Load a saved preprocessor."""
        return joblib.load(path)


def prepare_primary_data(save: bool = True) -> dict:
    """Split DS1, fit the preprocessor on the train split, transform both.

    Optionally saves the fitted preprocessor and the processed CSVs. Returns the
    train/test splits plus the preprocessor.
    """
    raw = load_dataset("behavioral_analytics")
    train_raw, test_raw = train_test_split(
        raw,
        test_size=config.TEST_SIZE,
        random_state=config.RANDOM_SEED,
        stratify=raw[config.DS1_TARGET],
    )

    preprocessor = BehavioralPreprocessor().fit(train_raw)
    x_train, y_train = preprocessor.transform(train_raw)
    x_test, y_test = preprocessor.transform(test_raw)
    logger.info(
        "Primary data prepared: train=%d, test=%d, features=%d",
        len(x_train),
        len(x_test),
        x_train.shape[1],
    )

    if save:
        preprocessor.save()
        x_train.assign(**{config.DS1_TARGET: y_train.values}).to_csv(
            config.PRIMARY_TRAIN_PATH, index=False
        )
        x_test.assign(**{config.DS1_TARGET: y_test.values}).to_csv(
            config.PRIMARY_TEST_PATH, index=False
        )
        logger.info("Wrote %s and %s", config.PRIMARY_TRAIN_PATH.name, config.PRIMARY_TEST_PATH.name)

    return {
        "X_train": x_train,
        "X_test": x_test,
        "y_train": y_train,
        "y_test": y_test,
        "preprocessor": preprocessor,
    }


def prepare_regression_data(save: bool = True) -> dict:
    """Split DS3 into the regression train/test sets.

    Scaling happens inside the model pipelines later, so these are just the raw
    numeric features and the target.
    """
    raw = load_dataset("performance_prediction")
    features = raw[config.DS3_FEATURES]
    target = raw[config.DS3_TARGET]

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=config.TEST_SIZE,
        random_state=config.RANDOM_SEED,
    )
    logger.info(
        "Regression data prepared from DS3: train=%d, test=%d, features=%d",
        len(x_train),
        len(x_test),
        x_train.shape[1],
    )

    if save:
        x_train.assign(**{config.DS3_TARGET: y_train.values}).to_csv(
            config.REGRESSION_TRAIN_PATH, index=False
        )
        x_test.assign(**{config.DS3_TARGET: y_test.values}).to_csv(
            config.REGRESSION_TEST_PATH, index=False
        )
        logger.info(
            "Wrote %s and %s",
            config.REGRESSION_TRAIN_PATH.name,
            config.REGRESSION_TEST_PATH.name,
        )

    return {"X_train": x_train, "X_test": x_test, "y_train": y_train, "y_test": y_test}


# Dataset key -> loader name, for the validation-set extraction.
_VALIDATION_SOURCES = {
    "ds2": "zenodo_merged",
    "ds4": "performance_factors",
}


def prepare_validation_set(dataset_key: str, save: bool = True) -> pd.DataFrame:
    """Pull one cross-dataset validation set into canonical feature space.

    Keeps the columns that map to the shared canonical features, renames them to
    the canonical names, and appends the exam score as exam_score. DS2 is
    de-duplicated first. dataset_key is 'ds2' (control) or 'ds4' (holdout).
    """
    if dataset_key not in _VALIDATION_SOURCES:
        raise KeyError(f"Unsupported validation dataset '{dataset_key}'.")

    raw = load_dataset(_VALIDATION_SOURCES[dataset_key])
    if dataset_key == "ds2":
        before = len(raw)
        raw = raw.drop_duplicates().reset_index(drop=True)
        logger.info("DS2 de-duplicated: %d -> %d rows", before, len(raw))

    columns = {
        canonical: mapping[dataset_key]
        for canonical, mapping in config.CROSS_DATASET_FEATURE_MAP.items()
        if mapping[dataset_key] is not None
    }
    extracted = pd.DataFrame(
        {canonical: raw[column] for canonical, column in columns.items()}
    )
    extracted["exam_score"] = raw[config.CROSS_DATASET_REGRESSION_TARGETS[dataset_key]]
    logger.info(
        "Validation set %s prepared: %d rows, shared features %s",
        dataset_key,
        len(extracted),
        list(columns.keys()),
    )

    if save:
        path = config.VAL_DS2_PATH if dataset_key == "ds2" else config.VAL_DS4_PATH
        extracted.to_csv(path, index=False)
        logger.info("Wrote %s", path.name)

    return extracted


def main() -> None:
    """Run the whole preprocessing pipeline and write every processed file."""
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s"
    )
    prepare_primary_data(save=True)
    prepare_regression_data(save=True)
    prepare_validation_set("ds2", save=True)
    prepare_validation_set("ds4", save=True)
    logger.info("Preprocessing complete.")


if __name__ == "__main__":
    main()
