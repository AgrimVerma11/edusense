import { track } from '@vercel/analytics';

// Thin wrapper around Vercel's custom events. A call site never has to care
// whether analytics is available (blocked, dev, or still loading), and a failing
// beacon can never break a user action. Event names are snake_case; props stay
// non-identifying, categories only, never a student's actual answers.
export function event(name, props) {
  try {
    track(name, props);
  } catch {
    // Analytics is best-effort by design.
  }
}
