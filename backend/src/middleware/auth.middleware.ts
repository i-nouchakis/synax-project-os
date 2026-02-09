import { FastifyRequest, FastifyReply } from 'fastify';

// User type from JWT payload
export interface JwtUser {
  id: string;
  email: string;
  role: string;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  // WebSocket upgrades handle auth via query param token in their own handler
  if (request.headers.upgrade === 'websocket') return;

  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: string } | undefined;

    if (!user || !roles.includes(user.role)) {
      return reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
    }
  };
}
