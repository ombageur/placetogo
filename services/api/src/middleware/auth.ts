import type { FastifyReply, FastifyRequest } from 'fastify';

export interface VerifiedUser {
  uid: string;
  emailVerified: boolean;
  admin: boolean;
}

/** Diinjeksi agar dapat diuji tanpa Firebase; produksi memakai auth.verifyIdToken(token, true). */
export type TokenVerifier = (idToken: string) => Promise<VerifiedUser>;

declare module 'fastify' {
  interface FastifyRequest {
    user?: VerifiedUser;
  }
}

/** Pesan seragam: tidak membedakan token kosong, kedaluwarsa, dicabut, atau palsu. */
const UNAUTHENTICATED = { error: 'unauthenticated', message: 'Silakan masuk terlebih dahulu.' };

export function createRequireAuth(verify: TokenVerifier) {
  return async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
    const match = req.headers.authorization?.match(/^Bearer (\S+)$/);
    if (!match?.[1]) return reply.code(401).send(UNAUTHENTICATED);
    try {
      req.user = await verify(match[1]);
    } catch {
      return reply.code(401).send(UNAUTHENTICATED);
    }
  };
}

/** Endpoint yang mengubah data atau memakai fitur inti wajib email terverifikasi. */
export async function requireVerifiedEmail(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user?.emailVerified) {
    return reply
      .code(403)
      .send({ error: 'email_not_verified', message: 'Verifikasi email kamu terlebih dahulu.' });
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user?.admin) {
    return reply.code(403).send({ error: 'forbidden', message: 'Akses ditolak.' });
  }
}
