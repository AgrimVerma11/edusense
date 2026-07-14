// The assessment questionnaire, defined once and consumed by the form wizard.
//
// Every `name` and every option string here has to match the training data
// exactly, including the en-dash characters in the range labels ("1–2 hours").
// The backend encoders map unknown strings to missing values, so a typo would
// quietly weaken the prediction rather than raise an error. Treat this file as
// the source of truth that mirrors the feature schema in ml/config.py.

export const STEPS = [
  {
    id: 'about',
    title: 'About you',
    subtitle: 'A little context to anchor the rest.',
    fields: [
      {
        name: 'year_class',
        label: 'Where are you in your program?',
        type: 'select',
        options: [
          'First Year (FY)',
          'Second Year (SY)',
          'Third Year (TY)',
          'Final Year',
          'First Year (PG)',
          'Second Year (PG)',
        ],
      },
      {
        name: 'program_stream',
        label: 'What are you studying?',
        type: 'select',
        // Engineering and computing focused, matching the audience this tool is
        // built for. The backend maps each of these to the nearest program the
        // model was trained on (see PROGRAM_STREAM_ALIASES in ml/config.py).
        options: [
          'B.Tech / B.E. (Computer Science)',
          'B.Tech / B.E. (Information Technology)',
          'B.Tech / B.E. (Cyber Security)',
          'B.Tech / B.E. (Other branch)',
          'M.Tech',
          'BCA',
          'MCA',
          'BSc Computer Science',
          'BSc IT',
          'BSc Cyber Security',
        ],
      },
      {
        name: 'age',
        label: 'Your age',
        type: 'number',
        min: 17,
        max: 26,
      },
      {
        name: 'cgpa_category',
        label: 'How are your grades overall?',
        type: 'grade',
        // The value stored and sent is always the 10-point CGPA band the model
        // was trained on, so these `value` strings must match ml/config.py
        // exactly (en-dashes and all). The scale tabs only relabel the same four
        // bands for a student on a US 4.0 GPA or a percentage system.
        scales: [
          { id: 'cgpa', label: 'CGPA (10)' },
          { id: 'gpa', label: 'GPA (4.0)' },
          { id: 'percent', label: 'Percentage' },
        ],
        options: [
          { value: '5.0 – 6.9', cgpa: '5.0 – 6.9', gpa: '2.0 – 2.7', percent: '45 – 65%' },
          { value: '7.0 – 8.4', cgpa: '7.0 – 8.4', gpa: '2.8 – 3.3', percent: '66 – 80%' },
          { value: '8.5 – 9.4', cgpa: '8.5 – 9.4', gpa: '3.4 – 3.7', percent: '81 – 89%' },
          { value: '9.5 – 10.0', cgpa: '9.5 – 10.0', gpa: '3.8 – 4.0', percent: '90%+' },
        ],
      },
      {
        name: 'academic_satisfaction',
        label: 'How satisfied are you with your academics right now?',
        type: 'segmented',
        options: ['Very unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very satisfied'],
      },
    ],
  },
  {
    id: 'study',
    title: 'Study habits',
    subtitle: 'How you actually work, on a normal day.',
    note: 'Answer for a normal week, not your best one. Honest answers give you a sharper read.',
    // The seven questions split into three short, related sets so the step reads
    // as a guided sequence rather than a wall. These groups and the field order
    // are presentation only; the values sent to the model are unchanged.
    groups: [
      { id: 'time', label: 'Time and focus', icon: 'clock' },
      { id: 'consistency', label: 'Consistency', icon: 'calendar' },
      { id: 'followthrough', label: 'Follow-through', icon: 'checks' },
    ],
    fields: [
      {
        name: 'study_hours_daily',
        label: 'On a typical day, how long do you actually study?',
        type: 'segmented',
        group: 'time',
        help: 'Count focused study, not time with the book open.',
        options: ['Less than 1 hour', '1–2 hours', 'More than 2 hours'],
      },
      {
        name: 'focus_duration',
        label: 'How long can you stay focused in one sitting?',
        type: 'segmented',
        group: 'time',
        help: 'Before your attention drifts or you reach for your phone.',
        options: ['30–60 minutes', '1–2 hours', 'More than 2 hours'],
      },
      {
        name: 'study_consistency',
        label: 'How consistent is your study routine?',
        type: 'segmented',
        group: 'consistency',
        options: ['Rarely', 'Sometimes', 'Mostly consistent'],
      },
      {
        name: 'revision_frequency',
        label: 'How often do you revise what you have learned?',
        type: 'segmented',
        group: 'consistency',
        options: ['Never', 'Rarely', 'Few times a week', 'Daily'],
      },
      {
        name: 'attendance_percentage',
        label: 'Your class attendance',
        type: 'segmented',
        group: 'followthrough',
        options: ['Less than 50%', '50% – 65%', '66% – 75%', '76% – 85%', 'Above 85%'],
      },
      {
        name: 'assignments_on_time',
        label: 'Do you submit assignments on time?',
        type: 'segmented',
        group: 'followthrough',
        options: ['Rarely', 'Sometimes', 'Often', 'Always'],
      },
      {
        name: 'tasks_on_time',
        label: 'Do you finish the tasks you plan on time?',
        type: 'segmented',
        group: 'followthrough',
        options: ['Rarely', 'Sometimes', 'Often', 'Always'],
      },
    ],
  },
  {
    id: 'focus',
    title: 'Focus and energy',
    subtitle: 'What pulls your attention, and how your days feel.',
    fields: [
      {
        name: 'screen_time_non_study',
        label: 'Daily screen time that is not for study',
        type: 'segmented',
        options: ['2–4 hours', '4–6 hours', 'More than 6 hours'],
      },
      {
        name: 'main_distractor',
        label: 'Your biggest source of distraction',
        type: 'select',
        options: [
          'Social media',
          'Video content (YouTube/OTT)',
          'Gaming',
          'Social interactions',
          'Other',
        ],
      },
      {
        name: 'sleepy_during_study',
        label: 'How often do you feel sleepy while studying?',
        type: 'segmented',
        options: ['Never', 'Sometimes', 'Often', 'Always'],
      },
      {
        name: 'daily_productivity',
        label: 'How productive do your days feel?',
        type: 'bands',
        options: [
          { value: 2, label: 'Low', detail: 'Most days slip by without much getting done.' },
          { value: 3, label: 'Moderate', detail: 'Some days click into place, others do not.' },
          { value: 4.5, label: 'High', detail: 'I get real, focused work done most days.' },
        ],
      },
      {
        name: 'routine_rating',
        label: 'How structured is your daily routine?',
        type: 'bands',
        options: [
          { value: 1, label: 'Loose', detail: 'My days rarely follow a set pattern.' },
          { value: 2, label: 'Some structure', detail: 'A rough rhythm, but it shifts a lot.' },
          { value: 3, label: 'Structured', detail: 'Most days follow a steady routine.' },
        ],
      },
    ],
  },
  {
    id: 'wellbeing',
    title: 'Wellbeing',
    subtitle: 'Sleep, stress, and energy shape everything else.',
    fields: [
      {
        name: 'sleep_hours',
        label: 'How much sleep do you usually get?',
        type: 'segmented',
        options: ['4–5 hours', '6–7 hours', 'More than 8 hours'],
      },
      {
        name: 'stress_level',
        label: 'Your typical stress level',
        type: 'bands',
        // The numeric values map onto the same scale the model was trained on
        // and onto the intervention thresholds (below 2.5 = none, 2.5 to 3.5 =
        // gentle, 3.5+ = the full stress card). Manageable / situational /
        // persistent tracks acute versus chronic stress, which is the axis that
        // actually matters, not raw intensity.
        options: [
          {
            value: 2,
            label: 'Manageable',
            detail: 'Mostly calm. When stress shows up, it passes quickly.',
          },
          {
            value: 3,
            label: 'Situational',
            detail: 'Builds around deadlines or events, then settles.',
          },
          {
            value: 4.5,
            label: 'Persistent',
            detail: 'Often there even without a clear reason, and hard to ease.',
          },
        ],
      },
      {
        name: 'energy_level',
        label: 'Your usual energy through the day',
        type: 'bands',
        options: [
          {
            value: 2,
            label: 'Running low',
            detail: 'Often tired or drained by the time you sit down.',
          },
          {
            value: 3,
            label: 'Steady',
            detail: 'Enough to carry you through most of the day.',
          },
          {
            value: 4.5,
            label: 'High',
            detail: 'Alert and energised for most of the day.',
          },
        ],
      },
      {
        name: 'external_pressure',
        label: 'How much do outside pressures affect your study?',
        type: 'select',
        options: [
          'No Impact (Fully supportive environment)',
          'Low Impact (Rarely affects study)',
          'Moderate Impact (Occasional disruption)',
          'High Impact (Frequent disruption)',
        ],
      },
      {
        name: 'internal_barrier',
        label: 'What holds you back the most?',
        type: 'select',
        options: [
          'Procrastination / Low Motivation',
          'Lack of Consistency or Determination (Difficulty sticking to a plan)',
          'Poor Time Management / Over-scheduling',
          'Difficulty with Focus / Concentration',
        ],
      },
    ],
  },
  {
    id: 'goals',
    title: 'Goals and growth',
    subtitle: 'Direction and momentum. The last few are optional.',
    note: 'This is about where you are right now, not where you think you should be. Skip anything that does not apply.',
    // Grouped into where you want to go, what you have built, and what you are
    // doing about it. The groups and field order are presentation only; no value
    // sent to the model changes.
    groups: [
      { id: 'direction', label: 'Direction', icon: 'compass' },
      { id: 'foundation', label: 'Foundation', icon: 'layers' },
      { id: 'momentum', label: 'Momentum', icon: 'rocket' },
    ],
    fields: [
      {
        name: 'career_goal_clarity',
        label: 'How clear are you on your career direction?',
        type: 'segmented',
        group: 'direction',
        help: 'It is completely fine not to be sure yet.',
        options: ['Not clear', 'Somewhat clear', 'Very clear'],
      },
      {
        name: 'preparation_status',
        label: 'Where are you with preparing for that goal?',
        type: 'select',
        group: 'direction',
        options: [
          'Thinking about it',
          'Planning to start soon',
          'Actively preparing for a goal (placements/exams)',
        ],
      },
      {
        name: 'career_interest',
        label: 'Which area interests you most?',
        type: 'select',
        group: 'direction',
        optional: true,
        options: [
          'AI / ML',
          'Data Analyst',
          'Software Developer',
          'Cyber Security Analyst',
          'Automation Engineer',
          'Digital Marketing Specialist',
          'Other',
        ],
      },
      {
        name: 'programming_foundation',
        label: 'Your programming or technical foundation',
        type: 'select',
        group: 'foundation',
        help: 'Where you actually are, not where you are heading.',
        options: [
          'Limited knowledge, theoretical only',
          'Basic knowledge, learning while practicing',
          'Strong foundation in core concepts',
        ],
      },
      {
        name: 'strongest_asset',
        label: 'Your strongest asset',
        type: 'select',
        group: 'foundation',
        optional: true,
        options: [
          'Technical/Hard Skills (Coding, Math, Logic)',
          'Creative/Design Skills (Innovation, UI/UX, Content)',
          'Management/Execution (Planning, Organizing, Discipline)',
          'Soft Skills (Communication, Leadership, Teamwork)',
        ],
      },
      {
        name: 'skills_developing',
        label: 'What skills are you building right now?',
        type: 'select',
        group: 'foundation',
        optional: true,
        options: [
          'Hard skills (programming, data analytics, technical skills)',
          'Soft skills (communication, teamwork, leadership, financial literacy)',
          'Both hard and soft skills',
        ],
      },
      {
        name: 'projects_internships',
        label: 'Projects or internships',
        type: 'select',
        group: 'momentum',
        options: [
          'Not currently, but intend to in the future',
          'Planning to start a project/internship soon',
          'Yes, actively working on projects/internship',
        ],
      },
      {
        name: 'online_courses',
        label: 'Online courses or certifications',
        type: 'select',
        group: 'momentum',
        optional: true,
        options: [
          'No, not interested',
          'Not currently, but intend to in the future',
          'Planning to enroll soon',
          'Yes, currently enrolled in one or more courses/certifications',
        ],
      },
      {
        name: 'events_participation',
        label: 'Do you take part in events or hackathons?',
        type: 'select',
        group: 'momentum',
        optional: true,
        options: [
          'Never participate in such events',
          'Rarely participate, mostly observe',
          'Occasionally participate in events',
        ],
      },
      {
        name: 'external_resources',
        label: 'Do you use resources beyond class material?',
        type: 'select',
        group: 'momentum',
        optional: true,
        options: [
          'Never (Unaware or Not interested)',
          'Rarely (Passive)',
          'Occasionally (When needed)',
        ],
      },
    ],
  },
];

// Fields the wizard pre-fills so the numeric scales always have a thumb position
// and the form is never in an invalid partial state for those inputs.
export const DEFAULT_ANSWERS = {
  age: 20,
  daily_productivity: 3,
  routine_rating: 2,
  stress_level: 3,
  energy_level: 3,
};

// Flat lookup of every field definition by name.
export const FIELD_BY_NAME = STEPS.reduce((acc, step) => {
  step.fields.forEach((field) => {
    acc[field.name] = field;
  });
  return acc;
}, {});

// The fields a student must answer before we score them. Optional enrichment
// fields (and the pre-filled numeric scales) are excluded.
export const REQUIRED_FIELDS = STEPS.flatMap((step) =>
  step.fields
    .filter((f) => !f.optional && !['scale', 'number', 'bands'].includes(f.type))
    .map((f) => f.name)
);

// Friendly labels for raw feature names, used wherever the API echoes a feature
// back to us (SHAP drivers, interventions, what-if levers).
export const FEATURE_LABELS = {
  procrastination_level: 'Procrastination',
  sleep_hours: 'Sleep',
  stress_level: 'Stress level',
  study_hours_daily: 'Daily study time',
  screen_time_non_study: 'Non-study screen time',
  career_goal_clarity: 'Career clarity',
  events_participation: 'Event participation',
  projects_internships: 'Projects and internships',
  attendance_percentage: 'Attendance',
  study_consistency: 'Study consistency',
  tasks_on_time: 'Task punctuality',
  assignments_on_time: 'Assignment punctuality',
  focus_duration: 'Focus duration',
  revision_frequency: 'Revision frequency',
  daily_productivity: 'Daily productivity',
  energy_level: 'Energy level',
  routine_rating: 'Routine structure',
  sleepy_during_study: 'Drowsiness while studying',
  external_pressure: 'External pressure',
  internal_barrier: 'Main internal barrier',
  academic_satisfaction: 'Academic satisfaction',
  cgpa_category: 'CGPA band',
};

// The levers offered on the results page for "what changes if I..." exploration.
// Each maps to a feature the /what-if endpoint understands. procrastination_level
// is derived on the backend from study consistency and punctuality; the API
// handles that translation, so we can treat it as a normal lever here.
export const WHATIF_LEVERS = [
  {
    feature: 'procrastination_level',
    label: 'Procrastination',
    options: ['High', 'Medium', 'Low'],
    hint: 'Lower is better',
  },
  {
    feature: 'study_hours_daily',
    label: 'Daily study time',
    options: ['Less than 1 hour', '1–2 hours', 'More than 2 hours'],
    hint: 'More focused hours',
  },
  {
    feature: 'sleep_hours',
    label: 'Sleep',
    options: ['4–5 hours', '6–7 hours', 'More than 8 hours'],
    hint: 'Aim for 7 to 8',
  },
  {
    feature: 'attendance_percentage',
    label: 'Attendance',
    options: ['Less than 50%', '50% – 65%', '66% – 75%', '76% – 85%', 'Above 85%'],
    hint: 'Higher attendance',
  },
];

// Axes for the personal profile radar on the results page. Each axis reads
// "higher is healthier": ordinal answers are converted to their position in the
// ordering, numeric scales are rescaled, and the "bad-when-high" ones (stress,
// screen time) are inverted so the shape is easy to read at a glance.
export const RADAR_AXES = [
  { key: 'study_hours_daily', label: 'Study time', kind: 'ordinal' },
  { key: 'study_consistency', label: 'Consistency', kind: 'ordinal' },
  { key: 'focus_duration', label: 'Focus', kind: 'ordinal' },
  { key: 'sleep_hours', label: 'Sleep', kind: 'ordinal' },
  { key: 'energy_level', label: 'Energy', kind: 'scale' },
  { key: 'stress_level', label: 'Calm', kind: 'scale', invert: true },
  { key: 'screen_time_non_study', label: 'Low screen use', kind: 'ordinal', invert: true },
  { key: 'tasks_on_time', label: 'Punctuality', kind: 'ordinal' },
];
