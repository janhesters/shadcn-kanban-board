import type { RequestHandler } from 'msw';
import { setupWorker } from 'msw/browser';

import { supabaseStorageHandlers } from './handlers/supabase/storage';

const handlers: RequestHandler[] = [...supabaseStorageHandlers];

export const worker = setupWorker(...handlers);
