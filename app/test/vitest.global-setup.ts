import { config } from 'dotenv';

import { clearMockSessions } from './mocks/handlers/supabase/mock-sessions';
import { ensureStripeProductsAndPricesExist } from './test-utils';

// Load environment variables from .env file.
config();

let teardownHappened = false;

export default function setupVitest() {
  void ensureStripeProductsAndPricesExist().catch(error => {
    console.error('✨ Failed to seed Stripe pricing:', error);
    process.exit(1);
  });

  // Clear mock sessions after all tests are run.
  return async function teardownVitest() {
    if (!teardownHappened) {
      teardownHappened = true;
      await clearMockSessions();
    }
  };
}
