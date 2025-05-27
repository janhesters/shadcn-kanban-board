import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type { Session, User } from '@supabase/supabase-js';

import type { Factory } from '~/utils/types';

/**
 * Creates a populated Supabase user with default values.
 *
 * @param userParams - User params to create Supabase user with.
 * @returns A populated Supabase user with given params.
 */
export const createPopulatedSupabaseUser: Factory<User> = ({
  id = createId(),
  email = faker.internet.email(),
  app_metadata = {},
  user_metadata = {},
  aud = 'authenticated',
  updated_at = faker.date.recent({ days: 10 }).toISOString(),
  created_at = faker.date.past({ years: 1, refDate: updated_at }).toISOString(),
  role = 'authenticated',
  phone,
  confirmed_at = faker.date
    .past({ years: 0.9, refDate: updated_at })
    .toISOString(),
  last_sign_in_at = faker.date
    .recent({ days: 5, refDate: updated_at })
    .toISOString(),
  factors,
} = {}) => ({
  id,
  email,
  app_metadata,
  user_metadata,
  aud,
  created_at,
  updated_at,
  role,
  phone,
  confirmed_at,
  last_sign_in_at,
  factors,
});

/**
 * Creates a populated Supabase session with default values.
 *
 * @param sessionParams - Session params to create Supabase session with.
 * @returns A populated Supabase session with given params.
 */
export const createPopulatedSupabaseSession: Factory<Session> = ({
  access_token = `access_token_${createId()}`,
  refresh_token = `refresh_token_${createId()}`,
  expires_in = 3600,
  expires_at = Math.floor(Date.now() / 1000) + 3600,
  token_type = 'bearer',
  user = createPopulatedSupabaseUser(),
} = {}) => ({
  access_token,
  refresh_token,
  expires_in,
  expires_at,
  token_type,
  user,
});
