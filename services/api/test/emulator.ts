/** Klien REST minimal untuk Firebase Auth Emulator (hanya dipakai di tes). */
const HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const PROJECT = 'demo-placetogo';
const KEY = 'fake-api-key';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`http://${HOST}/identitytoolkit.googleapis.com/v1/${path}?key=${KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & { error?: { message: string } };
  if (!res.ok) throw new Error(`emulator ${path}: ${json.error?.message ?? res.status}`);
  return json;
}

export interface Session {
  idToken: string;
  refreshToken: string;
  localId: string;
}

export const uniqueEmail = (tag = 'u') =>
  `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

export const signUp = (email: string, password: string) =>
  post<Session>('accounts:signUp', { email, password, returnSecureToken: true });

export const signIn = (email: string, password: string) =>
  post<Session>('accounts:signInWithPassword', { email, password, returnSecureToken: true });

export const requestVerification = (idToken: string) =>
  post('accounts:sendOobCode', { requestType: 'VERIFY_EMAIL', idToken });

export const requestPasswordReset = (email: string) =>
  post('accounts:sendOobCode', { requestType: 'PASSWORD_RESET', email });

export async function latestOobCode(email: string, requestType: 'VERIFY_EMAIL' | 'PASSWORD_RESET') {
  const res = await fetch(`http://${HOST}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes } = (await res.json()) as {
    oobCodes: Array<{ email: string; requestType: string; oobCode: string }>;
  };
  const match = oobCodes.filter((c) => c.email === email && c.requestType === requestType).at(-1);
  if (!match) throw new Error(`oobCode ${requestType} untuk ${email} tidak ditemukan`);
  return match.oobCode;
}

export const applyVerification = (oobCode: string) => post('accounts:update', { oobCode });

export const applyPasswordReset = (oobCode: string, newPassword: string) =>
  post('accounts:resetPassword', { oobCode, newPassword });
