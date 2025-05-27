import { ensureStripeProductsAndPricesExist } from '~/test/test-utils';

export default async function globalSetup() {
  await ensureStripeProductsAndPricesExist().catch(error => {
    console.error('✨ Failed to seed Stripe pricing:', error);
    process.exit(1);
  });
}
