"""Request validation and the API error type.

The payloads are small and fixed, so validation is hand-rolled against the
feature schema in ml.config rather than pulling in a schema library. Known
fields are checked for type, range, and (for the ordinal bands) exact value;
unrecognised keys are dropped, since the model pipeline ignores them anyway.
Missing fields are still tolerated (the pipeline imputes them), so this only
rejects genuinely malformed input, not partial input. ApiError carries the
structured fields the API returns when a request is rejected.
"""

from typing import Any

from ml import config


class ApiError(Exception):
    """An error we hand back to the client as structured JSON."""

    def __init__(
        self,
        message: str,
        status_code: int = 422,
        error_code: str = "validation_error",
        field: str | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.field = field

    def to_dict(self) -> dict:
        return {"error_code": self.error_code, "message": self.message, "field": self.field}


# --- accepted values, derived from the training schema so they never drift ----

# Numeric self-report fields and their accepted ranges. The scales are 1..5 in
# the data (routine is 1..3); the bounds here are a little wider so an unusual
# but plausible value is not rejected, while true garbage (text, negatives, huge
# numbers) is.
_NUMERIC_RANGES: dict[str, tuple[float, float]] = {
    feature: (1.0, 10.0) for feature in config.DS1_NUMERIC_FEATURES
}
_NUMERIC_RANGES["age"] = (10.0, 120.0)

# Ordinal fields must carry one of their known band labels, matched exactly
# (en-dashes and all), otherwise the encoder would silently turn the answer into
# a missing value.
_ORDINAL_ALLOWED: dict[str, set] = {
    feature: set(levels) for feature, levels in config.DS1_ORDINAL_FEATURES.items()
}

# Nominal fields are one-hot encoded with unknowns ignored, and program_stream
# is intentionally mapped from labels the survey never used (B.Tech and so on),
# so these are accepted as free text within a length cap rather than an enum.
_NOMINAL_FIELDS: set = set(config.DS1_NOMINAL_FEATURES)

_KNOWN_FIELDS: set = set(_NUMERIC_RANGES) | set(_ORDINAL_ALLOWED) | _NOMINAL_FIELDS

# What-if levers: any real DS1 field, plus the engineered procrastination level
# (which the pipeline translates back to its source behaviours).
_PROCRASTINATION_VALUES: set = set(config.PROCRASTINATION_LEVELS)
_MODIFIABLE_FIELDS: set = _KNOWN_FIELDS | {config.PROCRASTINATION_FEATURE}

_MAX_FIELDS = 60
_MAX_TEXT_LEN = 200

# Sentinel: a key we do not model, so it is dropped rather than rejected.
_DROP = object()


def _as_number(value: Any):
    """Coerce ints, floats, and numeric strings to float; None if not numeric."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return None
    return None


def _clean_field(key: str, value: Any):
    """Validate one field. Returns the accepted value, _DROP, or raises ApiError."""
    if key in _NUMERIC_RANGES:
        number = _as_number(value)
        if number is None:
            raise ApiError(f"'{key}' must be a number.", field=key)
        low, high = _NUMERIC_RANGES[key]
        if not low <= number <= high:
            raise ApiError(
                f"'{key}' must be between {int(low)} and {int(high)}.", field=key
            )
        return number
    if key in _ORDINAL_ALLOWED:
        if value not in _ORDINAL_ALLOWED[key]:
            raise ApiError(f"'{key}' has an unrecognised value.", field=key)
        return value
    if key in _NOMINAL_FIELDS:
        if not isinstance(value, str) or len(value) > _MAX_TEXT_LEN:
            raise ApiError(f"'{key}' must be a short text value.", field=key)
        return value
    return _DROP


def _validate_profile(student: Any, field: str) -> dict:
    """Validate a student profile object and return the cleaned, known fields."""
    if not isinstance(student, dict) or not student:
        raise ApiError("The student profile must be a non-empty JSON object.", field=field)
    if len(student) > _MAX_FIELDS:
        raise ApiError("The student profile has too many fields.", field=field)

    clean: dict = {}
    for key, value in student.items():
        if not isinstance(key, str):
            continue
        result = _clean_field(key, value)
        if result is not _DROP:
            clean[key] = result
    if not clean:
        raise ApiError("No recognised profile fields were provided.", field=field)
    return clean


def _validate_modification_value(feature: str, value: Any, field: str):
    """Validate a what-if new value against the rules for its feature."""
    if feature == config.PROCRASTINATION_FEATURE:
        if value not in _PROCRASTINATION_VALUES:
            raise ApiError(
                f"'{feature}' must be one of {sorted(_PROCRASTINATION_VALUES)}.", field=field
            )
        return value
    result = _clean_field(feature, value)
    if result is _DROP:  # defensive: modifiable set only contains modelled fields
        raise ApiError(f"'{feature}' cannot take that value.", field=field)
    return result


def validate_student_payload(data: Any) -> dict:
    """Validate the /predict body and return the cleaned student profile."""
    return _validate_profile(data, field="body")


def validate_what_if_payload(data: Any) -> tuple[dict, list[dict]]:
    """Pull the student profile and the list of changes to apply together.

    Accepts either a single 'modification' object or a 'modifications' list, so a
    student can explore one change or several at once. Returns
    (student, modifications) where modifications is a list of {feature, new_value};
    raises ApiError if anything required is missing or invalid.
    """
    if not isinstance(data, dict):
        raise ApiError("Request body must be a JSON object.", field="body")

    student = _validate_profile(data.get("student"), field="student")

    raw = data.get("modifications", data.get("modification"))
    if isinstance(raw, dict):
        raw = [raw]
    if not isinstance(raw, list) or not raw:
        raise ApiError(
            "'modifications' must be a non-empty list of {feature, new_value} objects.",
            field="modifications",
        )
    if len(raw) > _MAX_FIELDS:
        raise ApiError("Too many modifications in one request.", field="modifications")

    modifications = []
    for index, change in enumerate(raw):
        loc = f"modifications[{index}]"
        if not isinstance(change, dict):
            raise ApiError(
                "Each modification must be an object with 'feature' and 'new_value'.",
                field=loc,
            )
        feature = change.get("feature")
        if not feature or not isinstance(feature, str):
            raise ApiError("Each modification needs a 'feature'.", field=f"{loc}.feature")
        if feature not in _MODIFIABLE_FIELDS:
            raise ApiError(f"'{feature}' is not a modifiable feature.", field=f"{loc}.feature")
        if "new_value" not in change:
            raise ApiError("Each modification needs a 'new_value'.", field=f"{loc}.new_value")
        new_value = _validate_modification_value(
            feature, change["new_value"], f"{loc}.new_value"
        )
        modifications.append({"feature": feature, "new_value": new_value})

    return student, modifications
