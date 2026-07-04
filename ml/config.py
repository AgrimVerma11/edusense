"""Central config for the EduSense pipeline.

All the paths, constants, feature lists, label maps, ordinal orderings, and model
hyperparameters live here, so nothing is hard-coded in the pipeline modules. The
column names are the real ones found in Step 0 (see data/discover_schema.py), not
the guesses from the original plan.

Naming: DS1_* is the primary behavioural dataset (clustering and risk
classification), DS3_* is the regression training source, DS2_* is the regression
negative control, and DS4_* is the untouched holdout.
"""

from pathlib import Path

# ---------------------------------------------------------------------------
# Filesystem layout
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent.parent
DATA_DIR = ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
VALIDATION_DIR = PROCESSED_DIR / "validation_sets"
MODELS_DIR = ROOT_DIR / "models"
OUTPUTS_DIR = ROOT_DIR / "outputs"
PLOTS_DIR = OUTPUTS_DIR / "plots"
REPORTS_DIR = OUTPUTS_DIR / "reports"

# Raw dataset files
DS1_RAW_PATH = RAW_DIR / "behavioral_analytics.csv"
DS2_RAW_PATH = RAW_DIR / "zenodo_merged.csv"
DS3_RAW_PATH = RAW_DIR / "performance_prediction.csv"
DS4_RAW_PATH = RAW_DIR / "performance_factors.csv"

# Processed dataset files (written by the preprocessing pipeline).
# DS1 -> primary (clustering + classification); DS3 -> regression training;
# DS2 -> regression negative control; DS4 -> regression holdout.
PRIMARY_TRAIN_PATH = PROCESSED_DIR / "primary_train.csv"
PRIMARY_TEST_PATH = PROCESSED_DIR / "primary_test.csv"
REGRESSION_TRAIN_PATH = PROCESSED_DIR / "regression_train.csv"
REGRESSION_TEST_PATH = PROCESSED_DIR / "regression_test.csv"
VAL_DS2_PATH = VALIDATION_DIR / "val_ds2.csv"
VAL_DS4_PATH = VALIDATION_DIR / "val_ds4.csv"

# Serialised model artifacts
CLUSTERER_PATH = MODELS_DIR / "clusterer.pkl"
CLUSTER_SCALER_PATH = MODELS_DIR / "cluster_scaler.pkl"
PREPROCESSOR_PATH = MODELS_DIR / "preprocessor.pkl"
REGRESSOR_PATH = MODELS_DIR / "regressor.pkl"
CLASSIFIER_PATH = MODELS_DIR / "classifier.pkl"          # multiclass (risk level)
CLASSIFIER_BINARY_PATH = MODELS_DIR / "classifier_binary.pkl"  # High Risk vs rest

# ---------------------------------------------------------------------------
# Global reproducibility
# ---------------------------------------------------------------------------
RANDOM_SEED = 42

# ---------------------------------------------------------------------------
# Dataset audit expectations (validated by data/data_loader.py in Step 3)
# ---------------------------------------------------------------------------
DATASET_EXPECTED_SHAPES = {
    "behavioral_analytics": (1200, 36),
    "zenodo_merged": (14003, 16),
    "performance_prediction": (10000, 8),
    "performance_factors": (6607, 20),
}

# ===========================================================================
# DATASET 1 - behavioral_analytics.csv (primary training)
# ===========================================================================
DS1_TARGET = "performance_risk_level"

# Identifier / metadata columns dropped before modelling.
DS1_ID_COLUMNS = ["student_id", "timestamp"]

# Excluded from modelling: a protected demographic attribute that is also not
# collected at inference time. Retained in raw data for EDA only.
DS1_EXCLUDED_FEATURES = ["gender"]

# Natively numeric columns.
DS1_NUMERIC_FEATURES = [
    "age",
    "daily_productivity",
    "energy_level",
    "stress_level",
    "routine_rating",
]

# No boolean columns exist in this dataset; activity/experience signals are
# stored as multi-level ordinals (e.g. events_participation, projects_internships).
DS1_BOOLEAN_FEATURES = []

# Ordinal categoricals mapped to ordered integer codes (low -> high) during
# preprocessing. Order is meaning-preserving: index 0 is the "lowest" level.
# Strings match the raw data exactly, including the en-dash characters.
DS1_ORDINAL_FEATURES = {
    "cgpa_category": ["5.0 – 6.9", "7.0 – 8.4", "8.5 – 9.4", "9.5 – 10.0"],
    "attendance_percentage": [
        "Less than 50%",
        "50% – 65%",
        "66% – 75%",
        "76% – 85%",
        "Above 85%",
    ],
    "academic_satisfaction": [
        "Very unsatisfied",
        "Unsatisfied",
        "Neutral",
        "Satisfied",
        "Very satisfied",
    ],
    "study_hours_daily": ["Less than 1 hour", "1–2 hours", "More than 2 hours"],
    "revision_frequency": ["Never", "Rarely", "Few times a week", "Daily"],
    "focus_duration": ["30–60 minutes", "1–2 hours", "More than 2 hours"],
    "screen_time_non_study": ["2–4 hours", "4–6 hours", "More than 6 hours"],
    "study_consistency": ["Rarely", "Sometimes", "Mostly consistent"],
    "tasks_on_time": ["Rarely", "Sometimes", "Often", "Always"],
    "assignments_on_time": ["Rarely", "Sometimes", "Often", "Always"],
    "preparation_status": [
        "Thinking about it",
        "Planning to start soon",
        "Actively preparing for a goal (placements/exams)",
    ],
    "career_goal_clarity": ["Not clear", "Somewhat clear", "Very clear"],
    "sleepy_during_study": ["Never", "Sometimes", "Often", "Always"],
    "sleep_hours": ["4–5 hours", "6–7 hours", "More than 8 hours"],
    "online_courses": [
        "No, not interested",
        "Not currently, but intend to in the future",
        "Planning to enroll soon",
        "Yes, currently enrolled in one or more courses/certifications",
    ],
    "projects_internships": [
        "Not currently, but intend to in the future",
        "Planning to start a project/internship soon",
        "Yes, actively working on projects/internship",
    ],
    "programming_foundation": [
        "Limited knowledge, theoretical only",
        "Basic knowledge, learning while practicing",
        "Strong foundation in core concepts",
    ],
    "events_participation": [
        "Never participate in such events",
        "Rarely participate, mostly observe",
        "Occasionally participate in events",
    ],
    "external_resources": [
        "Never (Unaware or Not interested)",
        "Rarely (Passive)",
        "Occasionally (When needed)",
    ],
    "external_pressure": [
        "No Impact (Fully supportive environment)",
        "Low Impact (Rarely affects study)",
        "Moderate Impact (Occasional disruption)",
        "High Impact (Frequent disruption)",
    ],
}

# Nominal categoricals (no inherent order) -> one-hot encoded.
# year_class is treated as nominal because the undergraduate/postgraduate
# tracks do not share a single seniority ordering.
DS1_NOMINAL_FEATURES = [
    "year_class",
    "program_stream",
    "main_distractor",
    "skills_developing",
    "career_interest",
    "strongest_asset",
    "internal_barrier",
]

# Engineered features created during preprocessing (not present in raw data).
DS1_DERIVED_FEATURES = ["procrastination_level"]

# Convenience aggregate of every categorical feature name (ordinal + nominal).
DS1_CATEGORICAL_FEATURES = list(DS1_ORDINAL_FEATURES.keys()) + DS1_NOMINAL_FEATURES

# Behavioral feature subset used for unsupervised clustering. Restricted to
# study-habit, psychological, and consistency signals - identity, demographic,
# and pure-academic-outcome features are deliberately excluded.
DS1_CLUSTER_FEATURES = [
    "study_hours_daily",
    "study_consistency",
    "daily_productivity",
    "focus_duration",
    "revision_frequency",
    "screen_time_non_study",
    "procrastination_level",
    "stress_level",
    "sleep_hours",
    "energy_level",
    "routine_rating",
    "career_goal_clarity",
    "tasks_on_time",
    "assignments_on_time",
]

# ---------------------------------------------------------------------------
# Derived feature: procrastination_level
# ---------------------------------------------------------------------------
# DS1 has no direct procrastination column. An ordinal proxy is engineered by
# summing component scores from three behavioral signals, then binning the
# total. Component scores and thresholds are defined here; the derivation logic
# lives in ml/preprocessing.py.
PROCRASTINATION_FEATURE = "procrastination_level"
PROCRASTINATION_LEVELS = ["Low", "Medium", "High"]
PROCRASTINATION_SOURCE_COLUMNS = [
    "internal_barrier",
    "study_consistency",
    "tasks_on_time",
]
PROCRASTINATION_COMPONENT_SCORES = {
    "internal_barrier": {
        "Procrastination / Low Motivation": 2,
        "Lack of Consistency or Determination (Difficulty sticking to a plan)": 2,
        "Poor Time Management / Over-scheduling": 1,
        "Difficulty with Focus / Concentration": 1,
    },
    "study_consistency": {
        "Rarely": 2,
        "Sometimes": 1,
        "Mostly consistent": 0,
    },
    "tasks_on_time": {
        "Rarely": 2,
        "Sometimes": 1,
        "Often": 0,
        "Always": 0,
    },
}
# Total component score range is 0-6. Binning into the ordinal levels:
#   0-1 -> Low, 2-3 -> Medium, 4-6 -> High
PROCRASTINATION_SCORE_BINS = [-1, 1, 3, 6]

# ---------------------------------------------------------------------------
# Risk label maps
# ---------------------------------------------------------------------------
RISK_LEVELS = ["Low Risk", "Moderate Risk", "High Risk"]
RISK_LABEL_MAP = {"Low Risk": 0, "Moderate Risk": 1, "High Risk": 2}
BINARY_RISK_MAP = {"Low Risk": 0, "Moderate Risk": 0, "High Risk": 1}
RISK_LABEL_INVERSE = {value: key for key, value in RISK_LABEL_MAP.items()}

# ===========================================================================
# DATASET 2 - zenodo_merged.csv (regression negative control)
# ===========================================================================
# Cross-dataset EDA (Step 5) showed DS2's ExamScore is uncorrelated with every
# usable feature (max |r| ~ 0.03); the only strong relationship is the leaked
# FinalGrade. DS2 is therefore NOT used to train the regressor - it is reported
# as a negative-control case where transfer fails by construction.
# All columns are pre-encoded integers. FinalGrade is excluded as leakage and
# Gender is excluded for consistency with the DS1 fairness decision.
DS2_TARGET = "ExamScore"
DS2_DROP_COLUMNS = ["FinalGrade", "Gender"]
DS2_FEATURES = [
    "StudyHours",
    "Attendance",
    "Resources",
    "Extracurricular",
    "Motivation",
    "Internet",
    "Age",
    "LearningStyle",
    "OnlineCourses",
    "Discussions",
    "AssignmentCompletion",
    "EduTech",
    "StressLevel",
]

# ===========================================================================
# DATASET 3 - performance_prediction.csv (regression training source)
# ===========================================================================
# DS3 carries strong, intuitive feature/exam signal (max |r| ~ 0.56) and 10,000
# rows, so the score regressor trains here. placement_status is excluded as a
# feature: placement occurs after exams, so using it to predict the exam score
# would be reverse-causal leakage.
DS3_TARGET = "exam_score"
DS3_FEATURES = [
    "study_hours",
    "attendance",
    "sleep_hours",
    "internet_usage",
    "assignments_completed",
    "previous_score",
]
# Interaction features engineered on top of DS3_FEATURES for the regressor.
# Added after experimentation showed a small but consistent cross-validated R2
# gain (note: DS3 has no stress column, so the sleep x stress pair was not
# available and sleep x study was used instead).
DS3_INTERACTION_PAIRS = [
    ("study_hours", "attendance"),
    ("study_hours", "assignments_completed"),
    ("attendance", "previous_score"),
    ("study_hours", "previous_score"),
    ("sleep_hours", "study_hours"),
    ("internet_usage", "study_hours"),
]
DS3_PLACEMENT_COLUMN = "placement_status"
DS3_PLACEMENT_MAP = {"Not Placed": 1, "Placed": 0}  # proxy at-risk flag

# ===========================================================================
# DATASET 4 - performance_factors.csv (final holdout)
# ===========================================================================
DS4_TARGET = "Exam_Score"

# ---------------------------------------------------------------------------
# Cross-dataset external validation (Step 11)
# ---------------------------------------------------------------------------
# Regression dataset roles (confirmed Step 5).
REGRESSION_SOURCE = "ds3"     # trains the production regressor
REGRESSION_CONTROL = "ds2"    # negative control (no usable signal)
REGRESSION_HOLDOUT = "ds4"    # untouched final holdout

# Maps a canonical feature name to its column in each dataset (None where the
# dataset lacks an equivalent). Only canonical features present in BOTH the
# source (DS2) and a given validation dataset are used for that comparison.
# Units and collection periods differ across sources, so cross_validator.py
# standardises features per dataset before measuring generalisation.
CROSS_DATASET_REGRESSION_TARGETS = {
    "ds2": "ExamScore",
    "ds3": "exam_score",
    "ds4": "Exam_Score",
}
CROSS_DATASET_FEATURE_MAP = {
    "study_hours": {
        "ds2": "StudyHours",
        "ds3": "study_hours",
        "ds4": "Hours_Studied",
    },
    "attendance": {
        "ds2": "Attendance",
        "ds3": "attendance",
        "ds4": "Attendance",
    },
    "assignment_completion": {
        "ds2": "AssignmentCompletion",
        "ds3": "assignments_completed",
        "ds4": None,
    },
    "previous_score": {
        "ds2": None,
        "ds3": "previous_score",
        "ds4": "Previous_Scores",
    },
    "sleep_hours": {
        "ds2": None,
        "ds3": "sleep_hours",
        "ds4": "Sleep_Hours",
    },
}

# ===========================================================================
# Clustering configuration (Layer 1)
# ===========================================================================
CLUSTER_K_MIN = 2
CLUSTER_K_MAX = 10
PCA_N_COMPONENTS = 2

# Cluster count is a deliberate product choice, not the silhouette optimum.
# Silhouette is weak across this self-report data and peaks at k=2; k=4 is used
# for actionable persona granularity and is validated by the distinctness of the
# resulting profiles (see notebook 04). Names/descriptions below are keyed to the
# deterministic KMeans labels under RANDOM_SEED and reflect the real k=4 profiles.
CLUSTER_COUNT = 4

CLUSTER_NAMES = {
    0: "Distracted Coasters",
    1: "Driven Achievers",
    2: "Focused High-Performers",
    3: "Burnt-out Strugglers",
}
CLUSTER_DESCRIPTIONS = {
    0: "Well-rested and low-stress, but low study consistency, focus, and routine "
       "with high procrastination and screen time. Capable but disengaged.",
    1: "Highly consistent and punctual, low procrastination, and clear career "
       "goals. Organised and on track.",
    2: "Highest study hours, focus, productivity, and revision with low "
       "distraction. Intense, diligent workers.",
    3: "High stress, poor sleep, and low energy with unclear goals and high "
       "procrastination. At-risk profile that needs structured support.",
}

# ===========================================================================
# Train / evaluation configuration
# ===========================================================================
TEST_SIZE = 0.2
CV_FOLDS = 5
# If any class proportion falls below this threshold, SMOTE is applied to the
# training split only (Layer 3).
MINORITY_CLASS_THRESHOLD = 0.25

# ===========================================================================
# Model hyperparameters (Layers 2 and 3)
# ===========================================================================
RF_REGRESSOR_PARAMS = {"n_estimators": 200, "random_state": RANDOM_SEED}
# Tuned via the expanded grid search below (on DS3 with interaction features).
XGB_REGRESSOR_PARAMS = {
    "n_estimators": 500,
    "max_depth": 6,
    "learning_rate": 0.01,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "random_state": RANDOM_SEED,
}
RF_REGRESSOR_PARAM_GRID = {
    "n_estimators": [100, 200, 300],
    "max_depth": [None, 10, 20],
    "min_samples_split": [2, 5, 10],
}
XGB_REGRESSOR_PARAM_GRID = {
    "n_estimators": [300, 500],
    "max_depth": [4, 6, 8],
    "learning_rate": [0.01, 0.05, 0.1],
    "subsample": [0.8, 1.0],
    "colsample_bytree": [0.8, 1.0],
}

LOGISTIC_REGRESSION_PARAMS = {"random_state": RANDOM_SEED, "max_iter": 1000}
RF_CLASSIFIER_PARAMS = {"n_estimators": 200, "random_state": RANDOM_SEED}
XGB_CLASSIFIER_PARAMS = {
    "n_estimators": 200,
    "random_state": RANDOM_SEED,
    "eval_metric": "logloss",
}

# ===========================================================================
# Reporting / presentation constants
# ===========================================================================
MODEL_VERSIONS = {
    "clustering": "kmeans_v1",
    "regression": "xgb_regressor_v1",
    "classification": "rf_classifier_v1",
}

# Brand palette (shared with the frontend).
BRAND_PRIMARY = "#534AB7"
RISK_PALETTE = {
    "Low Risk": "#1D9E75",
    "Moderate Risk": "#EF9F27",
    "High Risk": "#D85A30",
}
# Ordered Low -> Moderate -> High, for plots that take a sequential palette.
RISK_PALETTE_LIST = ["#1D9E75", "#EF9F27", "#D85A30"]

# ===========================================================================
# User-facing framing (two-audience output)
# ===========================================================================
# Technical fields (risk_level, probabilities) are returned unchanged for the
# API and for engineers. The strings below are the student-facing layer: a
# reflective, non-diagnostic wrapper that keeps the same specific message
# without reading as a clinical or definitive verdict.

DISCLAIMER = (
    "EduSense is a self-reflection aid based on self-reported study habits and "
    "wellbeing. It is not a medical, psychological, or academic assessment and "
    "does not predict any individual's grades. Use it to reflect and to start a "
    "conversation with a mentor. If you are feeling distressed, please contact "
    "your institution's counselling service."
)

RISK_FRAMING = {
    "Low Risk": {
        "headline": "Your current habits are working in your favour.",
        "reflection": "Your study patterns line up with students who tend to stay "
                      "on track. The suggestions below are about protecting and "
                      "building on that.",
    },
    "Moderate Risk": {
        "headline": "A few patterns are worth your attention.",
        "reflection": "You sit in a middle band: some strong areas, and a few that "
                      "could pull your results down if left unchanged. The drivers "
                      "below show exactly which ones.",
    },
    "High Risk": {
        "headline": "Your current patterns line up with a higher-risk profile.",
        "reflection": "This reflects habits, not ability, and every driver below is "
                      "something you can change. Treat it as a prompt to reflect and "
                      "to talk to a mentor, not a verdict on how you will do.",
    },
}
SCORE_NOTE = "Indicative trajectory if your current habits continue, not a grade prediction."

# Student-facing cluster names (softer than the internal/technical names).
CLUSTER_DISPLAY_NAMES = {
    0: "Capable but Coasting",
    1: "Driven Achiever",
    2: "Focused High Performer",
    3: "Under Pressure",
}

# ===========================================================================
# Inference feature mapping: DS1 behavioural inputs -> DS3 regression features
# ===========================================================================
# The regressor trains on DS3's numeric features, but a student is described in
# DS1 terms. These maps translate DS1 bands/levels into approximate DS3-scale
# numeric values (midpoints). This is a documented inference approximation; the
# predicted score is presented as indicative, not exact.
STUDY_HOURS_DAILY_TO_NUMERIC = {
    "Less than 1 hour": 3.0,
    "1–2 hours": 6.0,
    "More than 2 hours": 9.0,
}
ATTENDANCE_BAND_TO_NUMERIC = {
    "Less than 50%": 40.0,
    "50% – 65%": 57.0,
    "66% – 75%": 70.0,
    "76% – 85%": 80.0,
    "Above 85%": 90.0,
}
SLEEP_BAND_TO_NUMERIC = {
    "4–5 hours": 4.5,
    "6–7 hours": 6.5,
    "More than 8 hours": 8.5,
}
SCREEN_BAND_TO_INTERNET = {
    "2–4 hours": 3.0,
    "4–6 hours": 5.0,
    "More than 6 hours": 7.0,
}
ASSIGNMENTS_ORDINAL_TO_COUNT = {
    "Rarely": 4.0,
    "Sometimes": 9.0,
    "Often": 14.0,
    "Always": 18.0,
}
CGPA_BAND_TO_PREVIOUS_SCORE = {
    "5.0 – 6.9": 60.0,
    "7.0 – 8.4": 77.0,
    "8.5 – 9.4": 88.0,
    "9.5 – 10.0": 95.0,
}
# Dataset-typical fallbacks when a band is missing at inference.
DS3_FEATURE_DEFAULTS = {
    "study_hours": 6.0,
    "attendance": 75.0,
    "sleep_hours": 6.5,
    "internet_usage": 5.0,
    "assignments_completed": 10.0,
    "previous_score": 70.0,
}

# procrastination_level is engineered, not a raw input, so a "what-if" on it is
# applied to its source behaviours instead (that is what "fixing procrastination"
# actually means in the data).
PROCRASTINATION_LEVEL_TO_SOURCES = {
    "Low": {"study_consistency": "Mostly consistent", "tasks_on_time": "Always"},
    "Medium": {"study_consistency": "Sometimes", "tasks_on_time": "Often"},
    "High": {"study_consistency": "Rarely", "tasks_on_time": "Rarely"},
}

# Inference-time program aliases. The behavioural survey (DS1) was collected from
# BSc/BCA and a few commerce students, so those are the only program_stream
# categories the model has ever seen. The app is aimed at engineering and
# computing students, who describe themselves with labels the survey never used
# (B.Tech, B.E., M.Tech, MCA). Each of those is mapped to the nearest technical
# category the model was trained on, so a B.Tech CSE student is scored against the
# closest cohort rather than as an unknown stream. This is a documented
# approximation: program_stream is a minor one-hot feature, so the effect on the
# prediction is small, and any value not listed here passes through unchanged (an
# unknown one is then safely ignored by the encoder).
PROGRAM_STREAM_ALIASES = {
    "B.Tech / B.E. (Computer Science)": "BSc Computer Science",
    "B.Tech / B.E. (Information Technology)": "BSc IT",
    "B.Tech / B.E. (Cyber Security)": "BSc Cyber Security",
    "B.Tech / B.E. (Other branch)": "BSc Computer Science",
    "M.Tech": "BSc Computer Science",
    "MCA": "BCA",
}

# ===========================================================================
# API metadata (reported by /health)
# ===========================================================================
API_VERSION = "1.0.0"
DATASETS_TRAINED_ON = 4
TOTAL_TRAINING_RECORDS = 31810
