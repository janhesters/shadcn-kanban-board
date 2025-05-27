import type { RequestHandler } from 'msw';

import { supabaseAuthHandlers } from './auth';
import { supabaseStorageHandlers } from './storage';

export const supabaseHandlers: RequestHandler[] = [
  ...supabaseAuthHandlers,
  ...supabaseStorageHandlers,
];

export { createRateLimitedEmail } from './auth';
