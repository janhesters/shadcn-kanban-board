import { createId } from '@paralleldrive/cuid2';
import type { RequestHandler } from 'msw';
import { http, HttpResponse } from 'msw';
import { z } from 'zod';

import {
  createPopulatedSupabaseSession,
  createPopulatedSupabaseUser,
} from '~/features/user-authentication/user-authentication-factories';

import {
  deleteMockSession,
  getMockSession,
  setMockSession,
} from './mock-sessions';

/*
Auth handlers
*/

// supabase.auth.getUser

const getUserMock = http.get(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/user`,
  async ({ request }) => {
    // Check for the presence of an Authorization header.
    const authHeader = request.headers.get('Authorization');

    // If no Authorization header or it doesn't start with 'Bearer ',
    // return unauthenticated response.
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'JWT token is missing' },
        { status: 401 },
      );
    }

    const accessToken = authHeader.split(' ')[1];

    // Look up the user in the mockSessions map.
    const session = await getMockSession(accessToken);

    if (!session) {
      return HttpResponse.json(
        { message: 'Invalid access token' },
        { status: 401 },
      );
    }

    // Mock user data response.
    return HttpResponse.json({ user: session.user });
  },
);

// supabase.auth.signInWithOtp

const rateLimitPrefix = 'rate-limited';

/**
 * Creates a rate limited email for testing purposes. The Supabase MSW handler
 * will return a 429 status code for this email.
 *
 * @returns An email that will be rate limited.
 */
export function createRateLimitedEmail() {
  return `${rateLimitPrefix}-${createId()}@example.com`;
}

const signInWithOtpMock = http.post(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/otp`,
  async ({ request }) => {
    // Parse the request body to determine if it's an email or phone OTP request
    const body = (await request.json()) as Record<string, string>;

    if (body.email) {
      if (body.email.includes(rateLimitPrefix)) {
        // Rate limit response for specific email
        return HttpResponse.json(
          {
            message:
              'For security purposes, you can only request this after 60 seconds.',
          },
          { status: 429 },
        );
      }
      // Email OTP response
      return HttpResponse.json({
        // For email OTP, the response is typically empty with no error
      });
    } else if (body.phone) {
      // Phone OTP response
      return HttpResponse.json({
        message_id: 'mock-message-id-123456',
      });
    } else {
      // Invalid request
      return HttpResponse.json(
        { message: 'You must provide either an email or phone number.' },
        { status: 400 },
      );
    }
  },
);

// supabase.auth.verifyOtp

const tokenHashDataSchema = z.object({
  email: z.string(),
  id: z.string().optional(),
});

type TokenHashData = z.infer<typeof tokenHashDataSchema>;

export function parseTokenHashData(input: string): TokenHashData {
  return tokenHashDataSchema.parse(JSON.parse(input));
}

export function stringifyTokenHashData(data: TokenHashData): string {
  return JSON.stringify(data);
}

const verifyOtpMock = http.post(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/verify`,
  async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;

    // Check for invalid cases
    if (body.token_hash === 'invalid_token_hash') {
      return HttpResponse.json(
        {
          error: 'Invalid OTP',
          message: 'Invalid token_hash provided.',
        },
        { status: 401 },
      );
    }

    if (body.type === 'email' && !body.token_hash) {
      return HttpResponse.json(
        {
          error: 'Invalid parameters',
          message: 'Missing token_hash parameter.',
        },
        { status: 400 },
      );
    }

    // The token_hash in tests is the email and the supabase user id stringified.
    const isValid = typeof body.token_hash === 'string';

    if (!isValid) {
      return HttpResponse.json(
        {
          error: 'Invalid OTP',
          message: 'Invalid verification parameters.',
        },
        { status: 401 },
      );
    }

    const { email, id } = parseTokenHashData(body.token_hash);

    // Create a user with the provided email or phone.
    const mockUser = createPopulatedSupabaseUser({ email, id });

    // Create a session with the user.
    const mockSession = createPopulatedSupabaseSession({ user: mockUser });
    await setMockSession(mockSession.access_token, mockSession);

    // Return session data at the root level.
    return HttpResponse.json(mockSession);
  },
);

// supabase.auth.exchangeCodeForSession

const authCodeDataSchema = z.object({
  provider: z.string(),
  email: z.string(),
  id: z.string().optional(),
});

type AuthCodeData = z.infer<typeof authCodeDataSchema>;

export function parseAuthCodeData(input: string): AuthCodeData {
  return authCodeDataSchema.parse(JSON.parse(input));
}

export function stringifyAuthCodeData(data: AuthCodeData): string {
  return JSON.stringify(data);
}

const exchangeCodeForSessionMock = http.post(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/token`,
  async ({ request }) => {
    // Access query parameters dynamically
    const url = new URL(request.url);
    const grantType = url.searchParams.get('grant_type');

    // Optionally, validate the grant_type if needed.
    if (grantType !== 'pkce') {
      return HttpResponse.json(
        {
          error: 'Invalid grant_type',
          message: 'grant_type must be "pkce"',
        },
        { status: 400 },
      );
    }

    // Parse the request body to get code_verifier.
    const body = (await request.json()) as Record<string, string>;
    const { auth_code, code_verifier } = body;

    // Validate the request.
    if (!auth_code) {
      return HttpResponse.json(
        { error: 'Invalid code', message: 'code is required' },
        { status: 400 },
      );
    }

    if (!code_verifier) {
      return HttpResponse.json(
        {
          error: 'Invalid code_verifier',
          message: 'code_verifier is required',
        },
        { status: 400 },
      );
    }

    // Create a mock user with an email based on the provider.
    const { email, id } = parseAuthCodeData(auth_code);
    const mockUser = createPopulatedSupabaseUser({ email, id });

    // Create a session with the user.
    const mockSession = createPopulatedSupabaseSession({ user: mockUser });
    await setMockSession(mockSession.access_token, mockSession);

    // Return the session data in the format expected by _sessionResponse.
    return HttpResponse.json({
      access_token: mockSession.access_token,
      refresh_token: mockSession.refresh_token,
      expires_in: mockSession.expires_in,
      expires_at: mockSession.expires_at,
      token_type: mockSession.token_type,
      user: mockUser,
    });
  },
);

// supabase.auth.logout

const logoutMock = http.post(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/logout`,
  async ({ request }) => {
    // Check for the presence of an Authorization header
    const authHeader = request.headers.get('Authorization');

    // If no Authorization header or it doesn't start with 'Bearer ', return unauthenticated response
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'JWT token is missing' },
        { status: 401 },
      );
    }

    const accessToken = authHeader.split(' ')[1];

    // Remove the session from the mockSessions map.
    await deleteMockSession(accessToken);

    // Return successful logout response
    return HttpResponse.json(undefined, { status: 204 });
  },
);

// supabase.auth.admin.deleteUser

const deleteUserMock = http.delete(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/admin/users/:id`,
  async ({ request, params }) => {
    // Check for the presence of an Authorization header
    const authHeader = request.headers.get('Authorization');

    // If no Authorization header or it doesn't start with 'Bearer ', return unauthenticated response
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'JWT token is missing' },
        { status: 401 },
      );
    }

    // Get the user ID from the URL params
    const { id } = params;

    if (!id) {
      return HttpResponse.json(
        { message: 'User ID is required' },
        { status: 400 },
      );
    }

    // Parse the request body to get the soft delete flag
    const body = (await request.json()) as { should_soft_delete?: boolean };

    // Return a successful response with a mock user
    return HttpResponse.json({
      user: {
        id,
        deleted_at: new Date().toISOString(),
        soft_delete: body.should_soft_delete ?? false,
      },
    });
  },
);

export const supabaseAuthHandlers: RequestHandler[] = [
  getUserMock,
  signInWithOtpMock,
  verifyOtpMock,
  exchangeCodeForSessionMock,
  logoutMock,
  deleteUserMock,
];
