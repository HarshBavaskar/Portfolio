import { SIGNUP_ENDPOINT, OWNER_EMAIL } from './config';

const loadedAt = Date.now();

/*
  Sends one sign-up to the Google Sheet behind the Apps Script endpoint.
  Resolves to { ok, position, duplicate } or { ok, fallback: 'email' }.
  Rejects with an Error whose message is safe to show.
*/
export async function submitSignup(list, fields) {
  if (fields.website) return { ok: true, position: null }; // honeypot: quietly accept
  const payload = { list, ...fields, elapsed: Date.now() - loadedAt, page: location.href };

  if (!SIGNUP_ENDPOINT) {
    const body = Object.entries(fields)
      .filter(([k, v]) => k !== 'website' && v !== '' && v != null)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n');
    const subject = list === 'tux' ? 'TUX OS early access' : 'Desk testing early access';
    location.href = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { ok: true, fallback: 'email' };
  }

  // text/plain keeps this a "simple" request, which Apps Script can answer cross-origin
  const res = await fetch(SIGNUP_ENDPOINT, { method: 'POST', body: JSON.stringify(payload) });
  let data;
  try { data = await res.json(); } catch { throw new Error('The list didn’t answer. Please try again in a moment.'); }
  if (!data.ok) {
    const why = {
      email: 'That email address doesn’t look right.',
      role: 'Desk testing is for students and teachers — pick one.',
      fields: 'A required field is missing.',
      slow: 'Please try that again.',
    }[data.error];
    throw new Error(why || 'Something went wrong. Please try again.');
  }
  return data;
}

export const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(v).trim());
