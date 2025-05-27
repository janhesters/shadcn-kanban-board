import { describe, expect, onTestFinished, test } from 'vitest';

import { ONBOARDING_ORGANIZATION_INTENT } from '~/features/onboarding/organization/onboarding-organization-consants';
import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  deleteOrganizationFromDatabaseById,
  retrieveOrganizationWithMembershipsFromDatabaseBySlug,
  saveOrganizationToDatabase,
  saveOrganizationWithOwnerToDatabase,
} from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { supabaseHandlers } from '~/test/mocks/handlers/supabase';
import { setupMockServerLifecycle } from '~/test/msw-test-utils';
import { createAuthenticatedRequest } from '~/test/test-utils';
import { badRequest } from '~/utils/http-responses.server';
import { slugify } from '~/utils/slugify.server';
import { toFormData } from '~/utils/to-form-data';

import { action } from './organization';

const createUrl = () => `http://localhost:3000/onboarding/organization`;

async function sendAuthenticatedRequest({
  userAccount,
  formData,
}: {
  userAccount: ReturnType<typeof createPopulatedUserAccount>;
  formData: FormData;
}) {
  const request = await createAuthenticatedRequest({
    url: createUrl(),
    user: userAccount,
    method: 'POST',
    formData,
  });

  return await action({ request, context: {}, params: {} });
}

async function setup(userAccount = createPopulatedUserAccount()) {
  await saveUserAccountToDatabase(userAccount);
  onTestFinished(async () => {
    await deleteUserAccountFromDatabaseById(userAccount.id);
  });

  return { userAccount };
}

setupMockServerLifecycle(...supabaseHandlers);

describe('/onboarding/organization route action', () => {
  test('given: an unauthenticated request, should: throw a redirect to the login page', async () => {
    expect.assertions(2);

    const request = new Request(createUrl(), {
      method: 'POST',
      body: toFormData({}),
    });

    try {
      await action({ request, context: {}, params: {} });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual(
          `/login?redirectTo=%2Fonboarding%2Forganization`,
        );
      }
    }
  });

  test('given: a user who has completed onboarding, should: redirect to the organizations page', async () => {
    expect.assertions(2);

    const { userAccount } = await setup();
    const organization = await saveOrganizationWithOwnerToDatabase({
      organization: createPopulatedOrganization(),
      userId: userAccount.id,
    });
    onTestFinished(async () => {
      await deleteOrganizationFromDatabaseById(organization.id);
    });

    try {
      await sendAuthenticatedRequest({ userAccount, formData: toFormData({}) });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual(
          `/organizations/${organization.slug}`,
        );
      }
    }
  });

  describe(`${ONBOARDING_ORGANIZATION_INTENT} intent`, () => {
    const intent = ONBOARDING_ORGANIZATION_INTENT;

    test('given: a valid name for an organization, should: create organization and redirect to organization page', async () => {
      const { userAccount } = await setup();
      const organization = createPopulatedOrganization();
      const formData = toFormData({
        intent,
        name: organization.name,
      });

      const response = (await sendAuthenticatedRequest({
        userAccount,
        formData,
      })) as Response;

      expect(response.status).toEqual(302);
      const slug = slugify(organization.name);
      expect(response.headers.get('Location')).toEqual(
        `/organizations/${slug}`,
      );

      // Verify organization was created with correct data
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug);
      expect(createdOrganization).toMatchObject({
        name: organization.name,
      });
      expect(createdOrganization!.memberships[0].member.id).toEqual(
        userAccount.id,
      );
      expect(createdOrganization!.memberships[0].role).toEqual('owner');

      await deleteOrganizationFromDatabaseById(createdOrganization!.id);
    });

    test('given: an organization name that already exists, should: create organization with unique slug', async () => {
      const { userAccount } = await setup();

      // Create first organization
      const firstOrg = createPopulatedOrganization();
      await saveOrganizationToDatabase(firstOrg);
      onTestFinished(async () => {
        await deleteOrganizationFromDatabaseById(firstOrg.id);
      });

      // Try to create second organization with same name
      const formData = toFormData({ intent, name: firstOrg.name });

      const response = (await sendAuthenticatedRequest({
        userAccount,
        formData,
      })) as Response;

      expect(response.status).toEqual(302);
      const locationHeader = response.headers.get('Location');
      expect(locationHeader).toMatch(
        new RegExp(`^/organizations/${firstOrg.slug}-[\\da-z]{8}$`),
      );

      // Extract slug from redirect URL and verify organization
      const slug = locationHeader!.split('/').pop()!;
      const secondOrg =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug);
      expect(secondOrg).toBeTruthy();
      expect(secondOrg!.name).toEqual(firstOrg.name);
      expect(secondOrg!.slug).not.toEqual(firstOrg.slug);
      expect(secondOrg!.memberships).toHaveLength(1);
      expect(secondOrg!.memberships[0].member.id).toEqual(userAccount.id);
      expect(secondOrg!.memberships[0].role).toEqual('owner');

      await deleteOrganizationFromDatabaseById(secondOrg!.id);
    });

    test('given: an organization name that would create a reserved slug, should: create organization with unique slug', async () => {
      const { userAccount } = await setup();

      const formData = toFormData({
        intent,
        name: 'New', // This would create slug "new" which is reserved.
      });

      const response = (await sendAuthenticatedRequest({
        userAccount,
        formData,
      })) as Response;

      expect(response.status).toEqual(302);
      const locationHeader = response.headers.get('Location');
      expect(locationHeader).toMatch(/^\/organizations\/new-[\da-z]{8}$/);

      // Extract slug from redirect URL and verify organization.
      const slug = locationHeader!.split('/').pop()!;
      const organization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug);
      expect(organization).toBeTruthy();
      expect(organization!.name).toEqual('New');
      expect(organization!.slug).not.toEqual('new');
      expect(organization!.memberships).toHaveLength(1);
      expect(organization!.memberships[0].member.id).toEqual(userAccount.id);
      expect(organization!.memberships[0].role).toEqual('owner');

      await deleteOrganizationFromDatabaseById(organization!.id);
    });

    test.each([
      {
        given: 'no name provided',
        body: { intent } as const,
        expected: badRequest({ errors: { name: { message: 'Required' } } }),
      },
      {
        given: 'a name that is too short (2 characters)',
        body: { intent, name: 'ab' } as const,
        expected: badRequest({
          errors: {
            name: { message: 'onboarding:organization.name-min-length' },
          },
        }),
      },
      {
        given: 'a name that is too long (256 characters)',
        body: { intent, name: 'a'.repeat(256) } as const,
        expected: badRequest({
          errors: {
            name: { message: 'onboarding:organization.name-max-length' },
          },
        }),
      },
      {
        given: 'a name with only whitespace',
        body: { intent, name: '   ' },
        expected: badRequest({
          errors: {
            name: { message: 'onboarding:organization.name-min-length' },
          },
        }),
      },
      {
        given: 'a too short name with whitespace',
        body: { intent, name: '  a ' },
        expected: badRequest({
          errors: {
            name: { message: 'onboarding:organization.name-min-length' },
          },
        }),
      },
    ])(
      'given: $given, should: return a 400 status code with an error message',
      async ({ body, expected }) => {
        const { userAccount } = await setup();

        const formData = toFormData(body);
        const response = await sendAuthenticatedRequest({
          userAccount,
          formData,
        });

        expect(response).toEqual(expected);
      },
    );

    test('given: a valid organization id, name and a logo url, should: create organization with logo url', async () => {
      const { userAccount } = await setup();
      const organization = createPopulatedOrganization();

      const formData = toFormData({
        intent,
        organizationId: organization.id,
        name: organization.name,
        logo: organization.imageUrl,
      });

      const response = (await sendAuthenticatedRequest({
        userAccount,
        formData,
      })) as Response;

      // Assert redirect
      expect(response.status).toEqual(302);
      const slug = slugify(organization.name);
      expect(response.headers.get('Location')).toEqual(
        `/organizations/${slug}`,
      );

      // Verify organization was created with correct data including logo
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug);

      expect(createdOrganization).toBeTruthy();
      expect(createdOrganization).toMatchObject({
        id: organization.id,
        name: organization.name,
        slug: slug,
        imageUrl: organization.imageUrl, // Verify the logo URL was saved
      });
      expect(createdOrganization!.memberships).toHaveLength(1);
      expect(createdOrganization!.memberships[0].member.id).toEqual(
        userAccount.id,
      );
      expect(createdOrganization!.memberships[0].role).toEqual('owner');

      // Cleanup
      await deleteOrganizationFromDatabaseById(createdOrganization!.id);
    });
  });
});
