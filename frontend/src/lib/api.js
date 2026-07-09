import axios from 'axios';

// In development VITE_API_BASE_URL is empty and the Vite dev server proxies
// /api to the Flask app. In production it is set to the deployed API origin.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// The API runs on a free tier that spins down when idle. Waking the instance
// and warming the model stack can take much longer than the default timeout, so
// the calls that may land on a cold instance get a longer budget rather than
// failing a first-time visitor with a spurious "took too long".
const COLD_START_TIMEOUT = 60000;

// Turn any failure into a plain object the UI can render, whether it came back
// as one of our structured API errors, a network drop, or a timeout. We never
// surface raw stack traces or axios internals to the student.
function normalizeError(error) {
  if (error.response?.data && typeof error.response.data === 'object') {
    const { message, error_code, field } = error.response.data;
    return {
      message: message || 'The request could not be completed.',
      code: error_code || 'error',
      field: field || null,
      status: error.response.status,
    };
  }
  if (error.code === 'ECONNABORTED') {
    return {
      message: 'The request took too long. Please check your connection and try again.',
      code: 'timeout',
      field: null,
      status: null,
    };
  }
  return {
    message: 'Could not reach the EduSense service. Please try again in a moment.',
    code: 'network_error',
    field: null,
    status: null,
  };
}

async function request(promise) {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export function getHealth() {
  return request(client.get('/health'));
}

// Fire-and-forget warm-up. Called when the app first loads so the free-tier API
// is waking while the student fills in the form, not when they hit submit. Never
// throws and is not awaited by the UI.
export function wakeApi() {
  return client
    .get('/health', { timeout: COLD_START_TIMEOUT })
    .then(() => true)
    .catch(() => false);
}

export function predictStudent(profile) {
  return request(client.post('/predict', profile, { timeout: COLD_START_TIMEOUT }));
}

// modifications is a list of { feature, new_value }, applied together so the
// caller can see the combined effect of several changes at once.
export function whatIf(student, modifications) {
  return request(
    client.post('/what-if', { student, modifications }, { timeout: COLD_START_TIMEOUT })
  );
}

export function getClusterProfiles() {
  return request(client.get('/cluster-profiles', { timeout: COLD_START_TIMEOUT }));
}

export default client;
