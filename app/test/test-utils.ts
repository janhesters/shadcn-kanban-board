/* eslint-disable unicorn/no-null */
import { faker } from '@faker-js/faker';
import type { Organization, UserAccount } from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import { StripePriceInterval } from '@prisma/client';

import type { LookupKey, Tier } from '~/features/billing/billing-constants';
import { priceLookupKeysByTierAndInterval } from '~/features/billing/billing-constants';
import type { StripeSubscriptionWithItemsAndPrice } from '~/features/billing/billing-factories.server';
import {
  createPopulatedStripePrice,
  createPopulatedStripeProduct,
  createPopulatedStripeSubscriptionWithItemsAndPrice,
} from '~/features/billing/billing-factories.server';
import { createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct } from '~/features/billing/billing-factories.server';
import {
  retrieveStripePriceFromDatabaseByLookupKey,
  saveStripePriceToDatabase,
} from '~/features/billing/stripe-prices-model.server';
import { saveStripeProductToDatabase } from '~/features/billing/stripe-product-model.server';
import type { OnboardingUser } from '~/features/onboarding/onboarding-helpers.server';
import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  addMembersToOrganizationInDatabaseById,
  deleteOrganizationFromDatabaseById,
  saveOrganizationToDatabase,
  upsertStripeSubscriptionForOrganizationInDatabaseById,
} from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import {
  createPopulatedSupabaseSession,
  createPopulatedSupabaseUser,
} from '~/features/user-authentication/user-authentication-factories';
import type { DeepPartial } from '~/utils/types';

import { setMockSession } from './mocks/handlers/supabase/mock-sessions';

/**
 * A factory function for creating an onboarded user with their memberships.
 *
 * @param props - The properties of the onboarding user.
 * @returns An onboarding user.
 *
 * @example // Default user with 3 memberships
 * const user = createOnboardingUser();
 *
 * @example // Override the user's name and email
 * const customUser = createOnboardingUser({
 *   name: 'Jane Doe',
 *   email: 'jane@example.com',
 * });
 *
 * @example // Override first membership role and organization name
 * const customMembershipUser = createOnboardingUser({
 *   memberships: [
 *     {
 *       role: OrganizationMembershipRole.admin,
 *       organization: { name: 'Acme Corporation' },
 *     },
 *   ],
 * });
 *
 * @example // Provide custom subscriptions for second membership
 * const customSubUser = createOnboardingUser({
 *   memberships: [
 *     {},
 *     {
 *       organization: {
 *         stripeSubscriptions: [
 *           createSubscriptionWithItems({ status: 'canceled' }),
 *         ],
 *       },
 *     },
 *   ],
 * });
 */
export const createOnboardingUser = (
  overrides: DeepPartial<OnboardingUser> = {},
): OnboardingUser => {
  // Base user account
  const baseUser = createPopulatedUserAccount();

  // Prepare up to three default memberships
  const defaultMemberships: OnboardingUser['memberships'] = Array.from({
    length: overrides.memberships?.length ?? 3,
  }).map(() => {
    const organization = createPopulatedOrganization();
    return {
      role: OrganizationMembershipRole.member,
      deactivatedAt: null,
      organization: {
        ...organization,
        _count: { memberships: faker.number.int({ min: 1, max: 10 }) },
        // Each org gets at least one subscription with items
        stripeSubscriptions: [
          {
            ...createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(
              { organizationId: organization.id },
            ),
            schedule: null,
          },
        ],
      },
    };
  });

  // Merge overrides for memberships
  type Membership = OnboardingUser['memberships'][number];
  type OrgWithSubscriptions = Membership['organization'];
  const finalMemberships: Membership[] = defaultMemberships.map(
    (base, index) => {
      const overrideM =
        (overrides.memberships?.[index] as Partial<Membership>) || {};
      const baseOrg = base.organization;
      const overrideOrg =
        (overrideM.organization as Partial<OrgWithSubscriptions>) || {};

      // Merge subscriptions array explicitly, fallback to base
      const subscriptions =
        overrideOrg.stripeSubscriptions ?? baseOrg.stripeSubscriptions;

      const mergedOrg: OrgWithSubscriptions = {
        ...baseOrg,
        ...overrideOrg,
        stripeSubscriptions: subscriptions,
      };

      return {
        role: overrideM.role ?? base.role,
        deactivatedAt: overrideM.deactivatedAt ?? base.deactivatedAt,
        organization: mergedOrg,
      };
    },
  );

  return {
    ...baseUser,
    // User-level overrides (e.g. name, email)
    ...overrides,
    memberships: finalMemberships,
  };
};

function createMockJWT(payload: object): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=+$/, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=+$/, '');
  const signature = 'mock_signature';
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Creates a mock Supabase session with a fixed access token and refresh token.
 *
 * @param options - An object containing the user to create the session for.
 * @returns A Promise that resolves to a mock Supabase session.
 */
export const createMockSupabaseSession = ({
  user = createPopulatedUserAccount(),
}: {
  user?: UserAccount;
}) => {
  // Create a Supabase user with the provided ID and email
  const supabaseUser = createPopulatedSupabaseUser({
    id: user.supabaseUserId,
    email: user.email,
  });

  const jwtPayload = {
    sub: supabaseUser.id, // Subject (user ID)
    email: supabaseUser.email,
    exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
  };

  const access_token = createMockJWT(jwtPayload);

  // Create a session with fixed tokens for testing
  const session = createPopulatedSupabaseSession({
    user: supabaseUser,
    access_token,
  });

  return session;
};

/**
 * Creates an authenticated request object with the given parameters and a user
 * auth session behind the scenes.
 * NOTE: You need to activate the MSW mocks for Supabase (`getUser`) for this to
 * work.
 *
 * @param options - An object containing the url and user as well as optional
 * form data.
 * @returns A Request object with authentication cookies.
 */
export async function createAuthenticatedRequest({
  url,
  user,
  method = 'POST',
  formData,
  headers,
}: {
  url: string;
  user: UserAccount;
  method?: string;
  formData?: FormData;
  headers?: Headers;
}) {
  // Create a mock session with the provided user details.
  const mockSession = createMockSupabaseSession({ user });

  await setMockSession(mockSession.access_token, mockSession);

  // Determine the Supabase project reference for the cookie name.
  const projectReference =
    process.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] ?? 'default';
  const cookieName = `sb-${projectReference}-auth-token`;
  const cookieValue = encodeURIComponent(JSON.stringify(mockSession));

  // Create a new request with the auth cookie.
  const request = new Request(url, { method, body: formData });

  // Add any additional headers to the request first
  if (headers) {
    for (const [key, value] of headers.entries()) {
      request.headers.set(key, value);
    }
  }

  // Set the auth cookie, preserving any existing cookies
  const existingCookies = request.headers.get('Cookie') ?? '';
  const authCookie = `${cookieName}=${cookieValue}`;
  request.headers.set(
    'Cookie',
    existingCookies ? `${existingCookies}; ${authCookie}` : authCookie,
  );

  return request;
}

export async function createUserWithTrialOrgAndAddAsMember({
  organization = createPopulatedOrganization({
    // This automatically sets the trial end to 14 days from the creation date.
    createdAt: faker.date.recent({ days: 3 }),
  }),
  user = createPopulatedUserAccount(),
  role = OrganizationMembershipRole.member as OrganizationMembershipRole,
} = {}) {
  // Save user account and organization and add user as a member.
  await Promise.all([
    saveUserAccountToDatabase(user),
    saveOrganizationToDatabase(organization),
  ]);
  await addMembersToOrganizationInDatabaseById({
    id: organization.id,
    members: [user.id],
    role,
  });

  return { organization, user };
}

/**
 * Creates a test Stripe subscription for a user and organization.
 *
 * This helper function creates a Stripe customer and subscription, then associates them
 * with the provided organization and user in the database.
 *
 * @param options - An object containing the user and organization
 * @param options.user - The user account that will be set as the subscription purchaser
 * @param options.organization - The organization that will own the subscription
 * @returns The updated organization with the new subscription data
 */
export async function createTestSubscriptionForUserAndOrganization({
  user,
  organization,
  subscription = createPopulatedStripeSubscriptionWithItemsAndPrice({
    organizationId: organization.id,
  }),
  stripeCustomerId = createPopulatedOrganization().stripeCustomerId!,
  lookupKey,
}: {
  user: UserAccount;
  organization: Organization;
  stripeCustomerId: NonNullable<Organization['stripeCustomerId']>;
  subscription?: StripeSubscriptionWithItemsAndPrice;
  lookupKey?: LookupKey;
}) {
  const finalLookupKey = lookupKey ?? subscription.items[0].price.lookupKey;
  const price =
    await retrieveStripePriceFromDatabaseByLookupKey(finalLookupKey);

  if (!price) {
    throw new Error(`Price with lookup key ${finalLookupKey} not found`);
  }

  const organizationWithSubscription =
    await upsertStripeSubscriptionForOrganizationInDatabaseById({
      organizationId: organization.id,
      stripeCustomerId,
      purchasedById: user.id,
      subscription: {
        ...subscription,
        items: subscription.items.map(item => ({
          ...item,
          priceId: price.stripeId,
        })),
      },
    });
  return organizationWithSubscription;
}

/**
 * Saves the user account and organization to the database and adds the user as
 * a member of the organization.
 *
 * @param options - Optional parameter containing the organization and user
 * objects to be saved.
 * @returns - An object containing the saved organization and user.
 */
export async function createUserWithOrgAndAddAsMember({
  organization = createPopulatedOrganization(),
  user = createPopulatedUserAccount(),
  role = OrganizationMembershipRole.member as OrganizationMembershipRole,
  subscription = createPopulatedStripeSubscriptionWithItemsAndPrice({
    organizationId: organization.id,
  }),
  lookupKey = priceLookupKeysByTierAndInterval.high.annual as LookupKey,
} = {}) {
  // Save user account and organization and add user as a member.
  await createUserWithTrialOrgAndAddAsMember({
    // When the user subscribes, it ends the trial.
    organization: { ...organization, trialEnd: subscription.created },
    user,
    role,
  });
  const orgWithSub = await createTestSubscriptionForUserAndOrganization({
    user,
    organization,
    stripeCustomerId: organization.stripeCustomerId!,
    subscription,
    lookupKey,
  });

  return {
    organization,
    user,
    subscription: orgWithSub.stripeSubscriptions[0],
  };
}

/**
 * Deletes an organization and a user from the database.
 *
 * @param params - The organization and user to delete.
 * @returns  A Promise that resolves when the organization and user account
 * have been removed from the database.
 */
export async function teardownOrganizationAndMember({
  organization,
  user,
}: {
  organization: Organization;
  user: UserAccount;
}) {
  try {
    await deleteOrganizationFromDatabaseById(organization.id);
  } catch {
    // do nothing, the org was probably deleted in the test
  }
  try {
    await deleteUserAccountFromDatabaseById(user.id);
  } catch {
    // do nothing, the user was probably deleted in the test
  }
}

/**
 * Ensures that Stripe products and their associated prices exist in the
 * database.
 * For each pricing tier, it:
 * 1. Checks if monthly and annual prices already exist
 * 2. Creates or reuses a product for the tier
 * 3. Creates any missing prices (monthly and/or annual) for that product
 *
 * This ensures test data consistency by maintaining the same product-price
 * relationships across test runs.
 */
export async function ensureStripeProductsAndPricesExist() {
  for (const tier of Object.keys(priceLookupKeysByTierAndInterval) as Tier[]) {
    const { monthly, annual } = priceLookupKeysByTierAndInterval[tier];

    const [existingMonthlyPrice, existingAnnualPrice] = await Promise.all([
      retrieveStripePriceFromDatabaseByLookupKey(monthly),
      retrieveStripePriceFromDatabaseByLookupKey(annual),
    ]);

    let productId: string;

    if (existingMonthlyPrice) {
      productId = existingMonthlyPrice.productId;
    } else if (existingAnnualPrice) {
      productId = existingAnnualPrice.productId;
    } else {
      const product = createPopulatedStripeProduct({
        name: {
          high: 'Business',
          low: 'Hobby',
          mid: 'Startup',
        }[tier],
        maxSeats: tier === 'high' ? 25 : tier === 'mid' ? 5 : 1,
      });
      await saveStripeProductToDatabase(product);
      productId = product.stripeId;
    }

    if (!existingMonthlyPrice) {
      const price = createPopulatedStripePrice({
        lookupKey: monthly,
        productId,
        interval: StripePriceInterval.month,
      });
      await saveStripePriceToDatabase(price);
    }

    if (!existingAnnualPrice) {
      const price = createPopulatedStripePrice({
        lookupKey: annual,
        productId,
        interval: StripePriceInterval.year,
      });
      await saveStripePriceToDatabase(price);
    }
  }

  console.log('✅ Stripe products and prices seeded successfully');
}
