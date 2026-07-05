"""Request validation and the API error type.

The payloads are simple, so the validation is hand-rolled rather than pulling in
a schema library. ApiError carries the structured fields the API returns when a
request is rejected.
"""

from typing import Any


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


def validate_student_payload(data: Any) -> dict:
    """Make sure the /predict body is a non-empty JSON object and return it."""
    if not isinstance(data, dict) or not data:
        raise ApiError(
            "Request body must be a non-empty JSON object with the student's profile.",
            field="body",
        )
    return data


def validate_what_if_payload(data: Any) -> tuple[dict, list[dict]]:
    """Pull the student profile and the list of changes to apply together.

    Accepts either a single 'modification' object or a 'modifications' list, so a
    student can explore one change or several at once. Returns
    (student, modifications) where modifications is a list of {feature, new_value};
    raises ApiError if anything required is missing.
    """
    if not isinstance(data, dict):
        raise ApiError("Request body must be a JSON object.", field="body")

    student = data.get("student")
    if not isinstance(student, dict) or not student:
        raise ApiError("'student' must be the student's profile object.", field="student")

    raw = data.get("modifications", data.get("modification"))
    if isinstance(raw, dict):
        raw = [raw]
    if not isinstance(raw, list) or not raw:
        raise ApiError(
            "'modifications' must be a non-empty list of {feature, new_value} objects.",
            field="modifications",
        )

    modifications = []
    for index, change in enumerate(raw):
        if not isinstance(change, dict):
            raise ApiError(
                "Each modification must be an object with 'feature' and 'new_value'.",
                field=f"modifications[{index}]",
            )
        feature = change.get("feature")
        if not feature:
            raise ApiError(
                "Each modification needs a 'feature'.", field=f"modifications[{index}].feature"
            )
        if "new_value" not in change:
            raise ApiError(
                "Each modification needs a 'new_value'.",
                field=f"modifications[{index}].new_value",
            )
        modifications.append({"feature": feature, "new_value": change["new_value"]})

    return student, modifications
