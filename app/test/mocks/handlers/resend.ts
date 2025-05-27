import { createId } from '@paralleldrive/cuid2';
import type { RequestHandler } from 'msw';
import { http, HttpResponse } from 'msw';
import { z } from 'zod';

// Schema for validating incoming email requests
const emailRequestSchema = z.object({
  from: z.string(),
  to: z.union([z.string(), z.array(z.string())]),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
});

const sendEmailMock = http.post(
  'https://api.resend.com/emails',
  async ({ request }) => {
    // Check for Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          name: 'UnauthorizedError',
          message: 'Invalid API key provided',
          statusCode: 401,
        },
        { status: 401 },
      );
    }

    try {
      const body = await request.json();
      const parseResult = emailRequestSchema.safeParse(body);

      if (!parseResult.success) {
        return HttpResponse.json(
          {
            name: 'ValidationError',
            message: 'Invalid request data',
            statusCode: 400,
            cause: parseResult.error.format(),
          },
          { status: 400 },
        );
      }

      // At least one of html or text must be provided
      if (!parseResult.data.html && !parseResult.data.text) {
        return HttpResponse.json(
          {
            name: 'ValidationError',
            message: 'Either html or text content must be provided',
            statusCode: 400,
          },
          { status: 400 },
        );
      }

      // Generate a UUID-like id for the email
      const id = createId();

      return HttpResponse.json({ id });
    } catch (error) {
      return HttpResponse.json(
        {
          name: 'UnknownError',
          message: 'Failed to process email request',
          statusCode: 500,
          cause: error,
        },
        { status: 500 },
      );
    }
  },
);

export const resendHandlers: RequestHandler[] = [sendEmailMock];
