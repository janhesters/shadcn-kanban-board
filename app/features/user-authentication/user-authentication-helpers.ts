import type { AuthOtpResponse } from '@supabase/supabase-js';

export function getIsAwaitingEmailConfirmation(
  data: unknown,
): data is AuthOtpResponse['data'] & { email: string } {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  return (
    'session' in data &&
    'user' in data &&
    'email' in data &&
    data.session === null &&
    data.user === null &&
    typeof data.email === 'string'
  );
}
