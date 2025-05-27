import { faker } from '@faker-js/faker';

import type { Factory } from '~/utils/types';

import type { ContactSalesFormSchema } from './contact-sales-schemas';

/**
 * Creates a valid contact sales form submission body using Faker.
 *
 * @param overrides - Optional overrides for the default generated values.
 * @returns A populated object matching the ContactSalesFormSchema structure.
 */
export const createValidContactSalesFormData: Factory<
  Omit<ContactSalesFormSchema, 'intent'> & { intent?: 'contactSales' } // Allow overriding intent but default it later
> = (overrides = {}) => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  companyName: faker.company.name(),
  workEmail: faker.internet.email(),
  phoneNumber: faker.phone.number(),
  message: faker.lorem.paragraph(),
  ...overrides, // Apply overrides
  intent: overrides.intent ?? 'contactSales', // Ensure intent is 'contactSales' unless specifically overridden
});
