"""Dataset loading and audit utilities for EduSense.

Loads the four source datasets from disk, validates each against the schema
declared in :mod:`ml.config`, and emits a structured audit summary. Validation
runs before any modelling so that drift in shape, columns, or null profile is
caught immediately rather than surfacing as a confusing failure deep in the
pipeline.

"""

import sys
from pathlib import Path

# This script lives in data/ but imports the top-level ``ml`` package. Add the
# project root to the import path so it runs both standalone and as an import.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import logging  # noqa: E402

import pandas as pd  # noqa: E402
from tabulate import tabulate  # noqa: E402

from ml import config  # noqa: E402

logger = logging.getLogger(__name__)

# Dataset key -> raw CSV path.
DATASET_PATHS: dict[str, Path] = {
    "behavioral_analytics": config.DS1_RAW_PATH,
    "zenodo_merged": config.DS2_RAW_PATH,
    "performance_prediction": config.DS3_RAW_PATH,
    "performance_factors": config.DS4_RAW_PATH,
}


class DatasetValidationError(Exception):
    """Raised when a loaded dataset does not match its expected schema."""


def _ds1_expected_columns() -> set[str]:
    """Return every column the primary dataset is expected to contain.

    The union of identifier, excluded, numeric, ordinal, nominal, and target
    columns declared in config. Used to assert that no DS1 column is left
    unclassified.

    Returns:
        Set of expected column names for ``behavioral_analytics``.
    """
    return (
        set(config.DS1_ID_COLUMNS)
        | set(config.DS1_EXCLUDED_FEATURES)
        | set(config.DS1_NUMERIC_FEATURES)
        | set(config.DS1_ORDINAL_FEATURES)
        | set(config.DS1_NOMINAL_FEATURES)
        | {config.DS1_TARGET}
    )


def _cross_dataset_columns(dataset_key: str) -> set[str]:
    """Return the columns mapped for a dataset in the cross-dataset feature map.

    Args:
        dataset_key: One of ``"ds2"``, ``"ds3"``, ``"ds4"``.

    Returns:
        Set of non-null column names mapped for that dataset.
    """
    return {
        mapping[dataset_key]
        for mapping in config.CROSS_DATASET_FEATURE_MAP.values()
        if mapping[dataset_key] is not None
    }


# Minimum set of columns each dataset must contain to be usable downstream.
REQUIRED_COLUMNS: dict[str, set[str]] = {
    "behavioral_analytics": _ds1_expected_columns(),
    "zenodo_merged": (
        set(config.DS2_FEATURES)
        | {config.DS2_TARGET}
        | set(config.DS2_DROP_COLUMNS)
    ),
    "performance_prediction": (
        {config.DS3_TARGET, config.DS3_PLACEMENT_COLUMN}
        | _cross_dataset_columns("ds3")
    ),
    "performance_factors": {config.DS4_TARGET} | _cross_dataset_columns("ds4"),
}


def _validate_shape(name: str, df: pd.DataFrame) -> None:
    """Assert the dataset matches its expected (rows, columns) shape.

    Args:
        name: Dataset key.
        df: Loaded dataframe.

    Raises:
        DatasetValidationError: If the shape differs from config.
    """
    expected = config.DATASET_EXPECTED_SHAPES.get(name)
    if expected is not None and df.shape != expected:
        raise DatasetValidationError(
            f"{name}: expected shape {expected}, found {df.shape}"
        )


def _validate_columns(name: str, df: pd.DataFrame) -> None:
    """Assert required columns are present (and fully classified for DS1).

    Args:
        name: Dataset key.
        df: Loaded dataframe.

    Raises:
        DatasetValidationError: If required columns are missing, or (for the
            primary dataset) if any column is not classified in config.
    """
    required = REQUIRED_COLUMNS.get(name, set())
    actual = set(df.columns)

    missing = required - actual
    if missing:
        raise DatasetValidationError(
            f"{name}: missing required columns {sorted(missing)}"
        )

    if name == "behavioral_analytics":
        unaccounted = actual - required
        if unaccounted:
            raise DatasetValidationError(
                f"{name}: columns present in data but not classified in "
                f"config {sorted(unaccounted)}"
            )


def load_dataset(name: str, validate: bool = True) -> pd.DataFrame:
    """Load a single dataset by key, optionally validating its schema.

    Args:
        name: One of the keys in :data:`DATASET_PATHS`.
        validate: If True, validate shape and columns against config.

    Returns:
        The loaded dataframe.

    Raises:
        KeyError: If ``name`` is not a known dataset.
        FileNotFoundError: If the CSV file does not exist.
        DatasetValidationError: If validation is enabled and fails.
    """
    if name not in DATASET_PATHS:
        raise KeyError(
            f"Unknown dataset '{name}'. Known datasets: {sorted(DATASET_PATHS)}"
        )

    path = DATASET_PATHS[name]
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {path}")

    df = pd.read_csv(path)
    logger.info(
        "Loaded %s: %d rows x %d columns from %s",
        name,
        df.shape[0],
        df.shape[1],
        path.name,
    )

    if validate:
        _validate_shape(name, df)
        _validate_columns(name, df)
        logger.info("%s passed schema validation.", name)

    return df


def load_all_datasets(validate: bool = True) -> dict[str, pd.DataFrame]:
    """Load all four datasets into a mapping of name to dataframe.

    Args:
        validate: If True, validate each dataset against config.

    Returns:
        Dict mapping dataset key to its loaded dataframe.
    """
    return {name: load_dataset(name, validate=validate) for name in DATASET_PATHS}


def build_audit_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Build a per-column audit summary for a dataframe.

    Args:
        df: Dataframe to summarise.

    Returns:
        Dataframe with one row per column reporting dtype, non-null and null
        counts, null percentage, and cardinality.
    """
    summary = pd.DataFrame(
        {
            "dtype": df.dtypes.astype(str),
            "non_null": df.notnull().sum(),
            "nulls": df.isnull().sum(),
            "null_pct": (df.isnull().mean() * 100).round(2),
            "n_unique": df.nunique(),
        }
    )
    summary.index.name = "column"
    return summary.reset_index()


def log_audit(name: str, df: pd.DataFrame) -> None:
    """Log a dataset-level header and a per-column audit table.

    Args:
        name: Dataset key.
        df: Loaded dataframe.
    """
    duplicates = int(df.duplicated().sum())
    memory_mb = df.memory_usage(deep=True).sum() / 1024**2

    logger.info("\n%s", "=" * 78)
    logger.info("AUDIT: %s", name)
    logger.info(
        "Rows: %d | Columns: %d | Duplicate rows: %d | Memory: %.2f MB",
        df.shape[0],
        df.shape[1],
        duplicates,
        memory_mb,
    )
    summary = build_audit_summary(df)
    logger.info(
        "\n%s",
        tabulate(summary, headers="keys", tablefmt="github", showindex=False),
    )


def main() -> None:
    """Load and validate all datasets, then log a full audit summary."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )
    datasets = load_all_datasets(validate=True)
    for name, df in datasets.items():
        log_audit(name, df)

    total_records = sum(len(df) for df in datasets.values())
    logger.info("\n%s", "=" * 78)
    logger.info(
        "All datasets loaded and validated. Total records across sources: %d",
        total_records,
    )


if __name__ == "__main__":
    main()
