import { expect, test } from '@playwright/test';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { deleteUserAccountFromDatabaseById } from '~/features/user-accounts/user-accounts-model.server';

import { getPath, loginAndSaveUserAccountToDatabase } from '../../utils';

const path = '/onboarding';

test.describe('onboarding page', () => {
  test('given a logged in user that is NOT onboarded: redirects the user to the user account onboarding page', async ({
    page,
  }) => {
    const { id } = await loginAndSaveUserAccountToDatabase({
      user: createPopulatedUserAccount({ name: '' }),
      page,
    });

    await page.goto(path);

    expect(getPath(page)).toEqual('/onboarding/user-account');

    await deleteUserAccountFromDatabaseById(id);
  });
});
