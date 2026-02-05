import { z } from 'zod';
import { FastifyReply } from 'fastify';

/**
 * Format Zod validation errors into human-readable messages
 */
export function formatZodError(error: z.ZodError): string {
  const messages = error.errors.map((e) => {
    const field = e.path.length > 0 ? e.path.join('.') : 'Input';

    switch (e.code) {
      case 'too_small':
        if (e.type === 'string') {
          if ((e as z.ZodTooSmallIssue).minimum === 1) {
            return `${field} is required`;
          }
          return `${field} must be at least ${(e as z.ZodTooSmallIssue).minimum} characters`;
        }
        return `${field} is too small`;

      case 'too_big':
        return `${field} must be at most ${(e as z.ZodTooBigIssue).maximum} characters`;

      case 'invalid_type':
        if (e.received === 'undefined' || e.received === 'null') {
          return `${field} is required`;
        }
        return `${field} must be a valid ${e.expected}`;

      case 'invalid_string':
        if ((e as z.ZodInvalidStringIssue).validation === 'email') {
          return `${field} must be a valid email address`;
        }
        if ((e as z.ZodInvalidStringIssue).validation === 'url') {
          return `${field} must be a valid URL`;
        }
        return `${field} is invalid`;

      case 'invalid_enum_value':
        return `${field} has an invalid value`;

      default:
        return e.message;
    }
  });

  return messages.join('. ');
}

/**
 * Send a formatted Zod validation error response
 */
export function sendValidationError(reply: FastifyReply, error: z.ZodError) {
  return reply.status(400).send({
    error: formatZodError(error),
    details: error.errors,
  });
}
