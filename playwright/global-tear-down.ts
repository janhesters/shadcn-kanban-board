import { clearMockSessions } from '~/test/mocks/handlers/supabase/mock-sessions';

export default async function globalTearDown() {
  await clearMockSessions();
}
