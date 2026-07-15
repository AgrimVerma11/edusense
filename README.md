# Firasa

**Academic Risk Intelligence**

[![Live](https://img.shields.io/badge/Live-firasa.agrimverma.dev-534AB7?style=flat-square)](https://firasa.agrimverma.dev)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square)
![React](https://img.shields.io/badge/React-18-20232A?style=flat-square)
![Flask](https://img.shields.io/badge/API-Flask-000000?style=flat-square)
![License](https://img.shields.io/badge/License-Proprietary-B00020?style=flat-square)

Firasa reads a student's study habits and wellbeing and returns four linked
outputs: a behavioural profile, an indicative academic trajectory, a risk level
with a probability, and a ranked set of personalised, evidence-based actions to
improve. It is designed, built, hardened, and deployed as a live product, not a
notebook.

**Live application: [firasa.agrimverma.dev](https://firasa.agrimverma.dev)**

> **All rights reserved.** This repository is public for demonstration and
> evaluation only. Copying, reuse, or redistribution of any part of it, in whole
> or in part, is not permitted without written permission. Full terms in
> [LICENSE](LICENSE).

Most early-warning tools stop at a prediction. Firasa identifies the specific
behaviours driving a student's risk using two independent explainability methods,
estimates how far changing each one would move the outcome, and turns that into a
concrete plan the student can act on.

---

## What makes it different

- **An intervention engine, not just a predictor.** It does not only say a student
  is at risk. It names the specific habits responsible, ranks them by impact, and
  pairs each with a small, evidence-based next step drawn from behaviour-change
  research (implementation intentions, habit stacking, stimulus control).
- **Two independent explanations.** Every risk output is explained with SHAP and
  cross-checked with LIME. When both methods agree on the top drivers, the
  explanation is more trustworthy than either alone.
- **Cross-dataset validation.** The score model is trained on one dataset and
  measured on a separate, untouched dataset, with a deliberate negative control
  that is expected to fail. This tests genuine generalisation rather than a single
  train-test split on one source.
- **Full stack, end to end.** A React single-page application, a hardened Flask
  API, a serialised four-layer model pipeline, containerised and deployed on a
  custom domain with continuous deployment.
- **Privacy by design.** No accounts, no personal fields, and nothing a student
  enters is stored on the server. Answers are processed in memory and discarded.

---

## How it works

Four machine learning layers run behind a single inference pipeline for each
student:

1. **Behavioural clustering (K-Means).** Places the student into one of four
   interpretable personas learned from real behavioural data.
2. **Score regression (XGBoost).** Produces an indicative academic trajectory from
   the behavioural inputs.
3. **Risk classification (Logistic Regression).** Assigns Low, Moderate, or High
   risk, in both a three-way and a binary framing, with a calibrated probability.
4. **Explainability and interventions (SHAP, cross-checked with LIME).** Turns the
   model's per-student attributions into a ranked, personalised action plan, and
   estimates the effect of each change by re-scoring the model with that habit set
   to a healthy level.

```
Browser (React, Vercel)
      |  HTTPS / JSON
      v
Flask API (Docker, Render)
      |  in-process call
      v
ml.predict pipeline  ->  cluster | score | risk | interventions
```

The system is trained and validated on **31,810 records across four independent
datasets** under a train-on-one, validate-on-others strategy. The datasets are
never merged; a model trained on its primary source is measured against the
others using only their shared features.

---

## Results

| Layer | Model | Metric | Result |
|---|---|---|---|
| Behavioural clustering | K-Means (k = 4) | Interpretable personas | 4 profiles |
| Score regression | XGBoost | Test R-squared / RMSE | 0.737 / 7.77 |
| Cross-dataset transfer | Shared-feature model | Holdout correlation / negative control | 0.60 / 0.005 |
| Risk classification | Logistic Regression | Macro F1 (3-class) / ROC-AUC (binary) | 0.957 / 0.995 |

The results are reported with the validation that backs them. The classifier's
accuracy is not a single-feature leak: the strongest single feature reaches only
0.64, and SHAP and LIME independently agree on the same top drivers. The score
model's learned relationship transfers to an untouched holdout (correlation 0.60)
and correctly collapses on the negative control (0.005), which is what confirms
the transfer is real signal rather than a pipeline artifact.

---

## Tech stack

**Machine learning:** Python 3.11, pandas, NumPy, scikit-learn, XGBoost,
imbalanced-learn (SMOTE), SHAP, LIME.

**API:** Flask (application-factory pattern, Blueprints), flask-cors,
flask-limiter, gunicorn.

**Frontend:** React 18, Vite, Tailwind CSS, Recharts, React Router, Axios,
framer-motion.

**Deployment:** Docker, Render (API), Vercel (frontend), Cloudflare (DNS).

---

## Running locally

**Requirements:** Python 3.11 and Node.js 18 or later. The trained model
artifacts are committed, so the pipeline runs without retraining.

**API**

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m api.app          # serves on http://localhost:5001
```

**Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173, proxies /api to the API
```

Open `http://localhost:5173`. To retrain the models from scratch, run the
preprocessing and modelling stages in `ml/` and the notebooks in `notebooks/`.

---

## Project structure

```
firasa/
  api/          Flask API: application factory, blueprints, request validation
  ml/           ML pipeline: config, preprocessing, clustering, regression,
                classification, explainability, and the unified inference layer
  data/         datasets (raw and processed), the loader, and source attribution
  notebooks/    exploratory analysis and modelling (stages 01 to 08)
  frontend/     React single-page application
  models/       serialised model artifacts
  Dockerfile    API container image
  render.yaml   deployment blueprint
```

---

## Data and attribution

Firasa uses four independent, publicly available student datasets, included for
reproducibility. Full sources, authors, and licenses are documented in
[data/SOURCES.md](data/SOURCES.md). One source is a research dataset published on
Zenodo under CC-BY-4.0. All credit for the datasets belongs to their original
authors.

---

## Responsible design

- **No personal data.** The questionnaire never asks for a name, email, or
  identifier. Answers are sent once, computed in memory, and never written to a
  database or a log.
- **Fairness.** Protected attributes such as gender are excluded from every model.
- **Non-diagnostic framing.** Risk is presented with a probability and with
  actions, framed as reflection on changeable habits, never as a verdict.
- **Hardened service.** CORS is locked to the production origin, the model
  endpoints are rate limited, request size is capped, every payload is validated
  against the feature schema, and security headers are sent on every response.

---

## Roadmap

- A real-outcome track using the Open University Learning Analytics Dataset, to
  validate against actual results rather than a survey-derived label.
- Calibration of risk probabilities.
- An advisor-facing cohort view for mentors and faculty.

---

## Author

Designed and built by **Agrim Verma**.

- Website: [firasa.agrimverma.dev](https://firasa.agrimverma.dev)
- GitHub: [AgrimVerma11](https://github.com/AgrimVerma11)
- LinkedIn: [agrimverma11](https://www.linkedin.com/in/agrimverma11)
- Substack: [Chronicles of this Soul](https://agrimverma.substack.com)
- Contact: contact@firasa.agrimverma.dev

---

## License

Copyright (c) 2026 Agrim Verma. All rights reserved.

This is proprietary software. The source is made public for demonstration and
evaluation only. It may not be copied, reused, modified, redistributed, or
submitted as part of any other project without prior written permission, and no
one may claim authorship of it or any part of it. See [LICENSE](LICENSE) for the
full terms.
